// ===== MOCK SETUP (HARUS DI ATAS IMPORT) =====
import {
  MOCK_EMAIL,
  MOCK_PASSWORD,
  MOCK_HASHED_PASSWORD,
  MOCK_FIRST_NAME,
  MOCK_LAST_NAME,
  MOCK_ROLE,
  MOCK_JWT_TOKEN,
  MOCK_USER_ID,
  MOCK_REFERRAL_CODE,
  MOCK_REFERRER,
  MOCK_NEW_USER,
  MOCK_COUPON,
  MOCK_POINTS,
} from "./mockData";

const mockTxUser = {
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
};

const mockTxPoint = {
  create: jest.fn(),
};

const mockTxCoupon = {
  create: jest.fn(),
};

const mockPrisma = {
  $transaction: jest.fn(async (cb) =>
    cb({
      user: mockTxUser,
      point: mockTxPoint,
      coupon: mockTxCoupon,
    })
  ),
  user: mockTxUser,
  point: mockTxPoint,
  coupon: mockTxCoupon,
};

jest.mock("../lib/prisma", () => mockPrisma);
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

// ===== IMPORTS =====
import { RegisterService, LoginService } from "../services/auth.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ===== TEST SUITE =====
describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0.123456); // Consistent REF code
    process.env.SECRET_KEY = "test-secret";
  });

  describe("RegisterService", () => {
    it("should register a new user successfully", async () => {
      mockTxUser.findFirst.mockResolvedValue(null); // email belum ada
      mockTxUser.findUnique.mockResolvedValue(null); // referralCode tidak ada
      mockTxUser.create.mockResolvedValue({
        id: MOCK_USER_ID,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
        isVerified: false,
        referralCode: "REF-1Z141Z14",
        referredBy: null,
      });

      mockTxPoint.create.mockResolvedValue({});
      mockTxCoupon.create.mockResolvedValue({});

      (bcrypt.hash as jest.Mock).mockResolvedValue(MOCK_HASHED_PASSWORD);

      const user = await RegisterService({
        email: MOCK_EMAIL,
        password: MOCK_PASSWORD,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
        referralCode: null,
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(MOCK_EMAIL);
      expect(mockTxUser.create).toHaveBeenCalledWith({
        data: {
          email: MOCK_EMAIL,
          password: MOCK_HASHED_PASSWORD,
          first_name: MOCK_FIRST_NAME,
          last_name: MOCK_LAST_NAME,
          role: MOCK_ROLE,
          isVerified: false,
          referralCode: "REF-1Z141Z14",
          referredBy: null,
        },
      });
    });

    it("should throw an error if email is already registered", async () => {
      mockTxUser.findFirst.mockResolvedValue({ id: 999, email: MOCK_EMAIL });

      await expect(
        RegisterService({
          email: MOCK_EMAIL,
          password: MOCK_PASSWORD,
          first_name: MOCK_FIRST_NAME,
          last_name: MOCK_LAST_NAME,
          role: MOCK_ROLE,
          referralCode: null,
        })
      ).rejects.toThrow("Email already registered");

      expect(mockTxUser.create).not.toHaveBeenCalled();
    });
  });

  describe("LoginService", () => {
    it("should log in successfully with valid credentials", async () => {
      mockTxUser.findFirst.mockResolvedValue({
        id: MOCK_USER_ID,
        email: MOCK_EMAIL,
        password: MOCK_HASHED_PASSWORD,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
        isVerified: true,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(MOCK_JWT_TOKEN);

      const result = await LoginService({
        email: MOCK_EMAIL,
        password: MOCK_PASSWORD,
      });

      expect(result.token).toBe(MOCK_JWT_TOKEN);
      expect(result.user.email).toBe(MOCK_EMAIL);
    });

    it("should throw an error if email is not registered", async () => {
      mockTxUser.findFirst.mockResolvedValue(null);

      await expect(
        LoginService({
          email: "nonexistent@example.com",
          password: MOCK_PASSWORD,
        })
      ).rejects.toThrow("Email not registered");
    });

    it("should throw an error if password is incorrect", async () => {
      mockTxUser.findFirst.mockResolvedValue({
        id: MOCK_USER_ID,
        email: MOCK_EMAIL,
        password: MOCK_HASHED_PASSWORD,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
        isVerified: true,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        LoginService({
          email: MOCK_EMAIL,
          password: "wrongpassword",
        })
      ).rejects.toThrow("Incorrect password");
    });
  });
});
