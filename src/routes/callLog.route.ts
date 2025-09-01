import { Router } from "express";
import { createCallLogController, deleteCallLogController, getAllCallLogController, getCallLogByIdController, updateCallLogController } from "../controllers/callLog.controller";
import { verifyAuthWithUser } from "../middlewares/checkAuth";
import { getCaseByIdController } from "../controllers/case.controller";

const callLogRoute = Router();

callLogRoute.post("/",verifyAuthWithUser, createCallLogController);
callLogRoute.get("/",verifyAuthWithUser, getAllCallLogController);
callLogRoute.get("/:id", verifyAuthWithUser, getCallLogByIdController);
callLogRoute.put("/:id", verifyAuthWithUser, updateCallLogController);
callLogRoute.delete("/:id",verifyAuthWithUser, deleteCallLogController);

export default callLogRoute