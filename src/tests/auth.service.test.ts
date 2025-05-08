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
import { prismaMock } from "./setup";

jest.mock("../lib/prisma", () => ({
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Math.random to return a consistent value for referralCode
    jest.spyOn(Math, "random").mockReturnValue(0.123456); // Mocking Math.random to return a consistent value
  });

  describe("RegisterService", () => {
    it("should register a new user successfully", async () => {
      // Mocking Prisma and bcrypt behavior
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue(MOCK_HASHED_PASSWORD); // Mock hashed password
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        isVerified: false,
        role: MOCK_ROLE,
        referralCode: `REF-${Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase()}`,
      });

      // Call the service
      const user = await RegisterService({
        email: MOCK_EMAIL,
        password: MOCK_PASSWORD,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
      });

      // Assertions
      expect(user).toBeDefined();
      expect(user.email).toBe(MOCK_EMAIL);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          first_name: MOCK_FIRST_NAME,
          last_name: MOCK_LAST_NAME,
          email: MOCK_EMAIL,
          password: MOCK_HASHED_PASSWORD,
          role: MOCK_ROLE,
          isVerified: false,
          referralCode: `REF-${Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()}`,
        },
      });
    });

    it("should throw an error if email is already registered", async () => {
      // Mocking Prisma behavior
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
      });

      // Call the service and expect an error
      await expect(
        RegisterService({
          email: MOCK_EMAIL,
          password: MOCK_PASSWORD,
          first_name: MOCK_FIRST_NAME,
          last_name: MOCK_LAST_NAME,
          role: MOCK_ROLE,
        })
      ).rejects.toThrow("Email already registered");

      // Assertions
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: MOCK_EMAIL },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("LoginService", () => {
    beforeEach(() => {
      // Clear all mocks
      jest.clearAllMocks();

      // Mock JWT sign to return our mock token
      (jwt.sign as jest.Mock).mockReturnValue(MOCK_JWT_TOKEN);

      // Ensure JWT_SECRET is set
      process.env.SECRET_KEY = "test-secret";
    });
    it("should log in successfully with valid credentials", async () => {
      // Mocking Prisma, bcrypt, and JWT behavior
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        password: MOCK_HASHED_PASSWORD,
        role: MOCK_ROLE,
        isVerified: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Password matches

      // Call the service
      const result = await LoginService({
        email: MOCK_EMAIL,
        password: MOCK_PASSWORD,
      });

      // Assertions
      expect(result).toBeDefined();
      expect(result.token).toBe(MOCK_JWT_TOKEN);
      expect(result.user.email).toBe(MOCK_EMAIL);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        MOCK_PASSWORD,
        MOCK_HASHED_PASSWORD
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 1,
          email: MOCK_EMAIL,
          first_name: MOCK_FIRST_NAME,
          last_name: MOCK_LAST_NAME,
          role: MOCK_ROLE,
        },
        "test-secret", // Use the actual secret from environment
        { expiresIn: "1h" }
      );
    });

    it("should throw an error if email is not registered", async () => {
      // Mocking Prisma behavior
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null); // No user found

      // Call the service and expect an error
      await expect(
        LoginService({
          email: "nonexistent@example.com",
          password: MOCK_PASSWORD,
        })
      ).rejects.toThrow("Email not registered");

      // Assertions
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: "nonexistent@example.com" },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should throw an error if password is incorrect", async () => {
      // Mocking Prisma and bcrypt behavior
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        password: MOCK_HASHED_PASSWORD,
        role: MOCK_ROLE,
        isVerified: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Password does not match

      // Call the service and expect an error
      await expect(
        LoginService({
          email: MOCK_EMAIL,
          password: "wrongpassword",
        })
      ).rejects.toThrow("Incorrect password");

      // Assertions
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: MOCK_EMAIL },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        MOCK_HASHED_PASSWORD
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
