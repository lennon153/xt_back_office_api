// src/routes/index.ts
import { Router } from "express";
import contactRoute from "./contact.routes";
import caseRoute from "./case.route";
import { verifySession } from "../middlewares/sessionAuth";
import callLogRoute from "./callLog.route";
import usernameRoute from "./username.route";
import contactCsvRoute from "./contact.csv.route";
import depositRoute from "./deposit.route";
import contactPointRoute from "./contactPoint.route";
import contactChannelRoute from "./contactChannel.route";
import platformTypeRoute from "./platformType.route";
import platformRoute from "./platform.route";

const router = Router();

router.use(verifySession)

router.use("/contacts", contactRoute);
router.use("/cases", caseRoute);
router.use("/call-log", callLogRoute);
router.use("/username", usernameRoute);
router.use("/deposit", depositRoute);
router.use("/contact-channel", contactChannelRoute);
router.use("/contact-point", contactPointRoute);
router.use("/platform-type", platformTypeRoute);
router.use("/platform", platformRoute);
router.use("/contact-csv", contactCsvRoute);

export default router;
