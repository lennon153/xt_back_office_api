import { z } from "zod";

export const customerSchema = z.object({
  full_name: z.string().optional(),
  username: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  types: z.string().optional(),
});
