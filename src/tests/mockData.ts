import { Role, TransactionStatus } from "@prisma/client";

// ======================
// USER MOCK
// ======================

export const mockUserInput = {
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  password: "secure123",
  role: Role.CUSTOMER,
  referralCode: "REF123",
};

export const mockUser = {
  id: 1,
  ...mockUserInput,
  referredBy: null,
  userPoints: 10000,
  profilePicture: null,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  resetToken: null,
  resetTokenExp: null,
};

export const mockReferrerUser = {
  ...mockUser,
  id: 99,
  email: "referrer@example.com",
  referralCode: "REF123",
};

// ======================
// EVENT MOCK
// ======================

export const mockEvent = {
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

export const mockPromotion = {
  id: "promo-001",
  eventId: mockEvent.id,
  code: "PROMO123",
  discount: 20000,
  startDate: new Date(),
  endDate: new Date(),
  maxUses: 100,
  uses: 0,
  createdAt: new Date(),
};

export const mockPromotionInput = {
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

export const mockTransaction = {
  id: 1,
  userId: mockUser.id,
  eventId: mockEvent.id,
  status: TransactionStatus.WAITING_FOR_PAYMENT,
  quantity: 2,
  totalPrice: 100000,
  paymentProof: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ======================
// POINTS MOCK
// ======================

export const mockPoints = [
  {
    id: 1,
    userId: mockUser.id,
    amount: 10000,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 bulan
    createdAt: new Date(),
  },
];

// ======================
// COUPON MOCK
// ======================

export const mockCoupons = [
  {
    id: "abc123",
    userId: mockUser.id,
    code: "DISKON50",
    discount: 50000,
    isUsed: false,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  },
];
