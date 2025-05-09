import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import prisma from "./lib/prisma";
import authRoutes from "./routers/auth.routers";
import eventRoutes from "./routers/event.routers";
import userRoutes from "./routers/user.routers";
import transactionRoutes from "./routers/transaction.routers";
import { errorHandler } from "./middleware/error.middleware";
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
    if (process.env.NODE_ENV !== "production") {
      // Allow Vercel build to continue, fail only locally
      throw new Error(`Missing env: ${key}`);
    }
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Upload file middleware
app.use(upload.single("file"));

// Connect Prisma
prisma
  .$connect()
  .then(() => console.log("✅ Connected to PostgreSQL via Prisma"))
  .catch((err) => {
    console.error("❌ Prisma connection error:", err);
    if (process.env.NODE_ENV !== "production") process.exit(1);
  });

// Init mailer
mailer.verify((error: Error | null): void => {
  if (error) {
    console.error("❌ Mailer error:", error);
  } else {
    console.log("📧 Mailer is ready to send emails");
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Error middleware
app.use(errorHandler);

// ONLY listen if not on Vercel
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`🔄 Received ${signal}, shutting down gracefully...`);
    await prisma.$disconnect();
    process.exit();
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

// Export Express app to be used by Vercel
export default app;
