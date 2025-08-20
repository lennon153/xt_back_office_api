import { Router } from "express";
import { verifySession } from "../middlewares/sessionAuth";
import { getAllContactsController, getContactDetailController } from "../controllers/contact.controller";

const contactRoute = Router();

// contactRoute.use(verifySession);
contactRoute.get("/",getAllContactsController)
contactRoute.get("/:contactId", getContactDetailController)
export default contactRoute