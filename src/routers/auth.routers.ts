import express from "express";
import { register, login } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validator.middleware";
import { registerSchema, loginSchema } from "../controllers/auth.controller";

const router = express.Router();

// Register
router.post("/register", validateRequest(registerSchema), register);

// Login
router.post("/login", validateRequest(loginSchema), login);

export default router;
