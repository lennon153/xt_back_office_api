import { Router } from "express";
import { verifySession } from "../middlewares/sessionAuth";
import { createStaffLevelController, deleteStaffLevelController, getStaffLevelByIdController, getStaffLevelController, updateStaffLevelController } from "../controllers/staffLevelController";

const staffLevelRoute = Router();

staffLevelRoute.use(verifySession);
staffLevelRoute.post("/",createStaffLevelController);
staffLevelRoute.get("/",getStaffLevelController);
staffLevelRoute.get("/:id",getStaffLevelByIdController);
staffLevelRoute.put("/:id",updateStaffLevelController);
staffLevelRoute.delete("/:id", deleteStaffLevelController)

export default staffLevelRoute;



