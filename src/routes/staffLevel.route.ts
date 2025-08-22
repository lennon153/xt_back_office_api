import { Router } from "express";
import { createStaffLevelController, deleteStaffLevelController, getStaffLevelByIdController, getStaffLevelController, updateStaffLevelController } from "../controllers/staffLevel.controller";

const staffLevelRoute = Router();;
staffLevelRoute.post("/",createStaffLevelController);
staffLevelRoute.get("/",getStaffLevelController);
staffLevelRoute.get("/:id",getStaffLevelByIdController);
staffLevelRoute.put("/:id",updateStaffLevelController);
staffLevelRoute.delete("/:id", deleteStaffLevelController)

export default staffLevelRoute;



