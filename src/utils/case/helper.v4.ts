import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";

// -------------------------------
// Get least busy staff by valid role (with fallback options)
// -------------------------------
const getNextStaff = async (role: string, excludeStaffIds: string[] = []) => {
  if (!["telesales", "crm"].includes(role)) {
    console.warn(`⚠️ Invalid role "${role}" passed to getNextStaff`);
    return null;
  }

  try {
    // First try: Get least busy staff excluding previous assignees
    const [rows]: any = await db.query(
      `
        SELECT s.id AS user_id, s.name AS staff_name, COUNT(ca.assignment_id) AS total_cases
        FROM user s
        LEFT JOIN case_assignments ca ON s.id = ca.user_id
        WHERE s.role = ? AND s.banned = 0 
        ${excludeStaffIds.length ? `AND s.id NOT IN (?)` : ""}
        GROUP BY s.id
        ORDER BY total_cases ASC
        LIMIT 1
       `,
      excludeStaffIds.length ? [role, excludeStaffIds] : [role]
    );

    if (rows.length) return rows[0];

    // Second try: If no staff available excluding previous, try including them
    console.log(`ℹ️ No available ${role} staff excluding previous assignees, trying with all staff...`);
    
    const [fallbackRows]: any = await db.query(
      `
        SELECT s.id AS user_id, s.name AS staff_name, COUNT(ca.assignment_id) AS total_cases
        FROM user s
        LEFT JOIN case_assignments ca ON s.id = ca.user_id
        WHERE s.role = ? AND s.banned = 0 
        GROUP BY s.id
        ORDER BY total_cases ASC
        LIMIT 1
       `,
      [role]
    );

    if (fallbackRows.length) {
      console.log(`✅ Found fallback staff: ${fallbackRows[0].user_id}`);
      return fallbackRows[0];
    }

    // Third try: If no staff in required role, try the other role
    console.log(`ℹ️ No ${role} staff available, trying alternative role...`);
    
    const alternativeRole = role === "telesales" ? "crm" : "telesales";
    const [altRows]: any = await db.query(
      `
        SELECT s.id AS user_id, s.name AS staff_name, COUNT(ca.assignment_id) AS total_cases
        FROM user s
        LEFT JOIN case_assignments ca ON s.id = ca.user_id
        WHERE s.role = ? AND s.banned = 0 
        GROUP BY s.id
        ORDER BY total_cases ASC
        LIMIT 1
       `,
      [alternativeRole]
    );

    if (altRows.length) {
      console.log(`✅ Found alternative role staff: ${altRows[0].user_id} (${alternativeRole})`);
      return altRows[0];
    }

    console.error(`❌ No staff available for any role`);
    return null;

  } catch (error) {
    console.error("❌ Error in getNextStaff:", error);
    return null;
  }
};

// -------------------------------
// Get deposit count from usernames table
// -------------------------------
const getDepositCount = async (usernameId: number): Promise<number> => {
  const [rows]: any = await db.query(
    `SELECT has_deposited FROM usernames WHERE username_id = ?`,
    [usernameId]
  );
  
  if (!rows.length) return 0;
  return parseInt(rows[0].has_deposited) || 0;
};

// -------------------------------
// Get last deposit date from usernames table
// -------------------------------
const getLastDepositDate = async (usernameId: number): Promise<Date | null> => {
  const [rows]: any = await db.query(
    `SELECT last_deposit FROM usernames WHERE username_id = ?`,
    [usernameId]
  );
  
  if (!rows.length || !rows[0].last_deposit) return null;
  return new Date(rows[0].last_deposit);
};

// -------------------------------
// Get current assigned staff for a case
// -------------------------------
const getCurrentAssignedStaff = async (caseId: number): Promise<string | null> => {
  const [rows]: any = await db.query(
    `SELECT user_id FROM case_assignments 
     WHERE case_id = ? 
     ORDER BY assign_at DESC 
     LIMIT 1`,
    [caseId]
  );
  
  if (!rows.length) return null;
  return rows[0].user_id;
};

