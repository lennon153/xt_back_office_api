import { Router, Response  } from "express";;
import { verifySession } from "../middlewares/sessionAuth";
import { createCustomerController,getCustomerByIdController,updateCustomerController,deleteCustomerController, getCustomers } from "../controllers/customerController";

const customerRoute = Router();

customerRoute.use(verifySession)

customerRoute.post("/",createCustomerController)
customerRoute.get("/:id",getCustomerByIdController)
customerRoute.put("/:id",updateCustomerController)
customerRoute.delete("/:id",deleteCustomerController)
customerRoute.get("/", getCustomers)

export default customerRoute;
