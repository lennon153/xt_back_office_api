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