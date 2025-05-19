"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.resetPassword = exports.forgotPassword = exports.login = exports.register = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const authService = __importStar(require("../services/auth.service"));
const email_service_1 = require("../services/email.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
dotenv_1.default.config();
// ====================
// 🔐 SCHEMA VALIDATION
// ====================
exports.registerSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(1, "First name is required"),
    last_name: zod_1.z.string().min(1, "Last name is required"),
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    role: zod_1.z.enum([client_1.Role.CUSTOMER, client_1.Role.ORGANIZER]).default(client_1.Role.CUSTOMER),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// ====================
// 👤 REGISTER
// ====================
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ⬇️ Buat user baru
        yield authService.RegisterService(req.body);
        // ⬇️ Langsung login ulang supaya dapat token dan user lengkap (dengan referralCode)
        const { token, user: fullUser } = yield authService.LoginService({
            email: req.body.email,
            password: req.body.password,
        });
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });
        res.status(201).json({
            user: fullUser, // ✅ Sudah termasuk referralCode dari LoginService
            message: "Registration successful",
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : "Registration failed",
        });
    }
});
exports.register = register;
// ====================
// 🔓 LOGIN
// ====================
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = exports.loginSchema.parse(req.body);
        const result = yield authService.LoginService(validatedData);
        res.cookie("access_token", result.token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });
        res.json({
            user: result.user,
            message: "Login successful",
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors,
            });
        }
        res.status(401).json({
            error: "Invalid credentials",
        });
    }
});
exports.login = login;
// ============================
// 🔁 FORGOT PASSWORD - Send link
// ============================
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(200).json({
            message: "If your email is registered, a reset link has been sent.",
        });
    }
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    yield prisma_1.default.user.update({
        where: { id: user.id },
        data: {
            resetToken: token,
            resetTokenExp: expires,
        },
    });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    yield (0, email_service_1.sendEmail)(user.email, "Reset Password", `Click to reset: ${resetLink}`);
    return res.status(200).json({ message: "Reset link sent to your email" });
});
exports.forgotPassword = forgotPassword;
// ============================
// 🔁 RESET PASSWORD - Use token
// ============================
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params;
    const { password } = req.body;
    const user = yield prisma_1.default.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExp: { gt: new Date() },
        },
    });
    if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
    }
    const hashed = yield bcrypt_1.default.hash(password, 10);
    yield prisma_1.default.user.update({
        where: { id: user.id },
        data: {
            password: hashed,
            resetToken: null,
            resetTokenExp: null,
        },
    });
    return res.status(200).json({ message: "Password updated successfully" });
});
exports.resetPassword = resetPassword;
