import {z} from "zod";

export const createUsernameSchema = z.object({
  contact_id: z.number(),
  platform_id: z.number().refine((val) => val !== null && val !== undefined, {
    message: "Platform ID cannot be null",
  }),
  username: z.string(),
  username_status: z.string(),
  life_cycle: z.string(),
  register_date: z.coerce.date(),
  has_deposited: z.number(),
  last_deposit: z.coerce.date(),
  vip_level: z.number(),
})

export type createUsernameSchema = z.input<typeof createUsernameSchema>;


export const updateUsernameSchema = z.object({
  contact_id: z.number().optional(),
  platform_id: z.number().optional(),
  username: z.string().optional(),
  username_status: z.enum(["active", "inactive"]).optional(),
  life_cycle: z.string().optional(),
  register_date: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  has_deposited: z
    .union([z.boolean(), z.number()])
    .optional()
    .transform((val) => (typeof val === "number" ? Boolean(val) : val)),
  last_deposit: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  vip_level: z.number().optional(),
});


export type updateUsernameSchema = z.input<typeof updateUsernameSchema>;