import { Router } from "express";
import multer from "multer";
import { uploadCSVController } from "../controllers/contact.csv.controller";

const contactCsvRoute = Router();
const upload = multer({ dest: "uploads/" });

// contactCsvRoute.post("/upload-csv", upload.single("file"), uploadCSVController)

export default contactCsvRoute

