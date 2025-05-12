import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { z } from "zod";

const idSchema = z.object({
  id: z.number().int().positive().nonnegative(),
});

//  * Middleware to validate two dates in the request body.
//  * @param startDateField - The name of the field for the start date.
//  * @param endDateField - The name of the field for the end date.
//  * @returns Middleware function that validates the dates.
//  */

export const validateDates =
  (startDateField: string, endDateField: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const startDate = new Date(req.body[startDateField]);
    const endDate = new Date(req.body[endDateField]);
    // Check if the date format is valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }
    // Check if the start date is before the end date
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
    next(); // Proceed to the next middleware
  };
