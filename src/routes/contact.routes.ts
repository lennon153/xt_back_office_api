import { Router } from "express";
import { verifySession } from "../middlewares/sessionAuth";
import { createContactController, deleteContactController, getAllContactsController, getContactDetailController, updateContactController, uploadContactsCsvController } from "../controllers/contact.controller";
import multer from "multer";

const contactRoute = Router();

// contactRoute.use(verifySession);
const upload = multer({ dest: "uploads/" });

contactRoute.post("/upload-csv", upload.single("file"), uploadContactsCsvController);
contactRoute.post("/", createContactController)
contactRoute.put("/:id", updateContactController)
contactRoute.delete("/:id", deleteContactController)
contactRoute.get("/", getAllContactsController)
contactRoute.get("/:contactId", getContactDetailController)



export default contactRoute