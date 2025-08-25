import { Router } from "express";
import { createCallLogController } from "../controllers/callLog.controller";
import { verifyAuthWithUser } from "../middlewares/checkAuth";

const callLogRoute = Router();

callLogRoute.post("/",verifyAuthWithUser, createCallLogController)



export default callLogRoute