import {email, z} from "zod";

export const staffSchema = z.object({
    staff_id: z
        .number()
        .int("staff_id must be an integer")
        .positive("staff_id must be positive"),
    department_code: z
        .string()
        .nonempty("department_code is required")
        .trim(),
    level_code: z
        .string()
        .nonempty("level_code is required")
        .trim(),
    full_name: z
        .string()
        .nonempty("full_name is required")
        .trim(),
    email: z
        .string()
        .nonempty("email is required")
        .email("Invalid email format")
        .trim()
});