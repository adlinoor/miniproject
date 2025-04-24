import express from "express";
import { VerifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { Prisma } from "@prisma/client";
import { Multer } from "../utils/multer";
import { uploadToCloudinary } from "../services/cloudinary.service";
import { prisma, upload } from "..";

const router = express.Router();

router.get("/me", VerifyToken, async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/profile",
  VerifyToken,
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      const { first_name, last_name } = req.body;
      let profilePictureUrl;

      if (req.file) {
        try {
          profilePictureUrl = await uploadToCloudinary(req.file);
        } catch (error) {
          return res.status(500).json({ message: "Failed to upload image" });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user?.id },
        data: {
          first_name,
          last_name,
          ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
        },
      });

      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
