import { z } from "zod";

export const lastCallStatusEnum = z.enum([
  "no_answer",
  "connected_declined",
  "callback",
  "wrong_number",
  "blocked",
  "success",
]);

export const contactSchema = z
  .object({
    contact_id: z.number().int().positive(),

    tel: z
      .string()
      .trim()
      .min(5, "Tel must be at least 5 characters")
      .max(20, "Tel must be at most 20 characters")
      .nullable(),

    full_name: z
      .string()
      .trim()
      .min(1, "Full name cannot be empty")
      .max(255)
      .nullable(),

    contact_type: z.enum(["lead", "customer"]),

    register_date: z.coerce.date().nullable(),
    last_call_at: z.coerce.date().nullable(),
    last_call_status: lastCallStatusEnum.nullable(),

    personal_note: z.string().max(2000).nullable(),
    contact_line: z.string().max(255).nullable(),

    created_at: z.coerce.date(),
    updated_at: z.coerce.date().nullable(),
    deleted_at: z.coerce.date().nullable(),
  })
  .strict();

// Type derived from the schema (matches your interface shape)
export type ContactParsed = z.infer<typeof contactSchema>;
