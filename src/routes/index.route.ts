// src/routes/index.ts
import { Router } from "express";

import staffLevelRoute from "./staffLevel.route";
import contactRoute from "./contact.routes";
import caseRoute from "./case.route";
import { verifySession } from "../middlewares/sessionAuth";
import callLogRoute from "./callLog.route";

const router = Router();

router.use(verifySession)

router.use("/staff-level", staffLevelRoute);
router.use("/contacts", contactRoute);
router.use("/cases", caseRoute);
router.use("/call-log", callLogRoute)

export default router;
