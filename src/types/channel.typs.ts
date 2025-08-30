export interface Channel{
    channel_code: string;
    channel_name: string;
}

export interface ContactChannelUpdate {
  channel_code?: string | undefined;
  channel_name?: string | undefined;
}