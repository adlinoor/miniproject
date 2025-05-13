import { Role } from "@prisma/client";

// Mock user object with all necessary fields
export const mockUser = {
  id: 1,
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  password: "secure123",
  role: Role.CUSTOMER,
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
export const mockEvent = {
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
export const MOCK_USER_ID = 1;
export const MOCK_REFERRAL_CODE = "REF12345";
export const MOCK_REFERRER = { id: 2, referralCode: "REF12345" };
export const MOCK_EMAIL = mockUser.email;
export const MOCK_PASSWORD = mockUser.password;
export const MOCK_FIRST_NAME = mockUser.first_name;
export const MOCK_LAST_NAME = mockUser.last_name;
export const MOCK_ROLE = mockUser.role;
export const MOCK_HASHED_PASSWORD = "$2b$10$hashedexample123";
export const MOCK_JWT_TOKEN = "mocked.jwt.token";

// Mock transaction input for test cases
export const mockTransactionInput = {
  quantity: 2,
  pointsUsed: 0,
  voucherCode: undefined,
};

export const mockPoints = [
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

export const mockCoupons = [
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
