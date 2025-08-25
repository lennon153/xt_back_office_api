import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";

interface StaffLoad {
  staff_id: number;
  total_cases: number;
}

// Find staff with the least number of cases
const getLeastBusyStaff = async (): Promise<StaffLoad | null> => {
  const [rows] = await db.query(
    `SELECT s.staff_id, COUNT(ca.assignment_id) AS total_cases
     FROM staff s
     LEFT JOIN case_assignments ca ON s.staff_id = ca.staff_id
     GROUP BY s.staff_id
     ORDER BY total_cases ASC
     LIMIT 1`
  );

  return (rows as StaffLoad[])[0] || null;
};

// Auto-assign case to the least busy staff
export const autoAssignCase = async (caseId: number, note?: string) => {
  const staff = await getLeastBusyStaff();
  if (!staff) throw new Error("No staff available for assignment");

  // Default note if none provided
  const assignmentNote = note ?? "Case auto-assigned by system";

  await db.query(
    `INSERT INTO case_assignments (case_id, staff_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, staff.staff_id, assignmentNote]
  );

  console.log(
    `Case ${caseId} assigned to staff ${staff.staff_id} (total before assignment = ${staff.total_cases}) with note: "${assignmentNote}"`
  );
};

// Daily deposit check + auto assignment
export const dailyDepositCheckTask = new AutoScheduler(
  async () => {
    console.log("🚀 Checking users with last deposit < 7 days...");

    const [rows] = await db.query(
      `
        SELECT 
          u.username_id, 
          u.contact_id, 
          u.platform_id, 
          u.username, 
          u.username_status, 
          u.life_cycle, 
          u.register_date, 
          u.has_deposited, 
          u.last_deposit, 
          u.vip_level,

          c.case_id,
          c.username_id,
          c.case_type,
          c.case_status,
          c.priority,
            
          ca.assignment_id,
          ca.case_id,
          ca.staff_id,
          ca.assign_at,
          ca.assignment_note

        FROM usernames u
        LEFT JOIN cases c
          ON c.username_id = u.username_id
        LEFT JOIN case_assignments ca
          ON c.case_id = ca.case_id
        WHERE u.last_deposit IS NOT NULL
          AND DATEDIFF(NOW(), u.last_deposit) < 7;
      `
    );

    const users = rows as { username_id: number; case_id: number | null }[];

    if (users.length === 0) {
      console.log("⚠️ No users found with last deposit < 7 days.");
      return;
    }

    for (const user of users) {
      if (user.case_id) {
        try {
          await autoAssignCase(
            user.case_id,
            `Auto-assigned due to last deposit < 7 days`
          );
        } catch (err) {
          console.error(`❌ Failed to assign case ${user.case_id}:`, err);
        }
      } else {
        console.log(`ℹ️ User ${user.username_id} has no case to assign.`);
      }
    }
  },
  {
    cronTime: process.env.DAILY_DEPOSIT_TASK_CRON || "0 7 * * *", // Run daily at 7AM
    timeZone: "Asia/Phnom_Penh",
  },
  "Daily Deposit Check Task"
);