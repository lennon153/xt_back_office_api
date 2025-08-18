import { z } from "zod";

export const staffLevelSchema = z.object({
    level_code: z.string().nonempty("level_code is required").trim(),
    level_name: z.string().nonempty("level_name is required").trim()
});
