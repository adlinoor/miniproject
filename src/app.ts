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

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "PORT",
  "SECRET_KEY",
  "CLOUDINARY_NAME",
  "CLOUDINARY_KEY",
  "CLOUDINARY_SECRET",
  "NODEMAILER_USER",
  "NODEMAILER_PASS",
  "FRONTEND_URL",
];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Cloudinary middleware for file uploads
app.use(upload.single("file"));

// Database connection
prisma
  .$connect()
  .then(() => console.log("✅ Connected to PostgreSQL via Prisma"))
  .catch((err) => {
    console.error("❌ Prisma connection error:", err);
    process.exit(1);
  });

// Email service initialization
mailer.verify((error: Error | null): void => {
  if (error) {
    console.error("❌ Mailer error:", error);
  } else {
    console.log("📧 Mailer is ready to send emails");
  }
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/users", userRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Error handling (must be last!)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`🔄 Received ${signal}, shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit();
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Create and export the server instance
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${
      process.env.NODE_ENV || "development"
    } mode on http://localhost:${PORT}`
  );
});

// Export both app and server for different use cases
export default server;
export { app };
