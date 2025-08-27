export interface Deposit {
    deposit_id: number;
    case_id: number;
    deposit_code: string;
    user_id: string;
    amount: number;
    currency: string;
    deposit_at?: Date;
}

