"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFutureDate = exports.createMockTransaction = exports.createMockPromotion = exports.createMockEvent = exports.createMockUser = exports.mockPromotion = exports.generateMockEventData = exports.mockToken = exports.mockEvent = exports.mockUser = exports.mockDate = void 0;
// Core mock data
exports.mockDate = new Date();
exports.mockUser = {
    id: 1,
    email: "organizer@example.com",
    role: "ORGANIZER",
    first_name: "Test",
    last_name: "Organizer",
    password: "hashedPassword",
    referralCode: "TEST123",
    referredBy: null,
    userPoints: 0,
    profilePicture: null,
    isVerified: true,
    createdAt: exports.mockDate,
    updatedAt: exports.mockDate,
};
exports.mockEvent = {
    id: 1,
    title: "Test Event",
    description: "Test Description",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-02"),
    location: "Test Location",
    category: "Test",
    price: 10000,
    availableSeats: 100,
    organizerId: exports.mockUser.id,
    createdAt: exports.mockDate,
    updatedAt: exports.mockDate,
    images: [],
    organizer: exports.mockUser,
    tickets: [],
    promotions: [],
    reviews: [],
    transactions: [],
};
exports.mockToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken";
// Helper functions for test data generation
const generateMockEventData = (overrides) => (Object.assign({ title: "Test Event", description: "Test Description", startDate: "2025-01-01T00:00:00.000Z", endDate: "2025-01-02T00:00:00.000Z", location: "Test Location", category: "Test", price: 10000, availableSeats: 100 }, overrides));
exports.generateMockEventData = generateMockEventData;
exports.mockPromotion = {
    id: "1",
    eventId: exports.mockEvent.id,
    code: "PROMO123",
    discount: 20,
    startDate: exports.mockDate,
    endDate: new Date(exports.mockDate.getTime() + 86400000), // 1 day later
    maxUses: 100,
    uses: 0,
    createdAt: exports.mockDate,
    event: exports.mockEvent,
};
// Factory functions for dynamic test data
const createMockUser = (overrides) => (Object.assign(Object.assign({}, exports.mockUser), overrides));
exports.createMockUser = createMockUser;
const createMockEvent = (overrides) => (Object.assign(Object.assign({}, exports.mockEvent), overrides));
exports.createMockEvent = createMockEvent;
const createMockPromotion = (overrides) => (Object.assign(Object.assign({}, exports.mockPromotion), overrides));
exports.createMockPromotion = createMockPromotion;
const createMockTransaction = (overrides = {}) => (Object.assign(Object.assign({ id: 1, eventId: exports.mockEvent.id, userId: exports.mockUser.id, quantity: 2, totalPrice: exports.mockEvent.price * 2, status: "waiting_for_payment", expiresAt: new Date(Date.now() + 7200000), paymentProof: null, voucherCode: null, pointsUsed: 0, createdAt: new Date(), updatedAt: new Date(), event: exports.mockEvent, user: {
        id: exports.mockUser.id,
        email: exports.mockUser.email,
        first_name: exports.mockUser.first_name,
        last_name: exports.mockUser.last_name,
    }, details: [] }, IDBTransaction), overrides));
exports.createMockTransaction = createMockTransaction;
// Utility functions
const getFutureDate = (daysFromNow) => new Date(exports.mockDate.getTime() + daysFromNow * 86400000);
exports.getFutureDate = getFutureDate;
