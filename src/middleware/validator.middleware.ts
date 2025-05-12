import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { z } from "zod";

const idSchema = z.object({
  id: z.number().int().positive().nonnegative(),
});

export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Remove the nested 'body' wrapping
      const result = await schema.parseAsync(req.body);
      req.body = result; // Replace body with validated data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          issues: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };

export const validateDates =
  (startDateField: string, endDateField: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const startDate = new Date(req.body[startDateField]);
    const endDate = new Date(req.body[endDateField]);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        issues: [
          {
            field: startDateField,
            message: "Start date must be before end date",
          },
        ],
      });
    }

    next();
  };

export const validateIdParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params[paramName], 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`,
      });
    }
    next();
  };
};
