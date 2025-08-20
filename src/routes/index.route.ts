// src/routes/index.ts
import { Router } from "express";
import customerRoute from "./customer.routes";
import staffLevelRoute from "./staffLevel.route";
import contactRoute from "./contact.routes";

const router = Router();

// no /api/v1 prefix here
router.use("/customers", customerRoute);
router.use("/staff-level", staffLevelRoute);
router.use("/contacts", contactRoute);

export default router;
