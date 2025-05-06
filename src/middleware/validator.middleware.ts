import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          issues: error.issues,
        });
      }
      next(error);
    }
  };
};

export const validateDates = (startDateField: string, endDateField: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startDate = new Date(req.body[startDateField]);
    const endDate = new Date(req.body[endDateField]);

    if (startDate >= endDate) {
      return res.status(400).json({
        message: "Validation failed",
        issues: [
          {
            code: "custom",
            path: [startDateField],
            message: "Start date must be before end date",
          },
        ],
      });
    }

    next();
  };
};
