export interface PlatformType {
  type_id: number;
  type_name: string;
}

// For create
export interface PlatformTypeCreate {
  type_id: number;
  type_name: string;
}


// For updating existing platforms
export interface PlatformTypeUpdate {
  type_id?: number;
  type_name?: string;
}
