import { z } from "zod";

export const createContactPointSchema = z.object({
  contact_id: z.number(),
  channel_code: z.string(),
  value_raw: z.string(),
  value_norm: z.string(),
  is_primary: z.boolean().optional().default(false), // 0 or 1 in DB
  verify_at: z.preprocess((val) => val ? new Date(val as string) : null, z.date().optional()),
});

export type CreateContactPointInput = z.infer<typeof createContactPointSchema>;

// -----------------------------
// Update DTO (partial, optional fields)
// -----------------------------
export const contactPointUpdateSchema = z.object({
  contact_id: z.number().optional(), // optional, will come from req.body or req.params
  channel_code: z.string().min(1).optional().transform(v => v),
  value_raw: z.string().min(1).optional().transform(v => v),
  value_norm: z.string().min(1).optional().transform(v => v),
  is_primary: z.number().int().min(0).max(1).optional().transform(v => v),
  verify_at: z.coerce.date().nullable().optional(),
});

// Type
export type ContactPointUpdate = z.infer<typeof contactPointUpdateSchema>;