export interface StaffLevel{
    id?: number;
    level_code: string;
    level_name: string;
}


export interface PaginatedStaffLevel {
    data: StaffLevel[];
    pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}