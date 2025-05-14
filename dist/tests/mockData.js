"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockCoupons = exports.mockPoints = exports.mockTransaction = exports.mockPromotionInput = exports.mockPromotion = exports.mockEvent = exports.mockReferrerUser = exports.mockUser = exports.mockUserInput = void 0;
const client_1 = require("@prisma/client");
// ======================
// USER MOCK
// ======================
exports.mockUserInput = {
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
    password: "secure123",
    role: client_1.Role.CUSTOMER,
    referralCode: "REF123",
};
exports.mockUser = Object.assign(Object.assign({ id: 1 }, exports.mockUserInput), { referredBy: null, userPoints: 10000, profilePicture: null, isVerified: false, createdAt: new Date(), updatedAt: new Date(), resetToken: null, resetTokenExp: null });
exports.mockReferrerUser = Object.assign(Object.assign({}, exports.mockUser), { id: 99, email: "referrer@example.com", referralCode: "REF123" });
// ======================
// EVENT MOCK
// ======================
exports.mockEvent = {
    id: 1,
    title: "Test Event",
    description: "Sample description",
    startDate: new Date(),
    endDate: new Date(),
    location: "Jakarta",
    category: "Tech",
    price: 50000,
    availableSeats: 100,
    organizerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
};
// ======================
// PROMOTION MOCK
// ======================
exports.mockPromotion = {
    id: "promo-001",
    eventId: exports.mockEvent.id,
    code: "PROMO123",
    discount: 20000,
    startDate: new Date(),
    endDate: new Date(),
    maxUses: 100,
    uses: 0,
    createdAt: new Date(),
};
exports.mockPromotionInput = {
    id: "promo-001",
    eventId: 1,
    code: "PROMO10",
    discount: 10,
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 hari dari sekarang
    maxUses: 100,
    uses: 0,
    createdAt: new Date(),
};
// ======================
// TRANSACTION MOCK
// ======================
exports.mockTransaction = {
    id: 1,
    userId: exports.mockUser.id,
    eventId: exports.mockEvent.id,
    status: client_1.TransactionStatus.WAITING_FOR_PAYMENT,
    quantity: 2,
    totalPrice: 100000,
    paymentProof: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};
// ======================
// POINTS MOCK
// ======================
exports.mockPoints = [
    {
        id: 1,
        userId: exports.mockUser.id,
        amount: 10000,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 bulan
        createdAt: new Date(),
    },
];
// ======================
// COUPON MOCK
// ======================
exports.mockCoupons = [
    {
        id: "abc123",
        userId: exports.mockUser.id,
        code: "DISKON50",
        discount: 50000,
        isUsed: false,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
    },
];
