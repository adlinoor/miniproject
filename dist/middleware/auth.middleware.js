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
    var _a;
    const authHeader = req.headers.authorization;
    const cookieToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.access_token;
    const token = ((authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer ")) && authHeader.split(" ")[1]) ||
        cookieToken;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }
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
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({
                message: "Forbidden: You do not have permission to access this route",
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
