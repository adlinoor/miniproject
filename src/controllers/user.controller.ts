import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { z } from "zod";
import bcrypt from "bcrypt";
import { uploader } from "../lib/cloudinary";

// ✅ Schema validasi untuk update profile
const updateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  profilePicture: z.string().optional(), // diisi otomatis dari cloudinary jika pakai upload
});

// ✅ Ambil profil user yang login
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// ✅ Update profil user (nama, email, password, foto)
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = updateSchema.parse(req.body);

    // ✅ Hash password jika diisi
    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // ✅ Upload foto jika file diberikan
    if (req.file) {
      const result = await uploader.upload_stream_to_cloudinary(
        req.file.buffer
      );
      validatedData.profilePicture = result.secure_url;
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
export const getRewardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const summary = await userService.getUserRewardSummary(userId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};
