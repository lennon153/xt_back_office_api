// src/routes/index.ts
import { Router } from "express";
import staffLevelRoute from "./staffLevel.route";
import contactRoute from "./contact.routes";
import caseRoute from "./case.route";
import { verifySession } from "../middlewares/sessionAuth";
import callLogRoute from "./callLog.route";
import usernameRoute from "./username.route";
import contactCsvRoute from "./contact.csv.route";
import depositRoute from "./deposit.route";
import contactPointRoute from "./contactPoint.route";

const router = Router();

router.use(verifySession)

router.use("/staff-level", staffLevelRoute);
router.use("/contacts", contactRoute);
router.use("/cases", caseRoute);
router.use("/call-log", callLogRoute)
router.use("/username", usernameRoute)
router.use("/deposit", depositRoute)
router.use("/contact-point", contactPointRoute)
router.use("/contact-csv", contactCsvRoute)

export default router;
