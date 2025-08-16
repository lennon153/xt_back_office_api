import express from "express";
import { errorHandler } from "./middlewares/errorHandler";
import customerRoute from "./routes/customerRoutes";

const app = express();

app.use(express.json());
app.use("/api/v1/customer",customerRoute);
app.use(errorHandler);

export default app;
