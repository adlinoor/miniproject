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
exports.validateDates = exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    message: "Validation failed",
                    issues: error.issues,
                });
            }
            next(error);
        }
    });
};
exports.validateRequest = validateRequest;
const validateDates = (startDateField, endDateField) => {
    return (req, res, next) => {
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
exports.validateDates = validateDates;
