import {  createPlatformTypeRepository, deletePlatformTypeRepository, getAllPlatformsTypeRepository, getPlatformTypeByIdRepository, updatePlatformTypeRepository } from "../repository/platformType.repository";
import { PlatformType } from "../types/platformType.type";

// -----------------------
// Get All
// -----------------------
export const getAllPlatformsTypeService = async (
  page = 1,
  limit = 20,
  search?: string
) => {
  const { data, total } = await getAllPlatformsTypeRepository(page, limit, search);

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
// Get by Id
// -----------------------
export const getPlatformTypeByIdService = async (id: number): Promise<PlatformType> => {
  const platform = await getPlatformTypeByIdRepository(id);
  if (!platform) throw new Error("Platform type not found");
  return platform;
};

// -----------------------
// Create
// -----------------------
export const createPlatformTypeService = async (platform: Omit<PlatformType, "type_id">) => {
  return createPlatformTypeRepository(platform);
};

// -----------------------
// Update
// -----------------------
export const updatePlatformTypeService = async (id: number, platform: Partial<Omit<PlatformType, "type_id">>) => {
  const affectedRows = await updatePlatformTypeRepository(id, platform);
  if (!affectedRows) throw new Error("Platform type not found");
  return { type_id: id, ...platform };
};

// -----------------------
// Delete
// -----------------------
export const deletePlatformTypeService = async (id: number) => {
  const affectedRows = await deletePlatformTypeRepository(id);
  if (!affectedRows) throw new Error("Platform type not found");
  return { type_id: id };
};