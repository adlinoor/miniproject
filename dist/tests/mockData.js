"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockCoupons = exports.mockPoints = exports.mockTransactionInput = exports.MOCK_JWT_TOKEN = exports.MOCK_HASHED_PASSWORD = exports.MOCK_ROLE = exports.MOCK_LAST_NAME = exports.MOCK_FIRST_NAME = exports.MOCK_PASSWORD = exports.MOCK_EMAIL = exports.MOCK_REFERRER = exports.MOCK_REFERRAL_CODE = exports.MOCK_USER_ID = exports.mockEvent = exports.mockUser = void 0;
const client_1 = require("@prisma/client");
// Mock user object with all necessary fields
exports.mockUser = {
    id: 1,
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
    password: "secure123",
    role: client_1.Role.CUSTOMER,
    referralCode: "REF123456", // Referral code
    referredBy: null, // Referrer is null for a new user
    userPoints: 1000, // Points
    profilePicture: null, // Profile picture
    resetTokenExp: null, // Reset token expiration
    isVerified: false, // Verification status
    createdAt: new Date(), // Created timestamp
    updatedAt: new Date(), // Updated timestamp
    resetToken: null, // Reset token for password reset
};
// Mock event object with all necessary fields
exports.mockEvent = {
    id: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    title: "Test Event",
    description: "Test Description",
    startDate: new Date(),
    endDate: new Date(),
    location: "Test Location",
    category: "Test",
    price: 10000,
    availableSeats: 100,
    organizerId: 1, // Organizer ID
};
// Individual values for service tests
exports.MOCK_USER_ID = 1;
exports.MOCK_REFERRAL_CODE = "REF12345";
exports.MOCK_REFERRER = { id: 2, referralCode: "REF12345" };
exports.MOCK_EMAIL = exports.mockUser.email;
exports.MOCK_PASSWORD = exports.mockUser.password;
exports.MOCK_FIRST_NAME = exports.mockUser.first_name;
exports.MOCK_LAST_NAME = exports.mockUser.last_name;
exports.MOCK_ROLE = exports.mockUser.role;
exports.MOCK_HASHED_PASSWORD = "$2b$10$hashedexample123";
exports.MOCK_JWT_TOKEN = "mocked.jwt.token";
// Mock transaction input for test cases
exports.mockTransactionInput = {
    quantity: 2,
    pointsUsed: 0,
    voucherCode: undefined,
};
exports.mockPoints = [
    {
        id: 1,
        userId: 1, // Pastikan ada userId
        amount: 100,
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
    },
    {
        id: 2,
        userId: 1, // Pastikan ada userId
        amount: 200,
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
    },
];
exports.mockCoupons = [
    {
        id: "coupon1",
        userId: 1, // Pastikan ada userId
        code: "COUPON1",
        discount: 10,
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false,
        createdAt: new Date(),
    },
    {
        id: "coupon2",
        userId: 1, // Pastikan ada userId
        code: "COUPON2",
        discount: 20,
        expiresAt: new Date(Date.now() - 10000),
        isUsed: true,
        createdAt: new Date(),
    },
];
