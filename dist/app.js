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
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routers_1 = __importDefault(require("./routers/auth.routers"));
const event_routers_1 = __importDefault(require("./routers/event.routers"));
const review_routers_1 = __importDefault(require("./routers/review.routers"));
const transaction_routers_1 = __importDefault(require("./routers/transaction.routers"));
const user_routers_1 = __importDefault(require("./routers/user.routers"));
const cloudinary_service_1 = require("./services/cloudinary.service");
const email_service_1 = require("./services/email.service");
// Initialize configuration
dotenv_1.default.config();
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
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 8080;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use((0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
}));
// Standard middleware
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(cloudinary_service_1.upload.single("file"));
// Database connection check
function checkDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma_1.default.$queryRaw `SELECT 1`;
            console.log("Database connected successfully");
            return true;
        }
        catch (err) {
            console.error("Database connection error:", err);
            return false;
        }
    });
}
// Verify email service
email_service_1.mailer.verify((err) => console.log(err ? `Mailer error: ${err}` : "Mailer ready"));
// API routes
app.use("/api/auth", auth_routers_1.default);
app.use("/api/events", event_routers_1.default);
app.use("/api/reviews", review_routers_1.default);
app.use("/api/transactions", transaction_routers_1.default);
app.use("/api/users", user_routers_1.default);
// Health check
app.get("/api/health", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dbStatus = yield checkDatabaseConnection();
    res.status(dbStatus ? 200 : 503).json({
        status: dbStatus ? "OK" : "Service Unavailable",
        database: dbStatus ? "connected" : "disconnected",
    });
}));
// Error handling
app.use(error_middleware_1.errorHandler);
// Server lifecycle
const server = app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield checkDatabaseConnection();
    console.log(`Server running on port ${PORT}`);
}));
exports.server = server;
// Clean shutdown
const shutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Shutting down gracefully...");
    yield prisma_1.default.$disconnect();
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
exports.default = server;
