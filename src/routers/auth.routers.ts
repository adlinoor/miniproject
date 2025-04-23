import express from "express";
import {
  registerUser,
  loginUser,
  registerSchema,
  loginSchema,
} from "../services/auth.service";
import { validateRequest } from "../middlewares/validateRequest";

const router = express.Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  async (req, res, next) => {
    try {
      const { user, token } = await registerUser(req.body);
      res.status(201).json({ user, token });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/login", validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { user, token } = await loginUser(req.body);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

export default router;
