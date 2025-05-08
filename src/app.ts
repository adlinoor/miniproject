import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import prisma from "./lib/prisma";
import { errorHandler } from "./middleware/error.middleware";
import authRouter from "./routers/auth.routers";
import eventRouter from "./routers/event.routers";
import reviewRouter from "./routers/review.routers";
import transactionRouter from "./routers/transaction.routers";
import userRouter from "./routers/user.routers";
import { upload } from "./services/cloudinary.service";
import { mailer } from "./services/email.service";

// Initialize configuration
dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  "PORT",
  "SECRET_KEY",
  "FRONTEND_URL",
  "CLOUDINARY_NAME",
  "CLOUDINARY_KEY",
  "CLOUDINARY_SECRET",
  "NODEMAILER_USER",
  "NODEMAILER_PASS",
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// App setup
const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
  })
);

// Standard middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(upload.single("file"));

// Database connection check
async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected successfully");
    return true;
  } catch (err) {
    console.error("Database connection error:", err);
    return false;
  }
}

// Verify email service
mailer.verify((err) =>
  console.log(err ? `Mailer error: ${err}` : "Mailer ready")
);

// API routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/users", userRouter);

// Health check
app.get("/api/health", async (_, res) => {
  const dbStatus = await checkDatabaseConnection();
  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? "OK" : "Service Unavailable",
    database: dbStatus ? "connected" : "disconnected",
  });
});

// Error handling
app.use(errorHandler);

// Server lifecycle
const server = app.listen(PORT, async () => {
  await checkDatabaseConnection();
  console.log(`Server running on port ${PORT}`);
});

// Clean shutdown
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { app, server };
export default server;
