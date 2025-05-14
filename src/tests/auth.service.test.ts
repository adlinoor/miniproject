import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// MOCK DATA
const MOCK_EMAIL = "test@example.com";
const MOCK_PASSWORD = "password123";
const MOCK_HASHED_PASSWORD = "hashed_password";
const MOCK_FIRST_NAME = "John";
const MOCK_LAST_NAME = "Doe";
const MOCK_ROLE = "CUSTOMER";
const MOCK_JWT_TOKEN = "mocked.jwt.token";

// 🔧 Buat mock function sekali untuk sinkronisasi
const mockUserFindFirst = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockPointCreate = jest.fn();
const mockCouponCreate = jest.fn();

// 🔧 Prisma mock sinkron di luar dan dalam transaksi
const mockPrisma = {
  $transaction: jest.fn(async (cb) =>
    cb({
      user: {
        findFirst: mockUserFindFirst,
        findUnique: mockUserFindUnique,
        create: mockUserCreate,
      },
      point: { create: mockPointCreate },
      coupon: { create: mockCouponCreate },
    })
  ),
  user: {
    findFirst: mockUserFindFirst,
    findUnique: mockUserFindUnique,
    create: mockUserCreate,
  },
  point: { create: mockPointCreate },
  coupon: { create: mockCouponCreate },
};

// ⛔️ Harus sebelum import auth.service
jest.mock("../lib/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

import { RegisterService, LoginService } from "../services/auth.service";

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECRET_KEY = "test-secret";
    jest.spyOn(Math, "random").mockReturnValue(0.123456); // untuk referralCode konsisten
  });

  describe("RegisterService", () => {
    it("should register a new user successfully", async () => {
      mockUserFindFirst.mockResolvedValue(null); // email belum ada
      (bcrypt.hash as jest.Mock).mockResolvedValue(MOCK_HASHED_PASSWORD);

      mockUserCreate.mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
        isVerified: false,
        referralCode: "REF-1A2B3C4D",
      });

      const user = await RegisterService({
        email: MOCK_EMAIL,
        password: MOCK_PASSWORD,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
        referralCode: undefined,
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(MOCK_EMAIL);
      expect(mockUserCreate).toHaveBeenCalled();
    });

    it("should throw error if email already registered", async () => {
      mockUserFindFirst.mockResolvedValue({ id: 1 });

      await expect(
        RegisterService({
          email: MOCK_EMAIL,
          password: MOCK_PASSWORD,
          first_name: MOCK_FIRST_NAME,
          last_name: MOCK_LAST_NAME,
          role: MOCK_ROLE,
          referralCode: undefined,
        })
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("LoginService", () => {
    beforeEach(() => {
      (jwt.sign as jest.Mock).mockReturnValue(MOCK_JWT_TOKEN);
    });

    it("should login with valid credentials", async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        password: MOCK_HASHED_PASSWORD,
        role: MOCK_ROLE,
        isVerified: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await LoginService({
        email: MOCK_EMAIL,
        password: MOCK_PASSWORD,
      });

      expect(result.token).toBe(MOCK_JWT_TOKEN);
      expect(result.user.email).toBe(MOCK_EMAIL);
    });

    it("should throw error if email not found", async () => {
      mockUserFindFirst.mockResolvedValue(null);

      await expect(
        LoginService({ email: "notfound@example.com", password: "abc" })
      ).rejects.toThrow("Email not registered");
    });

    it("should throw error if password incorrect", async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        password: MOCK_HASHED_PASSWORD,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
        isVerified: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        LoginService({ email: MOCK_EMAIL, password: "wrongpass" })
      ).rejects.toThrow("Incorrect password");
    });
  });
});
