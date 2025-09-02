import { Router } from "express";
import {  createPlatformTypeController, deletePlatformTypeController, getAllPlatformsTypeController, getPlatformTypeByIdController, updatePlatformTypeController } from "../controllers/platformType.controller";


const platformTypeRoute = Router();

platformTypeRoute.get("/", getAllPlatformsTypeController)
platformTypeRoute.get("/:id", getPlatformTypeByIdController);
platformTypeRoute.post("/", createPlatformTypeController);
platformTypeRoute.put("/:id", updatePlatformTypeController);
platformTypeRoute.delete("/:id", deletePlatformTypeController)


export default platformTypeRoute