import { Router } from "express";
import { createCaseController, deleteCaseController, getAllCasesController, updateCaseController } from "../controllers/case.controller";

const caseRoute = Router();

caseRoute.post("/", createCaseController);
caseRoute.get("/", getAllCasesController);
caseRoute.put("/:id", updateCaseController);
caseRoute.delete("/:id", deleteCaseController)


export default caseRoute