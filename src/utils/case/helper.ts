
// import { db } from "../../configs/db";
// import { AutoScheduler } from "../autoScheduler";

// // -------------------------------
// // Helper: Get least busy user (excluding current user)
// // -------------------------------
// const getNextStaff = async (excludeUserIds: string[] = []) => {
//   const [rows] = await db.query(
//     `SELECT us.id, COUNT(ca.assignment_id) AS total_cases
//      FROM user us
//      LEFT JOIN case_assignments ca ON us.id = ca.user_id
//      ${excludeUserIds.length > 0 ? `WHERE us.id NOT IN (?)` : ""}
//      GROUP BY us.id
//      ORDER BY total_cases ASC
//      LIMIT 1`,
//     excludeUserIds.length > 0 ? [excludeUserIds] : []
//   );

//   return (rows as any[])[0] || null;
// };

// // -------------------------------
// // Auto-assign case to a user
// // -------------------------------
// const autoAssignCase = async (caseId: number, note?: string, excludeUserIds: string[] = []) => {
//   const user = await getNextStaff(excludeUserIds);
//   if (!user) throw new Error("No user available for assignment");

//   const assignmentNote = note ?? "Auto-transfer by system";
//   await db.query(
//     `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
//      VALUES (?, ?, NOW(), ?)`,
//     [caseId, user.user_id, assignmentNote]
//   );

//   console.log(`✅ Case ${caseId} assigned to user ${user.user_id}`);
//   return user.user_id;
// };

// // -------------------------------
// // Daily Task: Rotate assignments every 7 days
// // -------------------------------
// export const dailyRotationTask = new AutoScheduler(
//   async () => {
//     console.log("🔍 Running 7-day rotation task...");

//     const [rows] = await db.query(
//       `
//       SELECT c.case_id, c.case_status, c.update_at
//       FROM cases c
//       WHERE c.case_status IN ('pending','transferred');
//       `
//     );

//     const cases = rows as { case_id: number; case_status: string; updatedAt: Date }[];

//     for (const c of cases) {
//       const daysSinceLastUpdate = Math.floor(
//         (new Date().getTime() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
//       );

//       // Get previous assignments for this case
//       const [assignments]: any = await db.query(
//         `SELECT user_id FROM case_assignments WHERE case_id = ? ORDER BY assign_at ASC`,
//         [c.case_id]
//       );
//       const assignedStaffIds = assignments.map((a: any) => a.user_id);

//       if (daysSinceLastUpdate >= 7 && assignedStaffIds.length < 3) {
//         // Rotate to next user
//         await autoAssignCase(c.case_id, `Auto-transfer rotation #${assignedStaffIds.length + 1}`, assignedStaffIds);
//         await db.query(`UPDATE cases SET case_status = 'transferred', update_at = NOW() WHERE case_id = ?`, [c.case_id]);
//       } else if (assignedStaffIds.length >= 3) {

//         // Freeze after 3 rotations (21 days)
//         await db.query(`UPDATE cases SET case_status = 'frozen', update_at = NOW() WHERE case_id = ?`, [c.case_id]);
//         console.log(`⏸ Case ${c.case_id} frozen after 21 days rotation`);
//       }
//     }
//   },
//   {
//     cronTime: process.env.ROTATION_TASK_CRON || "0 7 * * *", // daily 7AM
//     timeZone: "Asia/Phnom_Penh",
//   },
//   "DailyRotationTask"
// );

// // -------------------------------
// // Daily Task: Unfreeze frozen cases
// // -------------------------------
// export const unfreezeCasesTask = new AutoScheduler(
//   async () => {
//     console.log("🔍 Checking frozen cases to unfreeze...");

//     const [rows] = await db.query(
//       `SELECT case_id, update_at FROM cases
//        WHERE case_status = 'frozen'
//          AND NOW() >= update_at`
//     );

//     const frozenCases = rows as { case_id: number; updatedAt: Date }[];

//     for (const c of frozenCases) {
//       await db.query(`UPDATE cases SET case_status = 'pending', update_at = NOW() WHERE case_id = ?`, [c.case_id]);
//       await autoAssignCase(c.case_id, "Reassigned after 60-day freeze expired");
//       console.log(`🔄 Case ${c.case_id} unfrozen and reassigned`);
//     }
//   },
//   {
//     cronTime: process.env.UNFREEZE_TASK_CRON || "0 7 * * *",
//     timeZone: "Asia/Phnom_Penh",
//   },
//   "UnfreezeCasesTask"
// );
