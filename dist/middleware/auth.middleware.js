"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const secret = process.env.SECRET_KEY;
if (!secret) {
    throw new Error("❌ SECRET_KEY is not defined in environment variables.");
}
// ===============================
// Middleware: Authenticate
// ===============================
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error("❌ JWT verification failed:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
exports.authenticate = authenticate;
// ===============================
// Middleware: Authorize Roles
// ===============================
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user ||
            typeof req.user.role !== "string" ||
            !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden: You do not have permission to access this route",
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
