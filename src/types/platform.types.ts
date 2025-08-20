export interface Platform {
  platform_id: number;
  type_id: number;
  platform_name: string;
}

// For create
export interface PlatformCreate {
  type_id: number;
  platform_name: string;
}


// For updating existing platforms
export interface PlatformUpdate {
  type_id?: number;
  platform_name?: string;
}
