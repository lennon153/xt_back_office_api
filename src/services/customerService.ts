import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../configs/db";
import { Customer } from "../types/Customer";
import { generateId } from "../utils/generateId";

export const createCustomer = async (customer: Customer) =>{
  const customerId = generateId("CUST");
  const [result] = await db.query(
        `INSERT INTO tbl_customers (customer_id, full_name, username, phone, email, types)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      customerId,
      customer.full_name || null,
      customer.username,
      customer.phone,
      customer.email,
      customer.types || null,
    ]
  );
  return (result as any).insertId;
};

export const getCustomerById = async (id: number): Promise<Customer | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM tbl_customers WHERE id = ?",
    [id]
  );

  // rows is typed as RowDataPacket[], so we cast to Customer
  return (rows[0] as Customer) || null;
};

export const updateCustomer = async (id: number, customer: Partial<Customer>) => {
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
      id
    ]
  );

  // If no rows were affected, the customer ID does not exist
  if (result.affectedRows === 0) {
    return null;
  }

  return result;
};

export const deleteCustomer = async (id: number) => {
  const [result] = await db.query("DELETE FROM tbl_customers WHERE id = ?", [id]);
  return result;
};