export interface ContactPoint{
    point_id: number;
    contact_id: number;
    channel_code: string;
    value_raw: string;
    value_norm: string;
    is_primary: number;
    verify_at: Date;
    create_at: Date;
    update_at: Date;
}

export interface ContactPointResponse extends Omit<ContactPoint, "create_at" |  "update_at" | "verify_at">{
    create_at: string | null;
    update_at: string | null;
    verify_at: string | null;
}

export interface ContactPointUpdate {
  contact_id?: number | undefined;
  channel_code: string | undefined;
  value_raw: string | undefined;
  value_norm: string | undefined;
  is_primary: number | undefined;
  verify_at?: Date | null | undefined;
}
