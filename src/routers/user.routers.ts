import express from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../services/cloudinary.service";

const router = express.Router();

/**
 * GET /api/users/me
 */
router.get("/me", authenticate, userController.getProfile);

/**
 * PUT /api/users/profile
 * Bisa JSON biasa, atau multipart dengan file opsional
 */
router.put(
  "/profile",
  authenticate,
  upload.single("profilePicture"),
  userController.updateProfile
);

/**
 * GET /api/users/rewards
 */
router.get("/rewards", authenticate, userController.getRewardSummary);

export default router;
