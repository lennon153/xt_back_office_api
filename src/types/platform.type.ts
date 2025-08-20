export interface PlatformType {
  type_id: number;
  type_name: string;
}

export // For creating new platform types
interface PlatformTypeCreate {
  type_name: string;
}

// For updating platform types
export interface PlatformTypeUpdate {
  type_name?: string;
}
