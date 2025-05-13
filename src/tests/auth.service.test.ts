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

jest.mock("../lib/prisma", () => ({
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("🔐 Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0.123456); // stabilize referralCode
    process.env.SECRET_KEY = "test-secret"; // ensure token works
  });

  describe("📝 RegisterService", () => {
    it("should register a new user successfully", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(MOCK_HASHED_PASSWORD);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        isVerified: false,
        role: MOCK_ROLE,
        referralCode: "REF-1Z2X3C4V", // stable referralCode for test
      });

      const user = await RegisterService({
        email: MOCK_EMAIL,
        password: MOCK_PASSWORD,
        first_name: MOCK_FIRST_NAME,
        last_name: MOCK_LAST_NAME,
        role: MOCK_ROLE,
        referralCode: null, // tambahkan ini
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(MOCK_EMAIL);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: MOCK_EMAIL,
          password: MOCK_HASHED_PASSWORD,
          role: MOCK_ROLE,
          referralCode: expect.stringMatching(/^REF-[A-Z0-9]{8}$/),
        }),
      });
    });

    it("should throw an error if email is already registered", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: MOCK_EMAIL,
      });

      await expect(
        RegisterService({
          email: MOCK_EMAIL,
          password: MOCK_PASSWORD,
          first_name: MOCK_FIRST_NAME,
          last_name: MOCK_LAST_NAME,
          role: MOCK_ROLE,
          referralCode: null, // tambahkan ini
        })
      ).rejects.toThrow("Email already registered");

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("🔓 LoginService", () => {
    it("should log in successfully with valid credentials", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
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

      expect(result.token).toBe(MOCK_JWT_TOKEN);
      expect(result.user.email).toBe(MOCK_EMAIL);
    });

    it("should throw error if email not found", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        LoginService({ email: "wrong@email.com", password: "pass" })
      ).rejects.toThrow("Email not registered");

      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should throw error if password is incorrect", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
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
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
