import { Router, Response  } from "express";;
import { verifySession } from "../middlewares/sessionAuth";
import { createCustomerController,getCustomerByIdController,updateCustomerController,deleteCustomerController } from "../controllers/customerController";

const customerRoute = Router();

customerRoute.use(verifySession)

customerRoute.post("/",createCustomerController)
customerRoute.get("/:id",getCustomerByIdController)
customerRoute.put("/:id",updateCustomerController)
customerRoute.delete("/:id",deleteCustomerController)

export default customerRoute;
