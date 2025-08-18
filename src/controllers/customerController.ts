import { Request, Response, NextFunction } from "express";
import { customerSchema } from "../validators/customer.schema";
import { Customer } from "../types/Customer";
import { createCustomer, deleteCustomer, getAllCustomers, getCustomerById, updateCustomer } from "../services/customerService";
import { ZodError } from "zod";

export const createCustomerController = async (req: Request, res: Response) =>{
    try{
        const parsed = customerSchema.safeParse(req.body);
        if(!parsed.success) return res.status(400).json(parsed.error);

        const customer: Customer = parsed.data;
        const id = await createCustomer(customer)
        
        res.status(201).json({message: "Customer created successfully",customerId: id,
    });
    } catch(err: any){
        res.status(500).json({message: err.message})
    }
}

export const getCustomerByIdController = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
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
    const updated = await updateCustomer(id, parsed.data as Partial<Customer>);

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

    const customer = await getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await deleteCustomer(id);
    res.json({ message: "Customer deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string || '';
        
        const result = await getAllCustomers(page, limit, search);
        
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching customers' });
    }
};