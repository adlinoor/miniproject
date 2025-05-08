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
const auth_middleware_1 = require("../middleware/auth.middleware");
const cloudinary_service_1 = require("../services/cloudinary.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const validator_middleware_1 = require("../middleware/validator.middleware");
const zod_1 = require("zod");
const router = express_1.default.Router();
// Validation schema for profile updates
const profileUpdateSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(1, "First name is required").optional(),
    last_name: zod_1.z.string().min(1, "Last name is required").optional(),
});
/**
 * Get the authenticated user's profile.
 */
router.get("/me", auth_middleware_1.authMiddleware, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,
                profilePicture: true,
                referralCode: true,
                points: {
                    where: {
                        expiresAt: { gt: new Date() },
                    },
                    orderBy: { expiresAt: "asc" },
                },
                coupons: {
                    where: {
                        expiresAt: { gt: new Date() },
                        isUsed: false,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        next(error);
    }
}));
/**
 * Update the authenticated user's profile.
 */
router.put("/profile", auth_middleware_1.authMiddleware, cloudinary_service_1.upload.single("profilePicture"), (0, validator_middleware_1.validateRequest)(profileUpdateSchema), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { first_name, last_name } = req.body;
        let profilePictureUrl;
        // Upload profile picture if provided
        if (req.file) {
            profilePictureUrl = yield (0, cloudinary_service_1.uploadToCloudinary)(req.file);
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: Number(req.user.id) },
            data: Object.assign({ first_name,
                last_name }, (profilePictureUrl && { profilePicture: profilePictureUrl })),
        });
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        next(error);
    }
}));
exports.default = router;
