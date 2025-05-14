const mockTxUser = {
  findFirst: jest.fn().mockResolvedValue(null),
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({
    id: 1,
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    isVerified: false,
    role: "CUSTOMER",
    referralCode: "REF-MOCK",
    referredBy: null,
  }),
};

const mockTxPoint = {
  create: jest.fn().mockResolvedValue({}),
};

const mockTxCoupon = {
  create: jest.fn().mockResolvedValue({}),
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

// ✅ 2. Import setelah mock
import { RegisterService, LoginService } from "../services/auth.service";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  MOCK_EMAIL,
  MOCK_PASSWORD,
  MOCK_HASHED_PASSWORD,
  MOCK_FIRST_NAME,
  MOCK_LAST_NAME,
  MOCK_ROLE,
  MOCK_JWT_TOKEN,
} from "./mockData";

// ✅ 3. Test Suite
describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0.123456);
    process.env.SECRET_KEY = "test-secret";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("RegisterService", () => {
    it("should register a new user successfully", async () => {
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
          first_name: MOCK_FIRST_NAME,
          last_name: MOCK_LAST_NAME,
          email: MOCK_EMAIL,
          password: MOCK_HASHED_PASSWORD,
          role: MOCK_ROLE,
          isVerified: false,
          referralCode: expect.any(String),
          referredBy: null,
        },
      });
    });

    it("should throw an error if email is already registered", async () => {
      mockTxUser.findFirst.mockResolvedValueOnce({ id: 1, email: MOCK_EMAIL });

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

      expect(mockTxUser.findFirst).toHaveBeenCalledWith({
        where: { email: MOCK_EMAIL },
      });
      expect(mockTxUser.create).not.toHaveBeenCalled();
    });
  });

  describe("LoginService", () => {
    it("should log in successfully with valid credentials", async () => {
      mockTxUser.findFirst.mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        password: MOCK_HASHED_PASSWORD,
        role: MOCK_ROLE,
        isVerified: true,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(MOCK_JWT_TOKEN);

      const result = await LoginService({
        email: MOCK_EMAIL,
        password: MOCK_PASSWORD,
      });

      expect(result).toBeDefined();
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

      expect(mockTxUser.findFirst).toHaveBeenCalledWith({
        where: { email: "nonexistent@example.com" },
      });
    });

    it("should throw an error if password is incorrect", async () => {
      mockTxUser.findFirst.mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        password: MOCK_HASHED_PASSWORD,
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

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        MOCK_HASHED_PASSWORD
      );
    });
  });
});
