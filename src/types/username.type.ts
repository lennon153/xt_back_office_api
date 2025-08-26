export interface Username {
    username_id: number
    contact_id: number;
    platform_id?: number;
    username: string;
    username_status: string;
    life_cycle: string;
    register_date: Date;
    has_deposited: number;
    last_deposit: Date;
    vip_level: number;
}

export interface UsernameResponse extends Omit<Username,"register_date" | "last_deposit">{
    register_date: string | null;
    last_deposit: string | null;

}

export interface CreateUsername{
    contact_id: number;
    platform_id?: number | undefined;
    username: string;
    username_status: string;
    life_cycle: string;
    register_date: Date;
    has_deposited: number;
    last_deposit: Date;
    vip_level: number;
}