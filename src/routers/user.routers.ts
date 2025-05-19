import express from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../services/cloudinary.service";

const router = express.Router();

/**
 * GET /api/users/me
 * Ambil profil pengguna yang sedang login.
 */
router.get("/me", authenticate, userController.getProfile);

/**
 * PUT /api/users/profile
 * Perbarui profil pengguna yang sedang login.
 * Mengizinkan upload gambar profil opsional (profilePicture).
 */
router.put(
  "/profile",
  authenticate,
  upload.single("profilePicture"), // ⬅️ HARUS sama seperti field dari frontend
  userController.updateProfile
);

/**
 * GET /api/users/rewards
 * Ambil ringkasan poin dan kupon pengguna.
 */
router.get("/rewards", authenticate, userController.getRewardSummary);

export default router;
