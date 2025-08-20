import { Request, Response, NextFunction } from "express";
import { staffLevelSchema } from "../validators/staffLevel.schema";
import { StaffLevel } from "../types/staffLevel";
import { createStaffLevel, deleteStaffLevel, getAllStaffLevel, getStaffLevelById, updateStaffLevel } from "../services/staffLevel.service";
import { ZodError } from "zod";
import { HttpStatus } from "../constants/httpStatus";
import { AppError } from "../utils/customError";

export const createStaffLevelController = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const parsed = staffLevelSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error.format()
            });
        }

        // Use a type without 'id' for input
        const staffLevelInput: StaffLevel = parsed.data; // { level_code, level_name }

        // Insert into database, returns generated id
        const id = await createStaffLevel(staffLevelInput);

        // Respond with success
        res.status(201).json({ message: "Staff level created successfully",staffLevel: id});
        
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

export const getStaffLevelController = async (req: Request, res:Response)=>{
    try{
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string)|| 10;
        const search = req.query.search as string || '';

        const result = await getAllStaffLevel(page,limit,search);
        res.json(result)
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching customers' });
    }
}

export const getStaffLevelByIdController = async (req: Request, res: Response) =>{
    try{
        const idParam = req.params.id;
        if(!idParam){
            return res.status(400).json({message:"Staff level ID is required"})
        }

        // Strict number check
        if (!/^\d+$/.test(idParam)) {
        return res.status(400).json({ message: "Invalid customer ID" });
        }

        const id = parseInt(idParam,10);
        const staffLevel = await getStaffLevelById(id);
        if(!staffLevel){
            return res.status(404).json({message:"Staff level not found"})
        }

        res.json(staffLevel);

    } catch(err: any){
        res.status(500).json({message:err.message})
    }


}

export const updateStaffLevelController = async (req: Request, res: Response)=>{
    try{
        const idParam = req.params.id;
        if(!idParam) return res.status(400).json({message:"Staff level ID is required"});

        const id = parseInt(idParam, 10)
        if(isNaN(id)) return res.status(400).json({message:"Invalid staff level ID"})

        // Validate request body (allow partial updates)
        const parsed = staffLevelSchema.partial().safeParse(req.body);

        if(!parsed.success){
            const zodError = parsed.error as ZodError;
            return res.status(400).json({errors: zodError.format()});
        }

        // Cast parsed.data to Partial<StaffLevel> to satisfy TypeScript
        const updated = await updateStaffLevel(id,parsed.data as Partial<StaffLevel>);
        if(!updated) return res.status(400).json({message:"Staff level not found"});

        res.json({message:"Staff level updated successfully"})

    }catch(err: any){
        res.status(500).json({message: err.message})
    }
}

export const deleteStaffLevelController = async (req: Request, res: Response) =>{
    try{
        const id = Number(req.params.id);
        
        if(isNaN(id)){
            return res.status(400).json({message:"Invalid staff level ID"});
        }

        const staffLevel = await getStaffLevelById(id);
        if(!staffLevel){
          throw new AppError("Staff level not found", HttpStatus.NOT_FOUND);
        }

        await deleteStaffLevel(id);
        res.json({message:"Staff level deleted successfully"})
    } catch(err: any){
        res.status(500).json({message: err.message})
    }
}