// -------------------------------
// Auto-assign case (respect current handler)
// -------------------------------
export const autoAssignCase = async (
  caseId: number,
  note?: string
) => {
  // Get case information including username_id
  const [caseRows]: any = await db.query(
    `SELECT username_id FROM cases WHERE case_id = ?`,
    [caseId]
  );
  
  if (!caseRows.length) throw new Error("Case not found");
  const caseData = caseRows[0];

  if (!caseData.username_id) {
    throw new Error("Case has no username_id reference");
  }

  // Get deposit info from usernames table
  const lastDeposit = await getLastDepositDate(caseData.username_id);
  const hasDeposited = await getDepositCount(caseData.username_id);

  // Only assign if last deposit > 7 days or no deposit
  const lastDepositDays = lastDeposit
    ? Math.floor((Date.now() - lastDeposit.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  if (lastDepositDays < 7) {
    console.log(`⏭️ Skipping case ${caseId} assignment - recent deposit (${lastDepositDays} days ago)`);
    return null; // recent deposit, skip assignment
  }

  const role = hasDeposited < 4 ? "telesales" : "crm";

  // Check current assigned staff
  const currentStaffId = await getCurrentAssignedStaff(caseId);
  
  if (currentStaffId) {
    const [currentStaff]: any = await db.query(
      `SELECT role FROM user WHERE id = ? AND banned = 0`,
      [currentStaffId]
    );
    
    // Keep current handler if they have the right role and are not banned
    if (currentStaff.length && currentStaff[0].role === role) {
      console.log(`✅ Keeping current staff ${currentStaffId} for case ${caseId} - correct role`);
      return currentStaffId;
    }
  }

  // Get least busy staff excluding previously assigned staff
  const [assignedRows]: any = await db.query(
    `SELECT user_id FROM case_assignments WHERE case_id = ?`,
    [caseId]
  );
  const excludeStaffIds = assignedRows.map((r: any) => r.user_id);

  const staff = await getNextStaff(role, excludeStaffIds);
  if (!staff) throw new Error(`No available staff for role ${role}`);

  // Assign to new staff
  await db.query(
    `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, staff.user_id, note ?? `Auto-assigned by system (${role})`]
  );

  // Update case status if needed
  await db.query(
    `UPDATE cases SET case_status = 'pending', update_at = NOW() WHERE case_id = ?`,
    [caseId]
  );

  console.log(`✅ Case ${caseId} assigned to staff ${staff.user_id} (${role})`);
  return staff.user_id;
};

// -------------------------------
// Enhanced daily rotation task (7-day cycle)
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    console.log("🚀 Starting enhanced daily rotation task...");

    // Get all active cases and their current assignment
    const [rows]: any = await db.query(
      `SELECT 
         c.case_id, 
         c.case_status, 
         ca.user_id,
         ca.assign_at as current_assignment_date,
         c.username_id
       FROM cases c
       JOIN case_assignments ca ON c.case_id = ca.case_id
       WHERE c.case_status IN ('pending','transferred')
         AND ca.assignment_id = (
           SELECT MAX(assignment_id) 
           FROM case_assignments 
           WHERE case_id = c.case_id
         )`
    );

    console.log(`📊 Found ${rows.length} active cases to check`);

    // Debug: Check available staff
    const [telesalesStaff]: any = await db.query(
      `SELECT id, name FROM user WHERE role = 'telesales' AND banned = 0`
    );
    const [crmStaff]: any = await db.query(
      `SELECT id, name FROM user WHERE role = 'crm' AND banned = 0`
    );

    console.log(`👥 Available Telesales staff: ${telesalesStaff.length}`);
    console.log(`👥 Available CRM staff: ${crmStaff.length}`);
    console.log("Telesales:", telesalesStaff.map((s: any) => s.name));
    console.log("CRM:", crmStaff.map((s: any) => s.name));

    let rotatedCount = 0;
    let skippedCount = 0;

    for (const c of rows) {
      try {
        // Calculate how long current staff has handled this case
        const assignmentDays = Math.floor(
          (Date.now() - new Date(c.current_assignment_date).getTime()) / 
          (1000 * 60 * 60 * 24)
        );

        console.log(`\n📅 Case ${c.case_id} - Staff ${c.user_id} has handled for ${assignmentDays} days`);

        // Skip if not yet 7 days
        if (assignmentDays < 7) {
          console.log(`⏭️ Skipping - only ${assignmentDays} days with current staff`);
          skippedCount++;
          continue;
        }

        // Get deposit info to determine required role
        const lastDeposit = await getLastDepositDate(c.username_id);
        const hasDeposited = await getDepositCount(c.username_id);

        // Skip if recent deposit (within 7 days) - customer is active
        const lastDepositDays = lastDeposit
          ? Math.floor((Date.now() - lastDeposit.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        if (lastDepositDays < 7) {
          console.log(`⏭️ Skipping - recent deposit (${lastDepositDays} days ago)`);
          skippedCount++;
          continue;
        }

        const role = hasDeposited < 4 ? "telesales" : "crm";
        console.log(`🎯 Required role: ${role} (${hasDeposited} deposits)`);

        // Get all previously assigned staff for this case
        const [assignedRows]: any = await db.query(
          `SELECT user_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
          [c.case_id]
        );
        const assignedStaffIds = assignedRows.map((r: any) => r.user_id);
        
        console.log(`📋 Previously assigned staff: ${assignedStaffIds.length}`);

        // Find next available staff with enhanced logic
        const staff = await getNextStaff(role, assignedStaffIds);
        
        if (!staff) {
          console.log(`❌ No staff available for case ${c.case_id}`);
          skippedCount++;
          continue;
        }

        if (staff.user_id === c.user_id) {
          console.log(`ℹ️ Same staff assigned - keeping current handler`);
          skippedCount++;
          continue;
        }

        // Rotate to new staff
        await db.query(
          `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
           VALUES (?, ?, NOW(), ?)`,
          [c.case_id, staff.user_id, `7-day rotation: Previous staff handled for ${assignmentDays} days`]
        );
        
        await db.query(
          `UPDATE cases SET case_status = 'transferred', update_at = NOW() WHERE case_id = ?`,
          [c.case_id]
        );
        
        console.log(`✅ Rotated from ${c.user_id} to ${staff.user_id} after ${assignmentDays} days`);
        rotatedCount++;

      } catch (error) {
        console.error(`❌ Error processing case ${c.case_id}:`, error);
        skippedCount++;
      }
    }

    console.log(`\n🎯 Rotation completed: ${rotatedCount} rotated, ${skippedCount} skipped`);
  },
  {
    cronTime: process.env.ROTATION_TASK_CRON || "0 7 * * *",
    timeZone: "Asia/Phnom_Penh",
  },
  "Enhanced Daily Rotation Task"
);

