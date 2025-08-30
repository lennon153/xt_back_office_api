import { createUsernameRepository, deleteUsernameRepository, getAllUsernameRepository, getUsernameByIdRepository, updateUsernameRepository } from "../repository/username.repository";
import { PaginateOptions, PaginationResult } from "../types/pagination.type";
import { UsernameUpdate } from "../types/username";
import { CreateUsername, UsernameResponse } from "../types/username.type";
import { formatDateHour } from "../utils/dateFormat";

// -----------------------
// Create
// -----------------------
export const createUsernameService = async (data: CreateUsername) => {
  const insertedId = await createUsernameRepository(data);

  return {
    id: insertedId,
    ...data,
  };
};

// -----------------------
// Get All
// -----------------------
export async function getAllUsernameService(
    options: PaginateOptions
): Promise<PaginationResult<UsernameResponse>> {
    
    const result = await getAllUsernameRepository(options);

    const formattedData = result.data.map((us) => ({
        ...us,
        register_date: us.register_date ? formatDateHour(new Date(us.register_date)) : null,
        last_deposit: us.last_deposit ? formatDateHour(new Date(us.last_deposit)) : null,
    }));

    return {
        ...result,
        data: formattedData
    };
}

// -----------------------
// Update
// -----------------------
export const updateUsernameService = async (id: number, data: UsernameUpdate) => {
  const affectedRows = await updateUsernameRepository(id, data);

  if (affectedRows === 0) return null; // username not found

  return await getUsernameByIdRepository(id); // return updated object
};

// -----------------------
// Get By ID
// -----------------------
export const getUsernameByIdService = async (id: number) => {
  const username = await getUsernameByIdRepository(id);
  if (username) {
    username.register_date = username.register_date ? formatDateHour(new Date(username.register_date)) : null;
    username.last_deposit = username.last_deposit ? formatDateHour(new Date(username.last_deposit)) : null;
  }
  return username;
};

// -----------------------
// Delete
// -----------------------
export const deleteUsernameService = async (id: number): Promise<number> => {
  return await deleteUsernameRepository(id); // now returns number
};