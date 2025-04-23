import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../index';
import { upload } from '../';
import { uploadToCloudinary } from '../services/cloudinary.service';

const router = express.Router();

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePicture: true,
        referralCode: true,
        points: {
          where: {
            expiresAt: { gt: new Date() },
          },
          orderBy: { expiresAt: 'asc' },
        },
        coupons: {
          where: {
            expiresAt: { gt: new Date() },
            isUsed: false,
          },
        },
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put(
  '/profile',
  authenticate,
  upload.single('profilePicture'),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      let profilePictureUrl = undefined;

      if (req.file) {
        profilePictureUrl = await uploadToCloudinary(req.file);
      }

      const updatedUser = await prisma.user.update({