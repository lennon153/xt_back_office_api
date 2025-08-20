import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../configs/db";
import { Customer } from "../types/customer.type";

export const createCustomerRepository = async (customer: Customer) => {
  const connection = await db.getConnection(); // get transaction connection
  try {
    await connection.beginTransaction();

    // Insert new customer
    const [result]: any = await connection.query(
      `INSERT INTO tbl_customers (full_name, username, phone, email, types) 
       VALUES (?, ?, ?, ?, ?)`,
      [customer.full_name, customer.username, customer.phone, customer.email, customer.types]
    );

    // Generate customer_id
    const customerId = `CUST${String(result.insertId).padStart(3, "0")}`;

    // Update row with generated customer_id
    await connection.query(
      `UPDATE tbl_customers SET customer_id = ? WHERE id = ?`,
      [customerId, result.insertId]
    );

    await connection.commit();

    return { id: result.insertId, customerId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const getAllCustomersRepository = async (
  page: number = 1,
  limit: number = 10,
  search: string = ''
) => {
  const offset = (page - 1) * limit;
  let baseQuery = `FROM tbl_customers`;
  const queryParams: any[] = [];

  if (search) {
    baseQuery += ` WHERE full_name LIKE ? OR username LIKE ? OR email LIKE ? OR phone LIKE ? OR customer_id LIKE ?`;
    const searchParam = `%${search}%`;
    queryParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  try {
    const [countResult]: any = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, queryParams);
    const total = countResult[0].total;

    const [rows]: any = await db.query(
      `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      rows,
      total,
      page,
      limit,
    };
  } catch (err) {
    console.error("Error fetching customers:", err);
    throw err;
  }
};

export const getCustomerByCustomerIdRepository = async (
  customerId: string
): Promise<Customer | null> => {
  const [rows]: [RowDataPacket[], any] = await db.query(
    "SELECT * FROM tbl_customers WHERE customer_id = ?",
    [customerId]
  );
  if (!rows.length) return null;
  return rows[0] as Customer;
};

export const updateCustomerRepository = async (
  id: number,
  customer: Partial<Customer>
): Promise<ResultSetHeader | null> => {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE tbl_customers 
     SET full_name = ?, username = ?, phone = ?, email = ?, types = ? 
     WHERE id = ?`,
    [
      customer.full_name ?? null,
      customer.username ?? null,
      customer.phone ?? null,
      customer.email ?? null,
      customer.types ?? null,
      id,
    ]
  );

  // If no rows were affected, the customer ID does not exist
  if (result.affectedRows === 0) {
    return null;
  }

  return result;
};