import { Router } from "express";
import { createCaseAssController, createCaseController, deleteCaseController,  getAllCasesController, getCaseByIdController, updateCaseController } from "../controllers/case.controller";


const caseRoute = Router();

caseRoute.post("/", createCaseController);
caseRoute.post("/ass", createCaseAssController)
caseRoute.get("/", getAllCasesController);
caseRoute.get("/:id", getCaseByIdController)
caseRoute.put("/:id", updateCaseController);
caseRoute.delete("/:id", deleteCaseController)


export default caseRoute