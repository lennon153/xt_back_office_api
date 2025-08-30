import { Router } from "express";
import { createPlatformController, deletePlatformController, getAllPlatformsController, getPlatformByIdController, updatePlatformController } from "../controllers/platform.controller";

const platformRoute = Router();

platformRoute.post("/", createPlatformController)
platformRoute.get("/", getAllPlatformsController);
platformRoute.get("/:id", getPlatformByIdController);
platformRoute.put("/:id", updatePlatformController);
platformRoute.delete("/:id", deletePlatformController);

export default platformRoute