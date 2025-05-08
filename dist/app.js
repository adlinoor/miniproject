"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routers_1 = __importDefault(require("./routers/auth.routers"));
const event_routers_1 = __importDefault(require("./routers/event.routers"));
const review_routers_1 = __importDefault(require("./routers/review.routers"));
const transaction_routers_1 = __importDefault(require("./routers/transaction.routers"));
const user_routers_1 = __importDefault(require("./routers/user.routers"));
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use((0, helmet_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Routes
app.use("/api", auth_routers_1.default);
app.use("/api/events", event_routers_1.default);
app.use("/api/reviews", review_routers_1.default);
app.use("/api/transactions", transaction_routers_1.default);
app.use("/api/users", user_routers_1.default);
// Error handling
app.use(error_middleware_1.errorHandler);
// Only start the server if we're not in a test environment
let server;
