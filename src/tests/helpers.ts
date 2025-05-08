import {
  Role,
  User,
  Event,
  Promotion,
  TransactionStatus,
} from "@prisma/client";

// Type extensions for Prisma models
type MockUser = User & {
  referralCode: string;
  userPoints: number;
  profilePicture: string | null;
};

type MockEvent = Event & {
  images: string[];
  organizer: MockUser;
  tickets: any[];
  promotions: Promotion[];
  reviews: any[];
  transactions: any[];
};

type MockPromotion = Promotion & {
  event: MockEvent;
};

// Core mock data
export const mockDate = new Date();

export const mockUser: MockUser = {
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
  createdAt: mockDate,
  updatedAt: mockDate,
};

export const mockEvent: MockEvent = {
  id: 1,
  title: "Test Event",
  description: "Test Description",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-02"),
  location: "Test Location",
  category: "Test",
  price: 10000,
  availableSeats: 100,
  organizerId: mockUser.id,
  createdAt: mockDate,
  updatedAt: mockDate,
  images: [],
  organizer: mockUser,
  tickets: [],
  promotions: [],
  reviews: [],
  transactions: [],
};

export const mockToken =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken";

// Helper functions for test data generation
export const generateMockEventData = (overrides?: Partial<Event>) => ({
  title: "Test Event",
  description: "Test Description",
  startDate: "2025-01-01T00:00:00.000Z",
  endDate: "2025-01-02T00:00:00.000Z",
  location: "Test Location",
  category: "Test",
  price: 10000,
  availableSeats: 100,
  ...overrides,
});

export const mockPromotion: MockPromotion = {
  id: "1",
  eventId: mockEvent.id,
  code: "PROMO123",
  discount: 20,
  startDate: mockDate,
  endDate: new Date(mockDate.getTime() + 86400000), // 1 day later
  maxUses: 100,
  uses: 0,
  createdAt: mockDate,
  event: mockEvent,
};

// Factory functions for dynamic test data
export const createMockUser = (overrides?: Partial<MockUser>): MockUser => ({
  ...mockUser,
  ...overrides,
});

export const createMockEvent = (overrides?: Partial<MockEvent>): MockEvent => ({
  ...mockEvent,
  ...overrides,
});

export const createMockPromotion = (
  overrides?: Partial<MockPromotion>
): MockPromotion => ({
  ...mockPromotion,
  ...overrides,
});

export const createMockTransaction = (overrides = {}) => ({
  id: 1,
  eventId: mockEvent.id,
  userId: mockUser.id,
  quantity: 2,
  totalPrice: mockEvent.price * 2,
  status: "waiting_for_payment" as TransactionStatus,
  expiresAt: new Date(Date.now() + 7200000), // 2 hours
  paymentProof: null,
  voucherCode: null,
  pointsUsed: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  event: mockEvent,
  user: {
    id: mockUser.id,
    email: mockUser.email,
    first_name: mockUser.first_name,
    last_name: mockUser.last_name,
  },
  details: [],
  ...IDBTransaction,
  ...overrides,
});
// Utility functions
export const getFutureDate = (daysFromNow: number) =>
  new Date(mockDate.getTime() + daysFromNow * 86400000);
