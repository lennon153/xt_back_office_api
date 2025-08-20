// src/routes/index.ts
import { Router } from "express";
import customerRoute from "./customer.routes";
import staffLevelRoute from "./staffLevel.route";
import contactRoute from "./contact.routes";
import caseRoute from "./case.route";

const router = Router();

// no /api/v1 prefix here
router.use("/customers", customerRoute);
router.use("/staff-level", staffLevelRoute);
router.use("/contacts", contactRoute);
router.use("/cases", caseRoute)

export default router;
