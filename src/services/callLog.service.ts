import { createCallLogRepository } from "../repository/callLog.repository";
import { CallLogCreate } from "../types/callLog.type";

export const createCallLogService = async (
  newCallLog: Omit<CallLogCreate, "staff_id">,
  staffId: string
) => {
  // Business rules (if needed) can go here
  return await createCallLogRepository(newCallLog, staffId);
};