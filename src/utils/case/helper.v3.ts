import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";

// -------------------------------
// Get least busy user by valid role (telesales or crm)
// -------------------------------
const getNextUser = async (role: string, excludeUserIds: string[] = []) => {
  if (!["telesales", "crm"].includes(role)) {
    console.warn(`⚠️ Invalid role "${role}" passed to getNextUser`);
    return null;
  }

  const [rows]: any = await db.query(
    `
      SELECT u.id AS user_id, u.name AS user_name, COUNT(ca.assignment_id) AS total_cases
      FROM user u
      LEFT JOIN case_assignments ca ON u.id = ca.user_id
      WHERE u.role = ? AND u.banned = 0 
      ${excludeUserIds.length ? `AND u.id NOT IN (?)` : ""}
      GROUP BY u.id
      ORDER BY total_cases ASC
      LIMIT 1
     `,
    excludeUserIds.length ? [role, excludeUserIds] : [role]
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
  currentUserId: string, // Changed to string to match user.id type
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

  // Check current handler
  if (caseData.username_id) {
    const [currentUser]: any = await db.query(
      `SELECT role FROM user WHERE id = ? AND banned = 0`,
      [caseData.username_id]
    );
    
    // Keep current handler if they have the right role and are not banned
    if (currentUser.length && currentUser[0].role === role) {
      return caseData.username_id;
    }
  }

  // Get least busy user excluding previously assigned users
  const [assignedRows]: any = await db.query(
    `SELECT user_id FROM case_assignments WHERE case_id = ?`,
    [caseId]
  );
  const excludeUserIds = assignedRows.map((r: any) => r.user_id);

  const user = await getNextUser(role, excludeUserIds);
  if (!user) throw new Error(`No available user for role ${role}`);

  await db.query(
    `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, user.user_id, note ?? `Auto-assigned by system (${role})`]
  );

  await db.query(
    `UPDATE cases SET username_id = ?, update_at = NOW() WHERE case_id = ?`,
    [user.user_id, caseId]
  );

  return user.user_id;
};

// -------------------------------
// Daily rotation task (7-day cycle, 21-day freeze, respect current handler)
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    console.log("🚀 Starting daily rotation task (7-day per user)...");

    // Get all active cases and their current assignment duration
    const [rows]: any = await db.query(
      `SELECT 
         c.case_id, 
         c.case_status, 
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
        // Calculate how long current user has handled this case
        const assignmentDays = Math.floor(
          (Date.now() - new Date(c.current_assignment_date).getTime()) / 
          (1000 * 60 * 60 * 24)
        );

        console.log(`📅 Case ${c.case_id} - User ${c.user_id} has handled for ${assignmentDays} days`);

        // Skip if not yet 7 days
        if (assignmentDays < 7) {
          console.log(`⏭️ Skipping case ${c.case_id} - only ${assignmentDays} days with current user`);
          continue;
        }

        // Get deposit info to determine required role
        const lastDeposit = await getLastDepositDate(c.user_id);
        const hasDeposited = await getDepositCount(c.user_id);

        // Skip if recent deposit (within 7 days) - customer is active
        const lastDepositDays = lastDeposit
          ? Math.floor((Date.now() - lastDeposit.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        if (lastDepositDays < 7) {
          console.log(`⏭️ Skipping case ${c.case_id} - recent deposit (${lastDepositDays} days ago)`);
          continue;
        }

        const role = hasDeposited < 4 ? "telesales" : "crm";

        // Get all previously assigned users for this case
        const [assignedRows]: any = await db.query(
          `SELECT user_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
          [c.case_id]
        );
        const assignedUserIds = assignedRows.map((r: any) => r.user_id);

        // Find next available user
        const user = await getNextUser(role, assignedUserIds);
        
        if (user && user.user_id !== c.user_id) {
          // Rotate to new user
          await db.query(
            `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
             VALUES (?, ?, NOW(), ?)`,
            [c.case_id, user.user_id, `7-day rotation: Previous user handled for ${assignmentDays} days`]
          );
          
          await db.query(
            `UPDATE cases SET case_status = 'transferred', user_id = ?, update_at = NOW() WHERE case_id = ?`,
            [user.user_id, c.case_id]
          );
          
          console.log(`✅ Case ${c.case_id} rotated from user ${c.user_id} to user ${user.user_id} after ${assignmentDays} days`);
        } else {
          console.log(`ℹ️ No available user found for case ${c.case_id} or same user assigned`);
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
  "Daily Rotation Task (7-day per user)"
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

        // Get all previously assigned users
        const [assignedRows]: any = await db.query(
          `SELECT user_id FROM case_assignments WHERE case_id = ?`,
          [c.case_id]
        );
        const assignedUserIds = assignedRows.map((r: any) => r.user_id);

        const user = await getNextUser(role, assignedUserIds);
        if (user) {
          await db.query(
            `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
             VALUES (?, ?, NOW(), ?)`,
            [c.case_id, user.user_id, "Reassigned after 60-day freeze expired"]
          );
          await db.query(
            `UPDATE cases SET case_status = 'pending', username_id = ?, update_at = NOW() WHERE case_id = ?`,
            [user.user_id, c.case_id]
          );
          console.log(`✅ Unfroze case ${c.case_id}, assigned to user ${user.user_id}`);
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
    `);

    console.log("✅ Deposit sync completed");
  },
  {
    cronTime: "0 2 * * *", // Run daily at 2 AM
    timeZone: "Asia/Phnom_Penh",
  },
  "Sync Deposit Counts Task"
);