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
    `SELECT u.user_id, u.name AS user_name, COUNT(ca.assignment_id) AS total_cases
     FROM user u
     LEFT JOIN case_assignments ca ON u.user_id = ca.user_id
     WHERE u.role = ? ${excludeUserIds.length ? `AND u.user_id NOT IN (?)` : ""}
     GROUP BY u.user_id
     ORDER BY total_cases ASC
     LIMIT 1`,
    excludeUserIds.length ? [role, excludeUserIds] : [role]
  );

  if (!rows.length) return null;
  return rows[0];
};

// -------------------------------
// Auto-assign case (respect current handler)
// -------------------------------
export const autoAssignCase = async (
  caseId: number,
  currentUserId: number, // user performing the action
  note?: string
) => {
  const [caseRows]: any = await db.query(
    `SELECT has_deposit, last_deposit, username_id FROM cases WHERE case_id = ?`,
    [caseId]
  );
  if (!caseRows.length) throw new Error("Case not found");

  const caseData = caseRows[0];

  // Only assign if last deposit > 7 days
  const lastDepositDays = caseData.last_deposit
    ? Math.floor((Date.now() - new Date(caseData.last_deposit).getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  if (lastDepositDays < 7) return null; // recent deposit, skip assignment

  const role = caseData.has_deposit < 4 ? "telesales" : "crm";

  // Check current handler - FIXED: Use username_id from cases table
  if (caseData.username_id) {
    const [currentUser]: any = await db.query(`SELECT role FROM user WHERE user_id = ?`, [caseData.username_id]);
    // Only assign a new user if current handler is not available or wrong role
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

  await db.query(`UPDATE cases SET username_id = ?, update_at = NOW() WHERE case_id = ?`, [user.user_id, caseId]);

  return user.user_id;
};

// -------------------------------
// Daily rotation task (7-day cycle, 21-day freeze, respect current handler)
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    const [rows]: any = await db.query(
      `SELECT c.case_id, c.case_status, c.update_at, c.has_deposit, c.last_deposit, c.username_id
       FROM cases c
       WHERE c.case_status IN ('pending','transferred')
         AND c.has_deposit = 0` // Only rotate cases with no deposits
    );

    for (const c of rows) {
      const daysSinceLastUpdate = Math.floor((Date.now() - new Date(c.update_at).getTime()) / (1000 * 60 * 60 * 24));
      
      // Skip if case was updated in the last 7 days
      if (daysSinceLastUpdate < 7) continue;

      const userRole = "telesales"; // All no-deposit cases go to telesales

      // Get all previously assigned users for this case
      const [assignedRows]: any = await db.query(
        `SELECT user_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
        [c.case_id]
      );
      const assignedUserIds = assignedRows.map((r: any) => r.user_id);

      if (daysSinceLastUpdate >= 7 && daysSinceLastUpdate < 21) {
        // Rotate to next available user
        const user = await getNextUser(userRole, assignedUserIds);
        if (user && user.user_id !== c.username_id) {
          await db.query(
            `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
             VALUES (?, ?, NOW(), ?)`,
            [c.case_id, user.user_id, `7-day rotation`]
          );
          await db.query(
            `UPDATE cases SET case_status = 'transferred', username_id = ?, update_at = NOW() WHERE case_id = ?`,
            [user.user_id, c.case_id]
          );
        }
      } else if (daysSinceLastUpdate >= 21) {
        // Freeze after 21 days no activity
        await db.query(
          `UPDATE cases SET case_status = 'freeze', update_at = NOW() WHERE case_id = ?`,
          [c.case_id]
        );
      }
    }
  },
  {
    cronTime: process.env.ROTATION_TASK_CRON || "0 7 * * *",
    timeZone: "Asia/Phnom_Penh",
  },
  "Daily Rotation Task"
);

// -------------------------------
// Unfreeze frozen cases after 60 days
// -------------------------------
export const unfreezeCasesTask = new AutoScheduler(
  async () => {
    const [rows]: any = await db.query(
      `SELECT c.case_id, c.username_id, c.has_deposit, c.last_deposit, c.update_at
       FROM cases c
       WHERE c.case_status = 'freeze'
         AND DATE_ADD(c.update_at, INTERVAL 60 DAY) <= NOW()`
    );

    for (const c of rows) {
      const daysSinceLastDeposit = c.last_deposit
        ? Math.floor((Date.now() - new Date(c.last_deposit).getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
      
      // Skip if recent deposit (within 7 days)
      if (daysSinceLastDeposit < 7) continue;

      const role = c.has_deposit < 4 ? "telesales" : "crm";
      
      // Get all previously assigned users to avoid reassigning to same users
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
      }
    }
  },
  {
    cronTime: process.env.UNFREEZE_TASK_CRON || "0 7 * * *",
    timeZone: "Asia/Phnom_Penh",
  },
  "Unfreeze Cases Task After 60 Days"
);