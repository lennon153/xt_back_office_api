import { Router } from "express";
import { createContactPointController, deleteContactPointController, getAllContactPointController, updateContactPointController } from "../controllers/contactPoint.controller";

const contactPointRoute = Router();

contactPointRoute.post("/", createContactPointController);
contactPointRoute.get("/", getAllContactPointController);
contactPointRoute.put("/:id", updateContactPointController);
contactPointRoute.delete("/:id", deleteContactPointController)

export default contactPointRoute