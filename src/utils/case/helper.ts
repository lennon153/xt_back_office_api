import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";

// -------------------------------
// Get least busy staff by role (telesales or crm)
// -------------------------------
const getNextStaff = async (role: string, excludeStaffIds: string[] = []) => {
  if (!["telesales", "crm"].includes(role)) return null;

  const [rows]: any = await db.query(
    `SELECT s.id AS staff_id, s.name AS staff_name, COUNT(ca.assignment_id) AS total_cases
     FROM staffs s
     LEFT JOIN case_assignments ca ON s.id = ca.staff_id
     WHERE s.role = ? ${excludeStaffIds.length ? `AND s.id NOT IN (?)` : ""} 
     GROUP BY s.id
     ORDER BY total_cases ASC
     LIMIT 1`,
    excludeStaffIds.length ? [role, excludeStaffIds] : [role]
  );

  if (!rows.length) return null;
  return rows[0];
};

// -------------------------------
// Daily rotation task (7-day rotation, 3 rotations max → freeze)
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    const [cases]: any = await db.query(
      `SELECT case_id, case_status, update_at, has_deposit, last_deposit, username_id, rotation_count
       FROM cases
       WHERE case_status IN ('pending','transferred')`
    );

    for (const c of cases) {
      const lastDepositDays = c.last_deposit
        ? Math.floor((Date.now() - new Date(c.last_deposit).getTime()) / (1000*60*60*24))
        : Infinity;
      if (lastDepositDays < 7) continue; // skip recent deposits

      const daysSinceUpdate = Math.floor((Date.now() - new Date(c.update_at).getTime()) / (1000*60*60*24));
      const role = c.has_deposit < 4 ? "telesales" : "crm";

      if (c.has_deposit > 0) continue; // keep current handler if deposit exists

      if (c.rotation_count < 3 && daysSinceUpdate >= 7) {
        // Rotate to next staff
        const [assignedRows]: any = await db.query(
          `SELECT staff_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
          [c.case_id]
        );
        const excludeStaffIds = assignedRows.map((a: any) => a.staff_id);
        const staff = await getNextStaff(role, excludeStaffIds);

        if (staff && staff.staff_id !== c.username_id) {
          await db.query(
            `INSERT INTO case_assignments (case_id, staff_id, assign_at, assignment_note)
             VALUES (?, ?, NOW(), ?)`,
            [c.case_id, staff.staff_id, `Rotation ${c.rotation_count + 1}`]
          );

          await db.query(
            `UPDATE cases 
             SET username_id=?, rotation_count=rotation_count+1, case_status='transferred', update_at=NOW()
             WHERE case_id=?`,
            [staff.staff_id, c.case_id]
          );
        }
      } else if (c.rotation_count >= 3) {
        // Freeze after 3 rotations
        await db.query(
          `UPDATE cases SET case_status='freeze', update_at=NOW() WHERE case_id=?`,
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
    const [cases]: any = await db.query(
      `SELECT case_id, username_id, has_deposit, last_deposit, rotation_count
       FROM cases
       WHERE case_status = 'freeze'
         AND NOW() >= update_at + INTERVAL 60 DAY`
    );

    for (const c of cases) {
      const lastDepositDays = c.last_deposit
        ? Math.floor((Date.now() - new Date(c.last_deposit).getTime()) / (1000*60*60*24))
        : Infinity;
      if (lastDepositDays < 7) continue; // skip recent deposits

      const role = c.has_deposit < 4 ? "telesales" : "crm";

      if (!c.username_id) {
        const staff = await getNextStaff(role, []);
        if (staff) {
          await db.query(
            `INSERT INTO case_assignments (case_id, staff_id, assign_at, assignment_note)
             VALUES (?, ?, NOW(), ?)`,
            [c.case_id, staff.staff_id, "Unfrozen after 60-day freeze"]
          );

          await db.query(
            `UPDATE cases 
             SET case_status='pending', username_id=?, rotation_count=0, update_at=NOW() 
             WHERE case_id=?`,
            [staff.staff_id, c.case_id]
          );
        }
      } else {
        // keep current handler if exists
        await db.query(
          `UPDATE cases SET case_status='pending', rotation_count=0, update_at=NOW() WHERE case_id=?`,
          [c.case_id]
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
