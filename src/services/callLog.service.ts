
import { createCallLogRepository, deleteCallLogRepository, getAllCallLogRepository, getCallLogByIdRepository, updateCallLogRepository } from "../repository/callLog.repository";
import { CallLogCreate } from "../types/callLog.type";

// -----------------------
// Create
// -----------------------
export const createCallLogService = async (
  newCallLog: Omit<CallLogCreate, "user_id">,
  staffId: string
) => {
  // Business rules (if needed) can go here
  return await createCallLogRepository(newCallLog, staffId);
};

// -----------------------
// Get all
// -----------------------

export const getAllCallLogService = async (
  page: number,
  limit: number,
  search: string
) => {
  return await getAllCallLogRepository(page, limit, search);
};

// -----------------------
// Get by ID
// -----------------------

export const getCallLogByIdService = async (callId: number) => {
  return await getCallLogByIdRepository(callId);
};

// -----------------------
// Update
// -----------------------

export const updateCallLogService = async (
  callId: number,
  updateData: any
) => {
  
  return await updateCallLogRepository(callId, updateData);
};

// -----------------------
// Delete
// -----------------------

export const deleteCallLogService = async (callId: number) => {
  return await deleteCallLogRepository(callId);
};