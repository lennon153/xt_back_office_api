import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../configs/db";
import { Customer, PaginatedCustomers } from "../types/customer.type";
import { AppError } from "../utils/customError";
import { HttpStatus } from "../constants/httpStatus";
import { createCustomerRepository, getAllCustomersRepository, getCustomerByCustomerIdRepository, updateCustomerRepository } from "../repository/customer.repository";

export const createCustomerService = async (customer: Customer) => {
  if (!customer.full_name || !customer.username || !customer.phone) {
    throw new AppError("Missing required fields", HttpStatus.BAD_REQUEST);
  }
  const result = await createCustomerRepository (customer);
  return result; // { id, customerId }
};

export const getCustomerByCustomerIdService = async (
  customerId: string
): Promise<Customer> => {
  const customer = await getCustomerByCustomerIdRepository(customerId);
  if (!customer) {
    throw new AppError("Customer not found", HttpStatus.NOT_FOUND);
  }
  return customer;
};


export const updateCustomerService = async (
  id: number,
  customer: Partial<Customer>
) => {
  const result = await updateCustomerRepository(id, customer);
  if (!result) {
    throw new AppError("Customer not found", HttpStatus.NOT_FOUND);
  }
  return { message: "Customer updated successfully" };
};

export const deleteCustomer = async (id: number) => {
  const [result] = await db.query("DELETE FROM tbl_customers WHERE id = ?", [id]);
  return result;
};

export const getAllCustomersService = async (
  page: number = 1,
  limit: number = 10,
  search: string = ''
): Promise<PaginatedCustomers> => {
  const { rows, total } = await getAllCustomersRepository(page, limit, search);

  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map((row: any) => ({
      id: row.id,
      customer_id: row.customer_id,
      full_name: row.full_name,
      username: row.username,
      phone: row.phone,
      email: row.email,
      types: row.types,
      created_at: row.created_at,
    })),
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
};