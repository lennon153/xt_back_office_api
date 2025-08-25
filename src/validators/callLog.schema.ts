import { z } from "zod"

export const CallLogCreateSchema = z.object({
  contact_id: z.number().int().positive(),
  point_id: z.number().int().positive(),
  call_status: z.string().min(1, "call_status is required"),
  call_note: z.string().default(""),  
  call_start_at: z.coerce.date(),
  call_end_at: z.coerce.date(),
  next_action_at: z.coerce.date()
});


export type CallLogCreateSchema = z.infer<typeof CallLogCreateSchema>