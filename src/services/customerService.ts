import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../configs/db";
import { Customer, PaginatedCustomers } from "../types/Customer";
import { generateId } from "../utils/generateId";

export const createCustomer = async (customer: Customer) =>{

  const [result]: any = await db.query(
    `INSERT INTO tbl_customers (full_name, username, phone, email, types) 
     VALUES (?, ?, ?, ?, ?)`,
    [customer.full_name, customer.username, customer.phone, customer.email, customer.types]
  );

  // Auto increment ID from DB
  const customerId = `CUST${String(result.insertId).padStart(3, "0")}`;

  // Update row with generated customer_id
  await db.query(
    `UPDATE tbl_customers SET customer_id = ? WHERE id = ?`,
    [customerId, result.insertId]
  );

  return { id: result.insertId, customerId };
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

export const getAllCustomers = async (
    page: number = 1,
    limit: number = 10,
    search: string = ''
): Promise<PaginatedCustomers> => {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Base query
    let baseQuery = `FROM tbl_customers`;
    const queryParams: any[] = [];
    
    // Add search condition if provided
    if (search) {
        baseQuery += ` WHERE full_name LIKE ? OR username LIKE ? OR email LIKE ? OR phone LIKE ?`;
        const searchParam = `%${search}%`;
        queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    try {
        // Get total count
        const [countResult]: any = await db.query(
            `SELECT COUNT(*) as total ${baseQuery}`,
            queryParams
        );
        const total = countResult[0].total;
        
        // Get paginated data
        const [rows]: any = await db.query(
            `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );
        
        // Calculate pagination details
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrevious = page > 1;
        
        return {
            data: rows.map((row: any) => ({
                id: row.id,
                customer_id: row.customer_id,
                full_name: row.full_name,
                username: row.username,
                phone: row.phone,
                email: row.email,
                types: row.types,
                created_at: row.created_at
            })),
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNext,
                hasPrevious
            }
        };
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
};