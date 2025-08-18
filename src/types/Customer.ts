// src/models/customer.ts
export interface Customer {
  id?: number;
  customer_id?: string;
  full_name?: string | undefined;
  username: string;
  phone: string;
  email: string;
  types?: string | undefined;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedCustomers {
    data: Customer[];
    pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}