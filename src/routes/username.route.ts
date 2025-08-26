import { Router } from "express";
import { createUsernameController, deleteUsernameController, getAllUsernameController, getUsernameByIdController, updateUsernameController } from "../controllers/username.controller";

const usernameRoute = Router();

usernameRoute.post("/", createUsernameController);
usernameRoute.get("/", getAllUsernameController);
usernameRoute.put("/:id", updateUsernameController);
usernameRoute.get("/:id", getUsernameByIdController);
usernameRoute.delete("/:id", deleteUsernameController);

export default usernameRoute