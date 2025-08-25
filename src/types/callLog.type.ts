export interface CallLog{
    call_id: number;
    contact_id: number;
    point_id: number;
    staff_id: string; 
    call_status: string;
    call_note: string;
    call_start_at:Date;
    call_end_at: Date;
    next_action_at: Date;
}

export interface CallLogCreate{
    contact_id: number;
    point_id: number;
    staff_id: string; 
    call_status: string;
    call_note: string;
    call_start_at:Date;
    call_end_at: Date;
    next_action_at: Date;
}