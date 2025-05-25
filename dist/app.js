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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const error_middleware_1 = require("./middleware/error.middleware");
// Routers
const auth_routers_1 = __importDefault(require("./routers/auth.routers"));
const coupon_routers_1 = __importDefault(require("./routers/coupon.routers"));
const event_routers_1 = __importDefault(require("./routers/event.routers"));
const review_routers_1 = __importDefault(require("./routers/review.routers"));
const transaction_routers_1 = __importDefault(require("./routers/transaction.routers"));
const user_routers_1 = __importDefault(require("./routers/user.routers"));
const statistic_routers_1 = __importDefault(require("./routers/statistic.routers"));
const promotion_routers_1 = __importDefault(require("./routers/promotion.routers"));
// Load environment variables
dotenv_1.default.config();
// Validate required env vars
const requiredEnvVars = [
    "SECRET_KEY",
    "FRONTEND_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "NODEMAILER_USER",
    "NODEMAILER_PASS",
];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        console.error(`❌ Missing required environment variable: ${key}`);
        process.exit(1);
    }
}
// console.log("All env loaded!");
const app = (0, express_1.default)();
/* ======= Middleware ======= */
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
if (process.env.NODE_ENV === "production") {
    app.use((0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests, please try again later.",
    }));
}
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)("dev"));
app.use((0, cookie_parser_1.default)());
/* ======= Routes ======= */
app.use("/api/auth", auth_routers_1.default);
app.use("/api/coupons", coupon_routers_1.default);
app.use("/api/events", event_routers_1.default);
app.use("/api/promotions", promotion_routers_1.default);
app.use("/api/reviews", review_routers_1.default);
app.use("/api/statistics", statistic_routers_1.default);
app.use("/api/transactions", transaction_routers_1.default);
app.use("/api/users", user_routers_1.default);
/* ======= Health check ======= */
app.get("/api/health", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: "OK",
            database: "connected",
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        res.status(503).json({
            status: "Service Unavailable",
            database: "disconnected",
            error: err.message,
        });
    }
}));
/* ======= Global error handler ======= */
app.use(error_middleware_1.errorHandler);
require("./utils/cron");
// ✅ Untuk Vercel (serverless)
exports.default = app;
