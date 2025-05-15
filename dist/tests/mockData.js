"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_POINTS = exports.MOCK_COUPON = exports.MOCK_NEW_USER = exports.MOCK_REFERRER = exports.MOCK_REFERRAL_CODE = exports.MOCK_USER_ID = exports.MOCK_JWT_TOKEN = exports.MOCK_ROLE = exports.MOCK_LAST_NAME = exports.MOCK_FIRST_NAME = exports.MOCK_HASHED_PASSWORD = exports.MOCK_PASSWORD = exports.MOCK_EMAIL = void 0;
// Auth related mocks
exports.MOCK_EMAIL = "test@example.com";
exports.MOCK_PASSWORD = "password";
exports.MOCK_HASHED_PASSWORD = "hashedPassword";
exports.MOCK_FIRST_NAME = "Test";
exports.MOCK_LAST_NAME = "User";
exports.MOCK_ROLE = "CUSTOMER";
exports.MOCK_JWT_TOKEN = "mockedToken";
// User related mocks
exports.MOCK_USER_ID = 1;
exports.MOCK_REFERRAL_CODE = "REF-123456";
exports.MOCK_REFERRER = {
    id: 2,
    email: "referrer@example.com",
    first_name: "Referrer",
    referralCode: exports.MOCK_REFERRAL_CODE,
};
exports.MOCK_NEW_USER = {
    id: exports.MOCK_USER_ID,
    referredBy: null,
    first_name: "New",
};
exports.MOCK_COUPON = {
    id: exports.MOCK_USER_ID,
    code: `WELCOME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    discount: 10000,
    expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
};
exports.MOCK_POINTS = {
    userId: exports.MOCK_REFERRER.id,
    amount: 10000,
    expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
};
