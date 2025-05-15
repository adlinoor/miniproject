"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdParam = exports.validateDates = exports.validateRequest = void 0;
const zod_1 = require("zod");
const zod_2 = require("zod");
const idSchema = zod_2.z.object({
    id: zod_2.z.number().int().positive().nonnegative(),
});
const validateRequest = (schema) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Remove the nested 'body' wrapping
        const result = yield schema.parseAsync(req.body);
        req.body = result; // Replace body with validated data
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
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
});
exports.validateRequest = validateRequest;
const validateDates = (startDateField, endDateField) => (req, res, next) => {
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
exports.validateDates = validateDates;
const validateIdParam = (paramName) => {
    return (req, res, next) => {
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
exports.validateIdParam = validateIdParam;
