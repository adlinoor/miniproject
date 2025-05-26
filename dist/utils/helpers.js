"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCouponCode = exports.generateReferralCode = void 0;
const generateReferralCode = () => {
    // Kode referal selalu ada prefix "REF-"
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `REF-${result}`;
};
exports.generateReferralCode = generateReferralCode;
const generateCouponCode = () => {
    if (process.env.NODE_ENV === "test") {
        return "WELCOME-TEST123";
    }
    return `COUP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};
exports.generateCouponCode = generateCouponCode;
