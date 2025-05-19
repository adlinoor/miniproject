import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Validasi body request menggunakan Zod.
 */
export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.parseAsync(req.body);
      req.body = result;
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

/**
 * Validasi bahwa startDate < endDate dan format valid.
 */
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

/**
 * Validasi parameter ID (harus integer > 0).
 */
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
