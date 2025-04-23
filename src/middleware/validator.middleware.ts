import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export default function ReqValidator(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((issue) => ({ message: issue.message }));
        res.status(400).json({ message: "Validation failed", errors });
      } else {
        next(err);
      }
    }
  };
}
