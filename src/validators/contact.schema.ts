import { z } from "zod";

/** Reusable helpers */
const NullableStr = z.string().trim().min(1).optional().nullable().transform(v => (v === "" ? null : v));
const OptionalNullableDate = z.coerce.date().optional().nullable();

/** Normalize status (accepts the common typo "no_anser" and fixes it) */
const LastCallStatus = z
  .enum(["no_answer","connected_declined","callback","wrong_number","blocked","success"])
  .or(z.literal("no_anser"))
  .transform(s => (s === "no_anser" ? "no_answer" : s));

export const ContactCreateSchema = z.object({
  tel: NullableStr,
  full_name: NullableStr,
  contact_type: z.enum(["lead", "customer"]).optional().nullable(),
  register_date: OptionalNullableDate,
  last_call_at: z.coerce.date(),
  last_call_status: LastCallStatus,
  personal_note: NullableStr,
  contact_line: NullableStr,
  create_at: z.coerce.date(),
  update_at: OptionalNullableDate,
  dob: z.coerce.date().optional().nullable(),
}).transform((data) => ({
  ...data,
  contact_type: data.contact_type ?? undefined, // Convert null to undefined
}));

/** Inferred TS type after Zod transforms */
export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;
