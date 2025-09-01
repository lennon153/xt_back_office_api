// src/models/models.ts
export interface Contact {
    tel: string | null;
    full_name: string | null;
    contact_type: 'lead' | 'customer';
    register_date: Date;
    last_call_at: Date;
    personal_note: string;
    contact_line: string;
    create_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    dob: Date| null;
}

export interface CallLog {
    contact_id: number;
    point_id: number | null; // nullable
    user_id: string | null;
    call_status: 'no_answer' | 'connected_declined' | 'callback' | 'wrong_number' | 'blocked' | 'success';
    call_note: string;
    call_start_at: Date;
    call_end_at: Date;
    next_action_at: Date | null;
}

export interface Username {
    contact_id: number;
    platform_id?: number | null;
    username: string;
    username_status: string;
    life_cycle: string;
    has_deposited: number;
    last_deposit: Date| null;
    vip_level: number;
}
