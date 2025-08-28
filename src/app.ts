import express, { urlencoded } from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import { corsConfig } from "./middlewares/corsConfig";
import { rateLimiter } from "./middlewares/rateLimiter";
import routes from "./routes/index.route";
import { dailyRotationTask } from "./utils/case/autoAssignCase";
const app = express();


app.use(express.json());

// middlewares
app.use(corsConfig);
app.use(rateLimiter);
app.use(urlencoded({extended:true}))

// GLOBAL request logger
app.use(requestLogger);

// Register API routes
// 👇 apply global prefix ONCE
app.use("/api/v1", routes);

// Auto check functions
dailyRotationTask

// Global error handler (must be last)
app.use(errorHandler);
app.use(notFoundHandler);
export default app;
