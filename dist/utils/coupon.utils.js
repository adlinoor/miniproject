"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCouponCode = void 0;
const generateCouponCode = () => {
    if (process.env.NODE_ENV === "test") {
        return "WELCOME-TEST123"; // Fixed value for tests
    }
    return `WELCOME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};
exports.generateCouponCode = generateCouponCode;
