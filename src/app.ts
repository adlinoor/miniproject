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
import statisticRouter from "./routers/statistic.routers";
import promotionRouter from "./routers/promotion.routers";

// Load environment variables
dotenv.config();

// Validate required env vars
const requiredEnvVars = [
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
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();

// ======================
//      Middleware
// ======================
app.use(helmet());
app.use(
  cors({
    origin: "https://miniproject-web.vercel.app",
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(upload.single("file"));

// ======================
//       Routes
// ======================
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/statistics", statisticRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/users", userRouter);

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "OK",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "Service Unavailable",
      database: "disconnected",
      error: (err as Error).message,
    });
  }
});

// Global error handler
app.use(errorHandler);

import "./utils/cron";

// ✅ Untuk Vercel (serverless)
export default app;

// ✅ Untuk development lokal (npm run dev)
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}
