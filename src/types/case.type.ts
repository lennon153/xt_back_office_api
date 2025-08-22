export interface Case {
    case_id : number;
    contact_id: number;
    username_id?: number;
    case_type: 'deposit' | 'withdraw' | 'non_transactional';
    case_description?: string | null;
    case_status: 'pending' | 'freeze' | 'transferred' | 'closed';
    priority: 'low' | 'normal' | 'urgent';
    create_at: Date;
    update_at: Date;
}

export interface CaseResponse extends Omit<Case, "create_at" | "update_at"> {
  create_at: string | null;
  update_at: string | null;
}


export interface PaginatedCase{
    cases: Case[];
    pagination:{
        total: number;
        totalPage: number;
        currentPage: number;
        limit: number;
        hasNext: boolean;
        hasPrevious: boolean;
    }
}

export interface CreateCase {
  contact_id: number;
  username_id?: number | undefined;
  case_type: "deposit" | "withdraw" | "non_transactional";
  case_description?: string | null | undefined;
  case_status: "pending" | "freeze" | "transferred" | "closed";
  priority: "low" | "normal" | "urgent";
  create_at: Date;
  update_at: Date;
}

// Dedicated type for update
export type UpdateCase = Partial<{
  contact_id: number | undefined;
  username_id: number | null | undefined;
  case_type: "deposit" | "withdraw" | "non_transactional" | undefined;
  case_description: string | null | undefined;
  case_status: "pending" | "freeze" | "transferred" | "closed" | undefined;
  priority: "low" | "normal" | "urgent" | undefined;
}>;
