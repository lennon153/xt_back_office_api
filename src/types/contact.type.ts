import { Username } from "./username";

export interface Contact{
  contact_id: number;
  tel: string | null;
  full_name: string | null;
  contact_type: 'lead' | 'customer';
  register_date: Date | null;
  last_call_at: Date | null;
  dob: Date | null;
  last_call_status: 
    | 'no_answer'
    | 'connected_declined'
    | 'callback'
    | 'wrong_number'
    | 'blocked'
    | 'success'
    | null;
  personal_note: string | null;
  contact_line: string | null;
  create_at: Date;
  update_at: Date | null;
  delete_at: Date | null;
}

export type LastCallStatus =
  | "success"
  | "no_answer"
  | "connected_declined"
  | "callback"
  | "wrong_number"
  | "blocked";
  
// For creating new contacts where some fields are optional
export type ContactCreate = {
  tel: string | null | undefined;
  full_name: string | null | undefined;
  contact_type?: "lead" | "customer" | undefined;
  register_date: Date | null | undefined;
  last_call_at: Date;
  last_call_status: LastCallStatus;
  personal_note: string | null | undefined;
  contact_line: string | null | undefined;
  create_at: Date;
  update_at: Date | null | undefined;
  dob: Date | null | undefined;
};

// For updating contacts where most fields are optional
export interface ContactUpdate {
  tel?: string | null;
  full_name?: string | null;
  contact_type?: 'lead' | 'customer';
  last_call_at?: Date | null;
  last_call_status?: 
    | 'no_answer'
    | 'connected_declined'
    | 'callback'
    | 'wrong_number'
    | 'blocked'
    | 'success'
    | null;
  personal_note?: string | null;
  contact_line?: string | null;
  deleted_at?: Date | null;
  dob?: Date | null; // ✅ mark as optional
}

export interface PaginatedContacts {
    contacts: Contact[];
    pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

  //TODO fix Type later
export interface CallLogDetail {
  call_id: number;
  point_id: number;
  id: number;
  name:string;
  call_status:
    | "no_answer"
    | "connected_declined"
    | "callback"
    | "wrong_number"
    | "blocked"
    | "success"
    | string;
  call_start_at: string | null;
  call_end_at: string | null;
  next_action_at: string | null;
  channel_code: string;
  channel_name?: string;
}

export interface PlatformType {
  type_id: number;
  type_name: string;
}

export interface Platform {
  platform_id: number;
  platform_name: string;
  type: PlatformType;
}

export interface UsernameWithDetails {
  username_id: number;
  username: string;
  username_status: string | null;
  life_cycle: string | null;
  register_date: string | null;
  has_deposited: boolean | number;
  last_deposit: string | null;
  vip_level: number | null;
  platform: Platform;
}

export interface ContactWithDetails {
  contact:{
    contact_id: number;
    email: "";
    full_name: string | null;
    tel: string | null;
    call_note:string;
    contact_type: "lead" | "customer";
  }
  usernames: UsernameWithDetails[];
  call_logs: CallLogDetail[];
}
