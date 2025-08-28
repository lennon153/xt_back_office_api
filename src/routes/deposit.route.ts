import { Router } from "express";
import { createDepositController, getAllDepositController } from "../controllers/deposit.controller";


const depositRoute = Router();


depositRoute.post("/", createDepositController);
depositRoute.get("/", getAllDepositController)

export default depositRoute