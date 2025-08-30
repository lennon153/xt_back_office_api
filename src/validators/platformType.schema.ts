import { z } from "zod";

// Create schema: platform_name is required
export const createPlatformSchema = z.object({
  type_name: z
    .string()
    .min(1, "Platform name is required")
    .max(100, "Platform name must not exceed 100 characters"),
});

// Update schema: partial, platform_name is optional
export const updatePlatformSchema = createPlatformSchema.partial();

// TypeScript types
export type PlatformCreate = z.infer<typeof createPlatformSchema>;
export type PlatformUpdate = z.infer<typeof updatePlatformSchema>;
