import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { z } from "zod";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../services/cloudinary.service";
import prisma from "../lib/prisma";

// Schema validasi update profil
const updateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  profilePicture: z.string().optional(),
});

// Ambil profil user yang login
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await userService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const referralCount = await prisma.user.count({
      where: { referredBy: user.referralCode },
    });

    res.status(200).json({ ...user, referralCount });
  } catch (error) {
    next(error);
  }
};

// Update profil user
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const validatedData = updateSchema.parse(req.body);

    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

    if (req.file) {
      const profilePictureUrl = await uploadToCloudinary(req.file);
      validatedData.profilePicture = profilePictureUrl;
    }

    if (req.body.removePicture === "true") {
      validatedData.profilePicture = "";
    }

    const updatedUser = await userService.updateUser(userId, validatedData);

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Ambil ringkasan reward pengguna
export const getRewardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const summary = await userService.getUserRewardSummary(userId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};
