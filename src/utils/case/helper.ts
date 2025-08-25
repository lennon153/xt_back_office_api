
import { db } from "../../configs/db";
import { AutoScheduler } from "../autoScheduler";
// -------------------------------
// Helper: Get least busy staff (excluding current staff)


// -------------------------------
const getNextStaff = async (excludeStaffIds: string[] = []) => {
  const [rows] = await db.query(
    `SELECT s.staff_id, COUNT(ca.assignment_id) AS total_cases
     FROM staff s
     LEFT JOIN case_assignments ca ON s.staff_id = ca.staff_id
     ${excludeStaffIds.length > 0 ? `WHERE s.staff_id NOT IN (?)` : ""}
     GROUP BY s.staff_id
     ORDER BY total_cases ASC
     LIMIT 1`,
    excludeStaffIds.length > 0 ? [excludeStaffIds] : []
  );

  return (rows as any[])[0] || null;
};

// -------------------------------
// Auto-assign case to a staff
// -------------------------------
const autoAssignCase = async (caseId: number, note?: string, excludeStaffIds: string[] = []) => {
  const staff = await getNextStaff(excludeStaffIds);
  if (!staff) throw new Error("No staff available for assignment");

  const assignmentNote = note ?? "Auto-transfer by system";
  await db.query(
    `INSERT INTO case_assignments (case_id, staff_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, staff.staff_id, assignmentNote]
  );

  console.log(`✅ Case ${caseId} assigned to staff ${staff.staff_id}`);
  return staff.staff_id;
};

// -------------------------------
// Daily Task: Rotate assignments every 7 days
// -------------------------------
export const dailyRotationTask = new AutoScheduler(
  async () => {
    console.log("🔍 Running 7-day rotation task...");

    const [rows] = await db.query(
      `
      SELECT c.case_id, c.case_status, c.updatedAt
      FROM cases c
      WHERE c.case_status IN ('pending','transferred');
      `
    );

    const cases = rows as { case_id: number; case_status: string; updatedAt: Date }[];

    for (const c of cases) {
      const daysSinceLastUpdate = Math.floor(
        (new Date().getTime() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get previous assignments for this case
      const [assignments]: any = await db.query(
        `SELECT staff_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
        [c.case_id]
      );
      const assignedStaffIds = assignments.map((a: any) => a.staff_id);

      if (daysSinceLastUpdate >= 7 && assignedStaffIds.length < 3) {
        // Rotate to next staff
        await autoAssignCase(c.case_id, `Auto-transfer rotation #${assignedStaffIds.length + 1}`, assignedStaffIds);
        await db.query(`UPDATE cases SET case_status = 'transferred', updatedAt = NOW() WHERE case_id = ?`, [c.case_id]);
      } else if (assignedStaffIds.length >= 3) {
        // Freeze after 3 rotations (21 days)
        await db.query(`UPDATE cases SET case_status = 'frozen', updatedAt = NOW() WHERE case_id = ?`, [c.case_id]);
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
// Daily Task: Unfreeze frozen cases
// -------------------------------
export const unfreezeCasesTask = new AutoScheduler(
  async () => {
    console.log("🔍 Checking frozen cases to unfreeze...");

    const [rows] = await db.query(
      `SELECT case_id, updatedAt FROM cases
       WHERE case_status = 'frozen'
         AND NOW() >= updatedAt`
    );

    const frozenCases = rows as { case_id: number; updatedAt: Date }[];

    for (const c of frozenCases) {
      await db.query(`UPDATE cases SET case_status = 'pending', updatedAt = NOW() WHERE case_id = ?`, [c.case_id]);
      await autoAssignCase(c.case_id, "Reassigned after 60-day freeze expired");
      console.log(`🔄 Case ${c.case_id} unfrozen and reassigned`);
    }
  },
  {
    cronTime: process.env.UNFREEZE_TASK_CRON || "0 8 * * *",
    timeZone: "Asia/Phnom_Penh",
  },
  "UnfreezeCasesTask"
);
