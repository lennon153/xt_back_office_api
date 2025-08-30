import { Router } from "express";
import { createDepositController, deleteDepositAndCaseController, getAllDepositController, getDepositsByCaseIdController, getDepositsByUserIdController, updateDepositAndCaseController } from "../controllers/deposit.controller";
import { getDepositByCaseIdService } from "../services/deposit.service";


const depositRoute = Router();


depositRoute.post("/", createDepositController);
depositRoute.get("/", getAllDepositController);
depositRoute.put("/:id", updateDepositAndCaseController);
depositRoute.delete("/:id", deleteDepositAndCaseController)

depositRoute.get("/case/:caseId", getDepositsByCaseIdController);
depositRoute.get("/user/:userId", getDepositsByUserIdController)

export default depositRoute