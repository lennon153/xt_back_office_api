import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";


// -------------------------------
// Get user role from session token
// -------------------------------
const getUserRoleByToken = async (token: string) => {
  const [rows]: any = await db.query(
    `SELECT 
        s.token, 
        u.id AS userId,
        u.name AS createdBy, 
        u.role, 
        s.createdAt AS createdAt,
        s.expiresAt
     FROM session s
     JOIN user u ON s.userId = u.id
     WHERE s.token = ?`,
    [token]
  );

  if (rows.length === 0) throw new Error("Invalid token");

  const session = rows[0];
  if (new Date(session.expiresAt) <= new Date()) throw new Error("Session expired");

  return { userId: session.userId, role: session.role, name: session.createdBy };
};

// -------------------------------
// Get least busy staff by role
// -------------------------------
const getNextStaff = async (role: string, excludeStaffIds: string[] = []) => {
  const [rows]: any = await db.query(
    `
    SELECT s.user_id, COUNT(ca.assignment_id) AS total_cases
    FROM staff s
    LEFT JOIN case_assignments ca ON s.user_id = ca.user_id
    WHERE s.role = ? ${excludeStaffIds.length ? `AND s.user_id NOT IN (?)` : ""}
    GROUP BY s.user_id
    ORDER BY total_cases ASC
    LIMIT 1
    `,
    excludeStaffIds.length ? [role, excludeStaffIds] : [role]
  );

  return rows[0] || null;
};

// -------------------------------
// Auto-assign case based on has_deposited
// -------------------------------
const autoAssignCase = async (
  caseId: number,
  usernameId: number,
  userToken: string,
  note?: string
) => {
  // 1️⃣ Check triggering user (session token)
  const { name: triggeredBy, role: triggeredRole } = await getUserRoleByToken(userToken);

  // 2️⃣ Get username's has_deposited
  const [userRows]: any = await db.query(
    `SELECT has_deposited FROM usernames WHERE username_id = ?`,
    [usernameId]
  );
  if (userRows.length === 0) throw new Error("Username not found");
  const hasDeposited = userRows[0].has_deposited;

  // 3️⃣ Decide staff role to assign
  const role = hasDeposited < 3 ? "telesales" : "crm";

  // 4️⃣ Get previous assignments for exclusion
  const [assignedRows]: any = await db.query(
    `SELECT user_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
    [caseId]
  );
  const excludeStaffIds = assignedRows.map((r: any) => r.user_id);

  // 5️⃣ Pick least busy staff
  const staff = await getNextStaff(role, excludeStaffIds);
  if (!staff) throw new Error(`No available staff for role ${role}`);

  // 6️⃣ Insert assignment
  await db.query(
    `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, staff.user_id, note ?? `Auto-assigned by ${triggeredBy} (${triggeredRole})`]
  );

  console.log(`✅ Case ${caseId} assigned to staff ${staff.user_id} (${role}) by ${triggeredBy}`);
  return staff.user_id;
};

// -------------------------------
// Daily rotation task
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    console.log("🔍 Running 7-day rotation task...");

    const [rows]: any = await db.query(
      `
      SELECT 
        u.username_id, 
        c.case_id, 
        c.case_status,
        c.update_at
      FROM usernames u
      LEFT JOIN cases c ON c.username_id = u.username_id
      WHERE u.last_deposit IS NOT NULL
        AND DATEDIFF(NOW(), u.last_deposit) < 7
        AND c.case_status IN ('pending','transferred')
      `
    );

    for (const c of rows) {
      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - new Date(c.update_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Count previous assignments
      const [assignedRows]: any = await db.query(
        `SELECT user_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
        [c.case_id]
      );
      const assignedCount = assignedRows.length;

      if (assignedCount < 3 && daysSinceUpdate >= 7) {
        // Rotate to next staff
        await autoAssignCase(c.case_id, c.username_id, process.env.SYSTEM_USER_TOKEN!, `Rotation #${assignedCount + 1}`);
        await db.query(`UPDATE cases SET case_status = 'transferred', update_at = NOW() WHERE case_id = ?`, [c.case_id]);
      } else if (assignedCount >= 3) {
        // Freeze after 3 rotations (21 days)
        await db.query(`UPDATE cases SET case_status = 'frozen', update_at = NOW() WHERE case_id = ?`, [c.case_id]);
        console.log(`⏸ Case ${c.case_id} frozen after 21 days rotation`);
      }
    }
  },
  {
    cronTime: process.env.ROTATION_TASK_CRON || "0 9 * * *", // daily 9AM
    timeZone: "Asia/Phnom_Penh",
  },
  "DailyRotationTask"
);

// -------------------------------
// Unfreeze frozen cases after 60 days
// -------------------------------
export const unfreezeCasesTask = new AutoScheduler(
  async () => {
    console.log("🔍 Checking frozen cases to unfreeze...");

    const [rows]: any = await db.query(
      `SELECT case_id, username_id FROM cases
       WHERE case_status = 'frozen'
         AND NOW() >= update_at + INTERVAL 60 DAY`
    );

    for (const c of rows) {
      await db.query(`UPDATE cases SET case_status = 'pending', update_at = NOW() WHERE case_id = ?`, [c.case_id]);
      await autoAssignCase(c.case_id, c.username_id, process.env.SYSTEM_USER_TOKEN!, "Reassigned after 60-day freeze expired");
      console.log(`🔄 Case ${c.case_id} unfrozen and reassigned`);
    }
  },
  {
    cronTime: process.env.UNFREEZE_TASK_CRON || "0 8 * * *", // daily 8AM
    timeZone: "Asia/Phnom_Penh",
  },
  "UnfreezeCasesTask"
);