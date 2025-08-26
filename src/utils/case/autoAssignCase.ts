import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";

// -------------------------------
// Get least busy user by role
// -------------------------------
const getNextUser = async (role: string, excludeUserIds: string[] = []) => {
  const [rows]: any = await db.query(
    `SELECT u.id AS user_id, COUNT(ca.assignment_id) AS total_cases
     FROM user u
     LEFT JOIN case_assignments ca ON u.id = ca.user_id
     WHERE u.role = ? ${excludeUserIds.length ? `AND u.id NOT IN (?)` : ""}
     GROUP BY u.id
     ORDER BY total_cases ASC
     LIMIT 1`,
    excludeUserIds.length ? [role, excludeUserIds] : [role]
  );

  return rows[0] || null;
};

// -------------------------------
// Auto-assign case based on has_deposited
// -------------------------------
export const autoAssignCase = async (
  caseId: number,
  usernameId: number,
  note?: string
) => {
  // 1️⃣ Get username's has_deposited
  const [userRows]: any = await db.query(
    `SELECT has_deposited FROM usernames WHERE username_id = ?`,
    [usernameId]
  );
  if (userRows.length === 0) throw new Error("Username not found");
  const hasDeposited = userRows[0].has_deposited;

  // 2️⃣ Decide user role to assign
  const role = hasDeposited < 3 ? "telesales" : "crm";

  // 3️⃣ Get previous assignments for exclusion
  const [assignedRows]: any = await db.query(
    `SELECT user_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
    [caseId]
  );
  const excludeUserIds = assignedRows.map((r: any) => r.user_id);

  // 4️⃣ Pick least busy user
  const user = await getNextUser(role, excludeUserIds);
  if (!user) throw new Error(`No available user for role ${role}`);

  // 5️⃣ Insert new assignment
  await db.query(
    `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, user.user_id, note ?? `Auto-assigned by system (${role})`]
  );

  // 6️⃣ Update case handler
  await db.query(
    `UPDATE cases SET handler_id = ?, update_at = NOW() WHERE case_id = ?`,
    [user.user_id, caseId]
  );

  console.log(`✅ Case ${caseId} assigned to user ${user.user_id} (${role})`);
  return user.user_id;
};

// -------------------------------
// Daily rotation task
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    console.log("🔍 Running 7-day rotation task...");

    const [rows]: any = await db.query(
      `SELECT 
        u.username_id, 
        c.case_id, 
        c.case_status,
        c.update_at,
        u.has_deposited,
        u.last_deposit
      FROM usernames u
      JOIN cases c ON c.username_id = u.username_id
      WHERE u.last_deposit IS NOT NULL
        AND c.case_status IN ('pending','transferred')`
    );

    for (const c of rows) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(c.update_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Count previous assignments
      const [assignedRows]: any = await db.query(
        `SELECT user_id FROM case_assignments WHERE case_id = ?`,
        [c.case_id]
      );
      const assignedCount = assignedRows.length;

      // Check if 7 days have passed since last update AND last deposit was more than 7 days ago
      const daysSinceLastDeposit = Math.floor(
        (Date.now() - new Date(c.last_deposit).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate >= 7 && daysSinceLastDeposit >= 7) {
        if (assignedCount < 3) {
          // Rotate to next user based on current deposit status
          await autoAssignCase(
            c.case_id,
            c.username_id,
            `Rotation #${assignedCount + 1} - No deposit in 7 days`
          );
          await db.query(
            `UPDATE cases SET case_status = 'transferred', update_at = NOW() WHERE case_id = ?`,
            [c.case_id]
          );
          console.log(`🔄 Case ${c.case_id} rotated (${assignedCount + 1}/3 rotations)`);
        } else if (assignedCount >= 3) {
          // Freeze after 3 rotations (21 days)
          await db.query(
            `UPDATE cases SET case_status = 'frozen', update_at = NOW() WHERE case_id = ?`,
            [c.case_id]
          );
          console.log(`⏸ Case ${c.case_id} frozen after 21 days rotation`);
        }
      }
    }
  },
  {
    cronTime: process.env.ROTATION_TASK_CRON || "0 7 * * *", // daily at 7AM
    timeZone: "Asia/Phnom_Penh",
  },
  "Daily Rotation Task"
);

// -------------------------------
// Unfreeze frozen cases after 60 days
// -------------------------------
export const unfreezeCasesTask = new AutoScheduler(
  async () => {
    console.log("🔍 Checking frozen cases to unfreeze...");

    const [rows]: any = await db.query(
      `SELECT c.case_id, c.username_id, u.has_deposited 
       FROM cases c
       JOIN usernames u ON c.username_id = u.username_id
       WHERE c.case_status = 'frozen'
         AND NOW() >= c.update_at + INTERVAL 60 DAY`
    );

    for (const c of rows) {
      // Check current deposit status to determine role assignment
      const role = c.has_deposited < 3 ? "telesales" : "crm";
      
      // Get least busy user for the appropriate role
      const user = await getNextUser(role, []);
      
      if (user) {
        // Update case status and assign to new user
        await db.query(
          `UPDATE cases SET case_status = 'pending', handler_id = ?, update_at = NOW() WHERE case_id = ?`,
          [user.user_id, c.case_id]
        );
        
        // Create new assignment record
        await db.query(
          `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
           VALUES (?, ?, NOW(), ?)`,
          [c.case_id, user.user_id, "Reassigned after 60-day freeze expired"]
        );
        
        console.log(`🔄 Case ${c.case_id} unfrozen and assigned to ${user.user_id} (${role})`);
      } else {
        console.warn(`⚠️ No available ${role} user for case ${c.case_id}`);
      }
    }
  },
  {
    cronTime: process.env.UNFREEZE_TASK_CRON || "0 7 * * *", // daily at 7AM
    timeZone: "Asia/Phnom_Penh",
  },
  "Unfreeze Cases Task After 60 Day"
);