export interface Username{
  username_id: number;
  contact_id: number;
  platform_id: number;
  username: string;
  username_status: 'active' | 'banned' | 'blocked';
  life_cycle: 'NC' | 'TLS' | 'CRM';
  register_date: Date | null;
  has_deposited: boolean; // TINYINT(1) maps well to boolean
  last_deposit: string | null; // DATE as string (YYYY-MM-DD)
  vip_level: number | null;
}

// For creating new username records
export interface UsernameCreate {
  contact_id: number;
  platform_id: number;
  username: string;
  username_status?: 'active' | 'banned' | 'blocked';
  life_cycle?: 'NC' | 'TLS' | 'CRM';
  register_date?: Date | null;
  has_deposited?: boolean;
  last_deposit?: string | null;
  vip_level?: number | null;
}

// For updating existing username records
export type UsernameUpdate = {
  contact_id?: number | undefined;
  platform_id?: number | undefined;
  username?: string | undefined;
  username_status?: "active" | "inactive" | undefined;
  life_cycle?: string | undefined;
  register_date?: Date | undefined;
  has_deposited?: boolean | undefined;
  last_deposit?: Date | undefined;
  vip_level?: number | undefined;
};