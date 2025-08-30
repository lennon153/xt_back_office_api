import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";

// -------------------------------
// Get least busy staff by valid role (telesales or crm)
// -------------------------------
const getNextStaff = async (role: string, excludeStaffIds: string[] = []) => {
  if (!["telesales", "crm"].includes(role)) {
    console.warn(`⚠️ Invalid role "${role}" passed to getNextStaff`);
    return null;
  }

  const [rows]: any = await db.query(
    `
      SELECT s.id AS staff_id, s.name AS staff_name, COUNT(ca.assignment_id) AS total_cases
      FROM staffs s
      LEFT JOIN case_assignments ca ON s.id = ca.staff_id
      WHERE s.role = ? AND s.banned = 0 
      ${excludeStaffIds.length ? `AND s.id NOT IN (?)` : ""}
      GROUP BY s.id
      ORDER BY total_cases ASC
      LIMIT 1
     `,
    excludeStaffIds.length ? [role, excludeStaffIds] : [role]
  );

  if (!rows.length) return null;
  return rows[0];
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
// Auto-assign case (respect current handler)
// -------------------------------
export const autoAssignCase = async (
  caseId: number,
  currentStaffId: string,
  note?: string
) => {
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

  if (lastDepositDays < 7) return null; // recent deposit, skip assignment

  const role = hasDeposited < 4 ? "telesales" : "crm";

  // Check if we should keep current staff
  if (currentStaffId) {
    const [currentStaff]: any = await db.query(
      `SELECT role FROM staffs WHERE id = ? AND banned = 0`,
      [currentStaffId]
    );
    
    // Keep current handler if they have the right role and are not banned
    if (currentStaff.length && currentStaff[0].role === role) {
      return currentStaffId;
    }
  }

  // Get least busy staff excluding previously assigned staff
  const [assignedRows]: any = await db.query(
    `SELECT staff_id FROM case_assignments WHERE case_id = ?`,
    [caseId]
  );
  const excludeStaffIds = assignedRows.map((r: any) => r.staff_id);

  const staff = await getNextStaff(role, excludeStaffIds);
  if (!staff) throw new Error(`No available staff for role ${role}`);

  await db.query(
    `INSERT INTO case_assignments (case_id, staff_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, staff.staff_id, note ?? `Auto-assigned by system (${role})`]
  );

  // Note: In your schema, cases.username_id refers to usernames, not staff
  // You might want to add a staff_id field to cases table or handle differently
  await db.query(
    `UPDATE cases SET update_at = NOW() WHERE case_id = ?`,
    [caseId]
  );

  return staff.staff_id;
};

// -------------------------------
// Daily rotation task (7-day cycle)
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    console.log("🚀 Starting daily rotation task (7-day per staff)...");

    // Get all active cases and their current assignment duration
    const [rows]: any = await db.query(
      `SELECT 
         c.case_id, 
         c.case_status, 
         ca.staff_id,
         ca.assign_at as current_assignment_date
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

    for (const c of rows) {
      try {
        // Calculate how long current staff has handled this case
        const assignmentDays = Math.floor(
          (Date.now() - new Date(c.current_assignment_date).getTime()) / 
          (1000 * 60 * 60 * 24)
        );

        console.log(`📅 Case ${c.case_id} - Staff ${c.staff_id} has handled for ${assignmentDays} days`);

        // Skip if not yet 7 days
        if (assignmentDays < 7) {
          console.log(`⏭️ Skipping case ${c.case_id} - only ${assignmentDays} days with current staff`);
          continue;
        }

        // Get the username_id for this case to check deposit info
        const [caseRows]: any = await db.query(
          `SELECT username_id FROM cases WHERE case_id = ?`,
          [c.case_id]
        );
        
        if (!caseRows.length) continue;
        
        const usernameId = caseRows[0].username_id;
        const lastDeposit = await getLastDepositDate(usernameId);
        const hasDeposited = await getDepositCount(usernameId);

        // Skip if recent deposit (within 7 days) - customer is active
        const lastDepositDays = lastDeposit
          ? Math.floor((Date.now() - lastDeposit.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        if (lastDepositDays < 7) {
          console.log(`⏭️ Skipping case ${c.case_id} - recent deposit (${lastDepositDays} days ago)`);
          continue;
        }

        const role = hasDeposited < 4 ? "telesales" : "crm";

        // Get all previously assigned staff for this case
        const [assignedRows]: any = await db.query(
          `SELECT staff_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
          [c.case_id]
        );
        const assignedStaffIds = assignedRows.map((r: any) => r.staff_id);

        // Find next available staff
        const staff = await getNextStaff(role, assignedStaffIds);
        
        if (staff && staff.staff_id !== c.staff_id) {
          // Rotate to new staff
          await db.query(
            `INSERT INTO case_assignments (case_id, staff_id, assign_at, assignment_note)
             VALUES (?, ?, NOW(), ?)`,
            [c.case_id, staff.staff_id, `7-day rotation: Previous staff handled for ${assignmentDays} days`]
          );
          
          await db.query(
            `UPDATE cases SET case_status = 'transferred', update_at = NOW() WHERE case_id = ?`,
            [c.case_id]
          );
          
          console.log(`✅ Case ${c.case_id} rotated from staff ${c.staff_id} to staff ${staff.staff_id} after ${assignmentDays} days`);
        } else {
          console.log(`ℹ️ No available staff found for case ${c.case_id} or same staff assigned`);
        }

      } catch (error) {
        console.error(`❌ Error processing case ${c.case_id}:`, error);
      }
    }

    console.log("🎯 Daily rotation task completed");
  },
  {
    cronTime: process.env.ROTATION_TASK_CRON || "0 7 * * *",
    timeZone: "Asia/Phnom_Penh",
  },
  "Daily Rotation Task (7-day per staff)"
);

// Similar fixes needed for unfreezeCasesTask and syncDepositsTask
// ... (implementation would follow similar pattern)