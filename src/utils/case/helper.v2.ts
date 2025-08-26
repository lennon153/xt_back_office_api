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
        u.role, 
        s.createdAt, 
        s.expiresAt
     FROM session s
     JOIN user u ON s.userId = u.id
     WHERE s.token = ?`,
    [token]
  );

  if (!rows.length) throw new Error("Invalid token");
  const session = rows[0];
  if (new Date(session.expiresAt) <= new Date()) throw new Error("Session expired");

  return { userId: session.userId, role: session.role };
};

// -------------------------------
// Get system user token dynamically
// -------------------------------
const getSystemUserToken = async (): Promise<string> => {
  const [rows]: any = await db.query(
    `SELECT s.token 
     FROM session s
     JOIN user u ON s.userId = u.id
     WHERE u.role = 'system' AND s.expiresAt > NOW()
     ORDER BY s.createdAt DESC
     LIMIT 1`
  );
  if (!rows.length) throw new Error("No active system token found");
  return rows[0].token;
};

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
const autoAssignCase = async (
  caseId: number,
  usernameId: number,
  userToken: string,
  note?: string
) => {
  const { role: triggeredRole } = await getUserRoleByToken(userToken);

  // Get deposit count
  const [userRows]: any = await db.query(
    `SELECT has_deposited FROM usernames WHERE username_id = ?`,
    [usernameId]
  );
  if (!userRows.length) throw new Error("Username not found");
  const hasDeposited = userRows[0].has_deposited;

  // Assign role based on has_deposited
  const role = hasDeposited < 3 ? "telesales" : "crm";

  // Exclude previous users
  const [assignedRows]: any = await db.query(
    `SELECT user_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
    [caseId]
  );
  const excludeUserIds = assignedRows.map((r: any) => r.user_id);

  // Pick next available user
  const user = await getNextUser(role, excludeUserIds);
  if (!user) throw new Error(`No available user for role ${role}`);

  // Insert new assignment
  await db.query(
    `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, user.user_id, note ?? `Auto-assigned by system (${triggeredRole})`]
  );

  console.log(`✅ Case ${caseId} assigned to user ${user.user_id} (${role})`);
  return user.user_id;
};

// -------------------------------
// Daily rotation task (7/14/21 days)
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    console.log("🔍 Running rotation task...");

    const systemToken = await getSystemUserToken();

    const [rows]: any = await db.query(
      `SELECT 
        u.username_id, 
        c.case_id, 
        c.case_status,
        c.update_at AS case_updated_at
      FROM usernames u
      JOIN cases c ON c.username_id = u.username_id
      WHERE u.last_deposit IS NOT NULL
        AND c.case_status IN ('pending','transferred')`
    );

    for (const c of rows) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(c.case_updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const [assignedRows]: any = await db.query(
        `SELECT user_id FROM case_assignments WHERE case_id = ?`,
        [c.case_id]
      );
      const assignedCount = assignedRows.length;

      if (assignedCount < 3 && daysSinceUpdate >= 7) {
        // Auto-transfer rotation
        await autoAssignCase(
          c.case_id,
          c.username_id,
          systemToken,
          `Rotation #${assignedCount + 1}`
        );
        await db.query(
          `UPDATE cases SET case_status = 'transferred', update_at = NOW() WHERE case_id = ?`,
          [c.case_id]
        );
        console.log(`🔄 Case ${c.case_id} rotated (${assignedCount + 1}/3)`);
      } else if (assignedCount >= 3 && daysSinceUpdate >= 21) {
        // Freeze case after 21 days
        await db.query(
          `UPDATE cases SET case_status = 'frozen', update_at = NOW() WHERE case_id = ?`,
          [c.case_id]
        );
        console.log(`⏸ Case ${c.case_id} frozen after 21 days`);
      }
    }
  },
  {
    cronTime: process.env.ROTATION_TASK_CRON || "0 7 * * *", // run every day at 7AM
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

    const systemToken = await getSystemUserToken();

    const [rows]: any = await db.query(
      `SELECT case_id, username_id FROM cases
       WHERE case_status = 'frozen'
         AND NOW() >= update_at + INTERVAL 60 DAY`
    );

    for (const c of rows) {
      await db.query(
        `UPDATE cases SET case_status = 'pending', update_at = NOW() WHERE case_id = ?`,
        [c.case_id]
      );
      await autoAssignCase(
        c.case_id,
        c.username_id,
        systemToken,
        "Reassigned after 60-day freeze expired"
      );
      console.log(`🔄 Case ${c.case_id} unfrozen and reassigned`);
    }
  },
  {
    cronTime: process.env.UNFREEZE_TASK_CRON || "0 7 * * *", // run daily at 7AM
    timeZone: "Asia/Phnom_Penh",
  },
  "UnfreezeCasesTask"
);