// src/validations/caseValidation.ts
import { z } from "zod";

export const createCaseSchema = z.object({
  contact_id: z.number(),
  username_id: z.number().optional().nullable().transform(val => val ?? undefined),
  case_type: z.enum(["deposit", "withdraw", "non_transactional"]),
  case_description: z.string().optional().nullable().transform(val => val ?? undefined),
  case_status: z.enum(["pending", "freeze", "transferred", "closed"]),
  priority: z.enum(["low", "normal", "urgent"]),
});

export const updateCaseSchema = z.object({
  contact_id: z.number().optional(),
  username_id: z.number().optional().nullable().transform(val => val ?? undefined),
  case_type: z.enum(["deposit", "withdraw", "non_transactional"]).optional(),
  case_description: z.string().optional().nullable().transform(val => val ?? undefined),
  case_status: z.enum(["pending", "freeze", "transferred", "closed"]).optional(),
  priority: z.enum(["low", "normal", "urgent"]).optional(),
});

// auto assigned
export const createCaseAssSchema = z.object({
  contact_id: z.number(),
  username_id: z.number().optional(),
  transaction_code: z.string(),
  case_type: z.enum(["deposit", "withdraw", "non_transactional"]).default("deposit"),
  case_description: z.string().optional(),
  priority: z.enum(["low", "normal", "urgent"]).default("normal"),
  user_id: z.string(),
  assignment_note: z.string().optional(),
});

export const updateCaseAssSchema = z.object({
  case_id: z.number(),
  case_description: z.string().optional(),
  case_status: z.enum(["pending", "freeze", "transferred", "closed"]).optional(),
  priority: z.enum(["low", "normal", "urgent"]).optional(),
});

export const reassignCaseSchema = z.object({
  case_id: z.number(),
  assigned_user_id: z.string().uuid(),
  assignment_note: z.string().optional(),
});

// ✅ Inferred Types
export type CreateCaseAssInput = z.infer<typeof createCaseAssSchema>;
export type UpdateCaseAssInput = z.infer<typeof updateCaseAssSchema>;
export type ReassignCaseInput = z.infer<typeof reassignCaseSchema>;