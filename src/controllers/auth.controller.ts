import { Request, Response, NextFunction } from "express";
import { RegisterService, LoginService } from "../services/auth.service";

async function RegisterController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await RegisterService(req.body);

    res.status(200).send({
      message: "Registration successful",
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function LoginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await LoginService(req.body);

    res.status(200).cookie("access_token", data.token).send({
      message: "Login successful",
      user: data.user,
    });
  } catch (err) {
    next(err);
  }
}

export { RegisterController, LoginController };
