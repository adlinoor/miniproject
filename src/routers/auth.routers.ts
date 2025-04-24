import express from "express";
import {
  RegisterService,
  LoginService,
  RegisterSchema,
  LoginSchema,
} from "../services/auth.service";
import ReqValidator from "../middleware/validator.middleware";

const router = express.Router();

router.post(
  "/register",
  ReqValidator(RegisterSchema),
  async (req, res, next) => {
    try {
      const user = await RegisterService(req.body);
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/login", ReqValidator(LoginSchema), async (req, res, next) => {
  try {
    const { user, token } = await LoginService(req.body);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

export default router;
