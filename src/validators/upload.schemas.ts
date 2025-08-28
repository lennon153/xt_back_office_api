import { z } from "zod";

export const contactSchema = z.object({
  tel: z.string().nullable(),
  full_name: z.string().nullable(),
  contact_type: z.enum(['lead', 'customer']),
  register_date: z.date(),
  last_call_at: z.date(),
  personal_note: z.string(),
  contact_line: z.string(),
  create_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
  dob: z.date().nullable(),
});

export const callLogSchema = z.object({
    contact_id: z.number(),
    point_id: z.number().nullable(), // allow null
    user_id: z.number().nullable(),
    call_status: z.enum(['no_answer','connected_declined','callback','wrong_number','blocked','success']),
    call_note: z.string(),
    call_start_at: z.date(),
    call_end_at: z.date(),
    next_action_at: z.date().nullable(),
});

export const usernameSchema = z.object({
  contact_id: z.number(),
  platform_id: z.number().nullable().optional(),
  username: z.string(),
  username_status: z.string(),
  life_cycle: z.string(),
  has_deposited: z.number(),
  last_deposit: z.date().nullable(),
  vip_level: z.number(),
});
