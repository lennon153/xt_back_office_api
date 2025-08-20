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
  tel: NullableStr,                          // optional | null | "" → null
  full_name: NullableStr,                    // optional | null | "" → null
  contact_type: z.enum(["lead","customer"]).optional(),
  register_date: OptionalNullableDate,       // accepts Date or parsable string
  last_call_at: z.coerce.date(),             // required
  last_call_status: LastCallStatus,          // required & normalized
  personal_note: NullableStr,                // required in your interface → keep nullable but required
  contact_line: NullableStr,                 // required in your interface → keep nullable but required
  create_at: z.coerce.date(),                // required
  update_at: OptionalNullableDate,            // optional | null
  dob: z.coerce.date().optional().nullable(),
});

/** Inferred TS type after Zod transforms */
export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;
