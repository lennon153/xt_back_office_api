// src/routes/index.ts
import { Router } from "express";
import customerRoute from "./customer.routes";
import staffLevelRoute from "./staffLevel.route";
import contactRoute from "./contact.routes";
import caseRoute from "./case.route";
import { verifySession } from "../middlewares/sessionAuth";

const router = Router();

router.use(verifySession)

router.use("/customers", customerRoute);
router.use("/staff-level", staffLevelRoute);
router.use("/contacts", contactRoute);
router.use("/cases", caseRoute)

export default router;
