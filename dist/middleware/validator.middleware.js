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
/**
 * Validasi body request menggunakan Zod.
 */
const validateRequest = (schema) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield schema.parseAsync(req.body);
        req.body = result;
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
/**
 * Validasi bahwa startDate < endDate dan format valid.
 */
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
/**
 * Validasi parameter ID (harus integer > 0).
 */
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
