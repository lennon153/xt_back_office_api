import { Request, Response, NextFunction } from "express";
import { customerSchema } from "../validators/customer.schema";
import { Customer } from "../types/customer.type";
import { createCustomerService, deleteCustomer, getAllCustomersService, getCustomerByCustomerIdService, updateCustomerService } from "../services/customer.service";
import z, { ZodError } from "zod";
import { ApiResponse } from "../types/api.type";

export const createCustomerController = async (req: Request, res: Response) =>{
    try{
        const parsed = customerSchema.safeParse(req.body);
        if(!parsed.success) return res.status(400).json(parsed.error);

        const customer: Customer = parsed.data;
        const id = await createCustomerService(customer)
        
        res.status(201).json({message: "Customer created successfully",customerId: id,
    });
    } catch(err: any){
        res.status(500).json({message: err.message})
    }
}


// Zod schema for route parameter
const paramsSchema = z.object({
  customer_id: z.string().nonempty("Customer ID is required"),
});

export const getCustomerByCustomerIdController = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    // Validate params
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    const { customer_id } = parsed.data;

    // Call service
    const customer = await getCustomerByCustomerIdService(customer_id);

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (err) {
    console.error("Error fetching customer:", err);
    next(err);
  }
};


export const updateCustomerController = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) return res.status(400).json({ message: "Customer ID is required" });

    const id = parseInt(idParam, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid customer ID" });

    // Validate request body (allow partial updates)
    const parsed = customerSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      const zodError = parsed.error as ZodError;
      return res.status(400).json({ errors: zodError.format() });
    }

    // Cast parsed.data to Partial<Customer> to satisfy TypeScript
    const updated = await updateCustomerService(id, parsed.data as Partial<Customer>);

    if (!updated) return res.status(404).json({ message: "Customer not found" });

    res.json({ message: "Customer updated successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCustomerController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    await deleteCustomer(id);
    res.json({ message: "Customer deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// Zod schema for query params
const querySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional().default(""),
});

export const getAllCustomersController = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      });
    }

    const { page, limit, search } = parsed.data;
    const result = await getAllCustomersService(page, limit, search);

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: result,
    });
  } catch (err: any) {
    next(err);
  }
};