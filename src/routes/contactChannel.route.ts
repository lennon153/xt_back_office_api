import { Router } from "express";
import { createContactChannelController, deleteContactChannelController, getAllContactChannelsController, getContactChannelByCodeController, updateContactChannelController } from "../controllers/contactChannel.controller";

const contactChannelRoute = Router();

contactChannelRoute.post("/", createContactChannelController);
contactChannelRoute.get("/", getAllContactChannelsController)
contactChannelRoute.get("/:code", getContactChannelByCodeController);
contactChannelRoute.put("/:code", updateContactChannelController);
contactChannelRoute.delete("/:code", deleteContactChannelController)


export default contactChannelRoute;