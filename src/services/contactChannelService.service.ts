import { never } from "zod";
import { HttpStatus } from "../constants/httpStatus";
import { createContactChannelRepository, deleteContactChannelRepository, getAllContactChannelsRepository, getContactChannelByCodeRepository, updateContactChannelRepository } from "../repository/contactChannelRepository";
import { AppError } from "../utils/customError";
import { ContactChannelCreate, ContactChannelUpdate } from "../validators/contactChannelSchema";

// Create 
export const createContactChannelService = async (channel: ContactChannelCreate)=>{
    const exists = await getContactChannelByCodeRepository(channel.channel_code);
    if (exists) throw new AppError("Channel code already exists",HttpStatus.CONFLICT);
    
    return await createContactChannelRepository(channel);
}

// Get All
export const getAllContactChannelsService = async (
  page: number,
  limit: number,
  search?: string
) => {
  return await getAllContactChannelsRepository(page, limit, search);
};

// Get by code
export const getContactChannelByCodeService = async (code: string) =>{
    const channel = await getContactChannelByCodeRepository(code);
    if(!channel) {
        throw new AppError("Contact channel not found",HttpStatus.NOT_FOUND);
    }

    return channel;
}

// Update
export const updateContactChannelService = async (
    code: string,
    update: Partial<ContactChannelUpdate >
) =>{
    const channel = await getContactChannelByCodeRepository(code);
    if(!channel) throw new AppError("Contact channel not found", HttpStatus.NOT_FOUND);

    return await updateContactChannelRepository(code, update);
}

// Delete
export const deleteContactChannelService = async(code: string)=>{
    const channel = await getContactChannelByCodeRepository(code);
    if (!channel) throw new AppError("Contact channel not found",HttpStatus.NOT_FOUND);

    return await deleteContactChannelRepository(code);
}