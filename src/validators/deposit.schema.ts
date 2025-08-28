import {z} from "zod"

export const createDepositSchema = z.object({
  case_id: z.number().int().positive("Case id is required"), // ✅ number, not Number
  deposit_code: z.string().min(1, "Deposit code is required"),
  user_id: z.string().min(1,"User id is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  deposit_at: z.preprocess((arg) => {
    // If missing or null, use current time
    if (arg === undefined || arg === null || arg === "") return new Date();
    // If string or number, convert to Date
    if (typeof arg === "string" || typeof arg === "number") return new Date(arg);
    // If already a Date object, keep it
    if (arg instanceof Date) return arg;
    return undefined; // invalid input
  }, z.date()),
});

// Inferred TypeScript type
export type CreateDepositInput = z.infer<typeof createDepositSchema>;