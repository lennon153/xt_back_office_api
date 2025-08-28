import { Router } from "express";
import { createCaseAssController, createCaseController, deleteCaseController,  getAllCasesController, updateCaseController } from "../controllers/case.controller";


const caseRoute = Router();

caseRoute.post("/", createCaseController);
caseRoute.post("/ass", createCaseAssController)
caseRoute.get("/", getAllCasesController);
caseRoute.put("/:id", updateCaseController);
caseRoute.delete("/:id", deleteCaseController)


export default caseRoute