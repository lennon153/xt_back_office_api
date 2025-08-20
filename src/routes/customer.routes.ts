import { Router, Response  } from "express";;
import { verifySession } from "../middlewares/sessionAuth";
import { createCustomerController,updateCustomerController,deleteCustomerController, getAllCustomersController, getCustomerByCustomerIdController } from "../controllers/customer.controller";

const customerRoute = Router();

customerRoute.use(verifySession)

customerRoute.post("/",createCustomerController)
customerRoute.get("/:customer_id",getCustomerByCustomerIdController)
customerRoute.put("/:id",updateCustomerController)
customerRoute.delete("/:id",deleteCustomerController)
customerRoute.get("/", getAllCustomersController)

export default customerRoute;
