import { z } from "zod";

// Create schema
export const createPlatformSchema = z.object({
  type_id: z.number().int().refine(val => val > 0, { message: "type_id is required and must be positive" }),
  platform_name: z
    .string()
    .min(1, "platform_name is required")
    .max(100, "platform_name must not exceed 100 characters"),
});

// Update schema (partial)
export const updatePlatformSchema = createPlatformSchema.partial();

// Types
export type PlatformCreate = z.infer<typeof createPlatformSchema>;
export type PlatformUpdate = z.infer<typeof updatePlatformSchema>;
