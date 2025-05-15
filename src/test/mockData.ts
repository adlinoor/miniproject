// Auth related mocks
export const MOCK_EMAIL = "test@example.com";
export const MOCK_PASSWORD = "password";
export const MOCK_HASHED_PASSWORD = "hashedPassword";
export const MOCK_FIRST_NAME = "Test";
export const MOCK_LAST_NAME = "User";
export const MOCK_ROLE = "CUSTOMER";
export const MOCK_JWT_TOKEN = "mockedToken";

// User related mocks
export const MOCK_USER_ID = 1;
export const MOCK_REFERRAL_CODE = "REF-123456";
export const MOCK_REFERRER = {
  id: 2,
  email: "referrer@example.com",
  first_name: "Referrer",
  referralCode: MOCK_REFERRAL_CODE,
};
export const MOCK_NEW_USER = {
  id: MOCK_USER_ID,
  referredBy: null,
  first_name: "New",
};
export const MOCK_COUPON = {
  id: MOCK_USER_ID,
  code: `WELCOME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  discount: 10000,
  expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
};
export const MOCK_POINTS = {
  userId: MOCK_REFERRER.id,
  amount: 10000,
  expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
};
