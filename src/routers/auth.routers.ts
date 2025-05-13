import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validator.middleware";
import { registerSchema, loginSchema } from "../controllers/auth.controller";

const router = express.Router();

// Register
router.post("/register", validateRequest(registerSchema), register);

// Login
router.post("/login", validateRequest(loginSchema), login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
