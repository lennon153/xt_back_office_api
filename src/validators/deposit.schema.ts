import {z} from "zod"

export const createDepositSchema = z.object({
    case_id: z.number().int().positive("Case id is required"),
    deposit_code: z.string().min(1,"Deposit code is required"),
    user_id: z.number().int().positive("User id is required"),
    amount: z.number().positive("Amount must be greater than 0"),
    deposit_at:z.coerce.date()
})

// Inferred TypeScript type
export type CreateDepositInput = z.infer<typeof createDepositSchema>;