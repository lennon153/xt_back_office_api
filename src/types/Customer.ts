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
