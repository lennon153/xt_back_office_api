import { db } from "../../configs/db";


interface User {
  id: number;
  total_cases: number;
}

// Find user with the least number of cases
export const getLeastBusyStaff = async (): Promise<User | null> => {
  const [rows] = await db.query(
    `
      SELECT s.id, s.name, COUNT(ca.assignment_id) AS total_cases
      FROM user s
      LEFT JOIN case_assignments ca ON s.id = ca.user_id
      WHERE s.role IN ('telesales', 'crm')  -- only these roles
      GROUP BY s.id
      ORDER BY total_cases ASC
      LIMIT 1
    `
  );

  return (rows as User[])[0] || null;
};

export const autoAssignCase = async (caseId: number, note?: string) => {
  const user = await getLeastBusyStaff();
  if (!user) throw new Error("No user available for assignment");

  // Default note if none provided
  const assignmentNote = note ?? "Case auto-assigned by system";

  await db.query(
    `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
     VALUES (?, ?, NOW(), ?)`,
    [caseId, user.id, assignmentNote]
  );

  console.log(
    `Case ${caseId} assigned to user ${user.id} (total before assignment = ${user.total_cases}) with note: "${assignmentNote}"`
  );
};

