import express from "express";
import { errorHandler } from "./middlewares/errorHandler";
import customerRoute from "./routes/customerRoutes";
import { requestLogger } from "./middlewares/requestLogger";
import { notFound } from "./middlewares/notFound";
import staffLevelRoute from "./routes/staffLevelRoute";

const app = express();

app.use(express.json());

// GLOBAL request logger
app.use(requestLogger);

// All routes
app.use("/api/v1/customer",customerRoute); // customer 
app.use("/api/v1/staff-level", staffLevelRoute)

// Global 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);
export default app;