// -------------------------------
// Unfreeze frozen cases after 60 days
// -------------------------------
export const unfreezeCasesTask = new AutoScheduler(
  async () => {
    console.log("🚀 Starting unfreeze task...");

    const [rows]: any = await db.query(
      `SELECT c.case_id, c.username_id, c.update_at
       FROM cases c
       WHERE c.case_status = 'freeze'
         AND DATE_ADD(c.update_at, INTERVAL 60 DAY) <= NOW()
         AND c.username_id IS NOT NULL`
    );

    console.log(`📊 Found ${rows.length} frozen cases to process`);

    for (const c of rows) {
      try {
        // Get deposit info from usernames table
        const lastDeposit = await getLastDepositDate(c.username_id);
        const hasDeposited = await getDepositCount(c.username_id);

        // Skip if recent deposit
        const lastDepositDays = lastDeposit
          ? Math.floor((Date.now() - lastDeposit.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        if (lastDepositDays < 7) {
          console.log(`⏭️ Skipping frozen case ${c.case_id} - recent deposit`);
          continue;
        }

        const role = hasDeposited < 4 ? "telesales" : "crm";

        // Get all previously assigned staff
        const [assignedRows]: any = await db.query(
          `SELECT user_id FROM case_assignments WHERE case_id = ?`,
          [c.case_id]
        );
        const assignedStaffIds = assignedRows.map((r: any) => r.user_id);

        const staff = await getNextStaff(role, assignedStaffIds);
        if (staff) {
          await db.query(
            `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
             VALUES (?, ?, NOW(), ?)`,
            [c.case_id, staff.user_id, "Reassigned after 60-day freeze expired"]
          );
          await db.query(
            `UPDATE cases SET case_status = 'pending', update_at = NOW() WHERE case_id = ?`,
            [c.case_id]
          );
          console.log(`✅ Unfroze case ${c.case_id}, assigned to staff ${staff.user_id}`);
        }
      } catch (error) {
        console.error(`❌ Error unfreezing case ${c.case_id}:`, error);
      }
    }

    console.log("🎯 Unfreeze task completed");
  },
  {
    cronTime: process.env.UNFREEZE_TASK_CRON || "0 7 * * *",
    timeZone: "Asia/Phnom_Penh",
  },
  "Unfreeze Cases Task After 60 Days"
);

// -------------------------------
// Sync deposit counts from deposits table to usernames table
// -------------------------------
export const syncDepositsTask = new AutoScheduler(
  async () => {
    console.log("🔄 Syncing deposit counts...");

    // Update has_deposited and last_deposit in usernames table
    await db.query(`
      UPDATE usernames u
      JOIN (
        SELECT 
          c.username_id,
          COUNT(d.deposit_id) as deposit_count,
          MAX(d.deposit_at) as last_deposit_date
        FROM cases c
        LEFT JOIN deposits d ON c.case_id = d.case_id
        WHERE d.deposit_id IS NOT NULL
        GROUP BY c.username_id
      ) AS deposit_data ON u.username_id = deposit_data.username_id
      SET 
        u.has_deposited = deposit_data.deposit_count,
        u.last_deposit = deposit_data.last_deposit_date
      WHERE u.has_deposited != deposit_data.deposit_count 
         OR u.last_deposit != deposit_data.last_deposit_date
         OR (u.has_deposited IS NULL AND deposit_data.deposit_count IS NOT NULL)
         OR (u.last_deposit IS NULL AND deposit_data.last_deposit_date IS NOT NULL)
    `);

    // Also update usernames with no deposits to zero
    await db.query(`
      UPDATE usernames u
      LEFT JOIN cases c ON u.username_id = c.username_id
      LEFT JOIN deposits d ON c.case_id = d.case_id
      SET 
        u.has_deposited = 0,
        u.last_deposit = NULL
      WHERE d.deposit_id IS NULL 
        AND (u.has_deposited IS NULL OR u.has_deposited > 0)
    `);

    console.log("✅ Deposit sync completed");
  },
  {
    cronTime: "0 2 * * *", // Run daily at 2 AM
    timeZone: "Asia/Phnom_Penh",
  },
  "Sync Deposit Counts Task"
);