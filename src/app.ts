import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "./middleware/error.middleware";
import authRouter from "./routers/auth.routers";
import eventRouter from "./routers/event.routers";
import reviewRouter from "./routers/review.routers";
import transactionRouter from "./routers/transaction.routers";
import userRouter from "./routers/user.routers";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use("/api", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/users", userRouter);

// Error handling
app.use(errorHandler);

// Only start the server if we're not in a test environment
let server: any;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export both app and server for testing purposes
export { app, server };
