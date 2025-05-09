"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const auth_routers_1 = __importDefault(require("./routers/auth.routers"));
const event_routers_1 = __importDefault(require("./routers/event.routers"));
const user_routers_1 = __importDefault(require("./routers/user.routers"));
const transaction_routers_1 = __importDefault(require("./routers/transaction.routers"));
const error_middleware_1 = require("./middleware/error.middleware");
const cloudinary_service_1 = require("./services/cloudinary.service");
const email_service_1 = require("./services/email.service");
// Load environment variables
dotenv_1.default.config();
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
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);
// Upload file middleware
app.use(cloudinary_service_1.upload.single("file"));
// Connect Prisma
prisma_1.default
    .$connect()
    .then(() => console.log("✅ Connected to PostgreSQL via Prisma"))
    .catch((err) => {
    console.error("❌ Prisma connection error:", err);
    if (process.env.NODE_ENV !== "production")
        process.exit(1);
});
// Init mailer
email_service_1.mailer.verify((error) => {
    if (error) {
        console.error("❌ Mailer error:", error);
    }
    else {
        console.log("📧 Mailer is ready to send emails");
    }
});
// Routes
app.use("/api/auth", auth_routers_1.default);
app.use("/api/events", event_routers_1.default);
app.use("/api/users", user_routers_1.default);
app.use("/api/transactions", transaction_routers_1.default);
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});
// Error middleware
app.use(error_middleware_1.errorHandler);
// ONLY listen if not on Vercel
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
    const gracefulShutdown = (signal) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`🔄 Received ${signal}, shutting down gracefully...`);
        yield prisma_1.default.$disconnect();
        process.exit();
    });
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}
// Export Express app to be used by Vercel
exports.default = app;
