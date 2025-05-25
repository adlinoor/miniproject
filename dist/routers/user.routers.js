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
const express_1 = __importDefault(require("express"));
const userController = __importStar(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = __importDefault(require("../middleware/upload"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const email_service_1 = require("../services/email.service");
const router = express_1.default.Router();
/**
 * GET /api/users/me
 */
router.get("/me", auth_middleware_1.authenticate, userController.getProfile);
/**
 * PUT /api/users/profile
 */
router.put("/profile", auth_middleware_1.authenticate, upload_1.default.single("profilePicture"), userController.updateProfile);
/**
 * GET /api/users/rewards
 */
router.get("/rewards", auth_middleware_1.authenticate, userController.getRewardSummary);
/**
 * GET /api/users/verify-email/:email
 * Verifikasi email, lalu redirect ke FE
 */
router.get("/verify-email/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.params;
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        // Redirect ke halaman gagal FE
        return res.redirect(`${process.env.FRONTEND_URL}/verify-email/failed?email=${encodeURIComponent(email)}`);
    }
    if (user.isVerified) {
        // Redirect ke halaman sukses FE (sudah diverifikasi)
        return res.redirect(`${process.env.FRONTEND_URL}/verify-email/success?email=${encodeURIComponent(email)}`);
    }
    yield prisma_1.default.user.update({
        where: { email },
        data: { isVerified: true },
    });
    // Redirect ke halaman sukses FE
    res.redirect(`${process.env.FRONTEND_URL}/verify-email/success?email=${encodeURIComponent(email)}`);
}));
/**
 * POST /api/users/resend-verification
 */
router.post("/resend-verification", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: "Email is required" });
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
        return res.status(400).json({ message: "Email already verified" });
    yield (0, email_service_1.sendVerificationEmail)(email);
    return res.json({ message: "Verification email resent" });
}));
/**
 * POST /api/users/forgot-password
 */
router.post("/forgot-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: "Email is required" });
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        return res.status(200).json({
            message: "If your email is registered, you'll receive a reset link.",
        });
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    yield prisma_1.default.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExp },
    });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    yield (0, email_service_1.sendEmail)(email, "Reset Your Password", `Click <a href="${resetUrl}">here</a> to reset your password.`);
    return res.status(200).json({
        message: "If your email is registered, you'll receive a reset link.",
    });
}));
exports.default = router;
