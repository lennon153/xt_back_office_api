import { createPlatformRepository, deletePlatformRepository, getAllPlatformsRepository, getPlatformByIdRepository, updatePlatformRepository } from "../repository/platform.repository";
import { PlatformCreate, PlatformUpdate } from "../validators/platform.schema";

// -----------------------
// Get All
// -----------------------
export const getAllPlatformsService = async (page = 1, limit = 20, search?: string) => {
  const { data, total } = await getAllPlatformsRepository(page, limit, search);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
};

// -----------------------
// Get By ID
// -----------------------
export const getPlatformByIdService = async (platform_id: number) => {
  const platform = await getPlatformByIdRepository(platform_id);
  if (!platform) throw new Error("Platform not found");
  return platform;
};

// -----------------------
// Create
// -----------------------
export const createPlatformService = async (data: PlatformCreate) => {
  return await createPlatformRepository(data);
};

// -----------------------
// Update
// -----------------------
export const updatePlatformService = async (platform_id: number, data: PlatformUpdate) => {
  return await updatePlatformRepository(platform_id, data);
};

// -----------------------
// Delete
// -----------------------
export const deletePlatformService = async (platform_id: number) => {
  return await deletePlatformRepository(platform_id);
};