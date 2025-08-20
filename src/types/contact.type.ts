import { Username } from "./username";

export interface Contact{
  contact_id: number;
  tel: string | null;
  full_name: string | null;
  contact_type: 'lead' | 'customer';
  register_date: Date | null;
  last_call_at: Date | null;
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
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}

// For creating new contacts where some fields are optional
export interface ContactCreate {
  tel?: string | null;
  full_name?: string | null;
  contact_type?: 'lead' | 'customer';
  register_date?: Date | null;
  // ... other optional fields for creation
}

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
}

export interface PaginatedContacts {
    data: Contact[];
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
export interface ContactDetail {
  contact_id: number;
  full_name: string;
  tel: string;
  contact_type: string;
  usernames: Username[]; // Array because one contact may have multiple usernames
}

export interface CallLogDetail {
  point_id: number;
  staff_id: number;
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
  call_logs: CallLogDetail[];
}

export interface ContactWithDetails {
  contact_id: number;
  full_name: string | null;
  tel: string | null;
  contact_type: "lead" | "customer";
  usernames: UsernameWithDetails[];
}
