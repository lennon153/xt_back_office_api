import { z } from "zod";

export const contactChannelSchema = z.object({
  channel_code: z
    .string()
    .min(1, "Channel code is required")
    .max(20, "Channel code must not exceed 20 characters"),

  channel_name: z
    .string()
    .min(1, "Channel name is required")
    .max(50, "Channel name must not exceed 50 characters"),
});

export type ContactChannelCreate = z.infer<typeof contactChannelSchema>;
export const updateContactChannelSchema = contactChannelSchema.partial();
export type ContactChannelUpdate = z.infer<typeof updateContactChannelSchema>;