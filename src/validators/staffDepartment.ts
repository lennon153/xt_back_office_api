import {z} from "zod";

export const staffDepartmentSchema = z.object({
    department_code: z
        .string()
        .nonempty("department_code is required")
        .trim(),
    department_name: z
        .string()
        .nonempty("department_name is required")
        .trim()
});