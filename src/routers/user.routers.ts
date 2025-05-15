import express from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload, uploadToCloudinary } from "../services/cloudinary.service";
import { prisma } from "../lib/prisma";
import { validateRequest } from "../middleware/validator.middleware";
import { z } from "zod";
import { getRewardSummary } from "../controllers/user.controller";

const router = express.Router();

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  profilePicture: z.string().optional(), // Optional field for profile picture URL
});

/**
 * Get the authenticated user's profile.
 */
router.get(
  "/me",
  authenticate,
  userController.getProfile,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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
        return res.status(404).json({ message: "User  not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      next(error);
    }
  }
);
router.get("/rewards", authenticate, getRewardSummary);

/**
 * Update the authenticated user's profile.
 */
router.put(
  "/profile",
  authenticate,
  upload.single("profilePicture"),
  validateRequest(profileUpdateSchema),
  async (req, res, next) => {
    try {
      const { first_name, last_name } = req.body;
      let profilePictureUrl;

      // Upload profile picture if provided
      if (req.file) {
        // Validate file type and size here if necessary
        profilePictureUrl = await uploadToCloudinary(req.file);
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(req.user!.id) },
        data: {
          first_name,
          last_name,
          ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      next(error);
    }
  }
);

export default router;
