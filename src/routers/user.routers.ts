import express from "express";
import * as userController from "../controllers/user.controller";
import { authenticate, requireVerified } from "../middleware/auth.middleware";
import upload from "../middleware/upload";
import prisma from "../lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail, sendEmail } from "../services/email.service";

const router = express.Router();

/**
 * GET /api/users/me
 */
router.get("/me", authenticate, userController.getProfile);

/**
 * PUT /api/users/profile
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

/**
 * GET /api/users/verify-email/:email
 * Verifikasi email, lalu redirect ke FE
 */
router.get("/verify-email/:email", async (req, res) => {
  const { email } = req.params;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Redirect ke halaman gagal FE
    return res.redirect(
      `${
        process.env.FRONTEND_URL
      }/verify-email/failed?email=${encodeURIComponent(email)}`
    );
  }

  if (user.isVerified) {
    // Redirect ke halaman sukses FE (sudah diverifikasi)
    return res.redirect(
      `${
        process.env.FRONTEND_URL
      }/verify-email/success?email=${encodeURIComponent(email)}`
    );
  }

  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  // Redirect ke halaman sukses FE
  res.redirect(
    `${
      process.env.FRONTEND_URL
    }/verify-email/success?email=${encodeURIComponent(email)}`
  );
});

/**
 * POST /api/users/resend-verification
 */
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified)
    return res.status(400).json({ message: "Email already verified" });

  await sendVerificationEmail(email);

  return res.json({ message: "Verification email resent" });
});

/**
 * POST /api/users/forgot-password
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(200).json({
      message: "If your email is registered, you'll receive a reset link.",
    });

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExp },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  await sendEmail(
    email,
    "Reset Your Password",
    `Click <a href="${resetUrl}">here</a> to reset your password.`
  );

  return res.status(200).json({
    message: "If your email is registered, you'll receive a reset link.",
  });
});

export default router;
