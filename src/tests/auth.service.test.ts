import { RegisterService, LoginService } from "../services/auth.service";
import bcrypt from "bcrypt";
import { prismaMock } from "./setup";
import { mockUser, mockUserInput, mockReferrerUser } from "./mockData";

jest.mock("bcrypt");

describe("🔐 Auth Service", () => {
  describe("RegisterService", () => {
    it("should register a new user successfully", async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");

      prismaMock.user.findUnique
        .mockResolvedValueOnce(null) // cek email
        .mockResolvedValueOnce(mockReferrerUser); // cek referral

      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await RegisterService(mockUserInput);

      expect(result).toHaveProperty("user");
      expect(result.email).toBe(mockUser.email);
    });

    it("should throw an error if email is already registered", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser); // langsung ketemu email terdaftar

      await expect(RegisterService(mockUserInput)).rejects.toThrow(
        "Email is already registered"
      );
    });
  });

  describe("LoginService", () => {
    const loginInput = {
      email: mockUser.email,
      password: "secure123",
    };

    it("should log in successfully with valid credentials", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await LoginService(loginInput);

      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe(mockUser.email);
    });

    it("should throw error if email not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(LoginService(loginInput)).rejects.toThrow(
        "Email not registered"
      );
    });

    it("should throw error if password is incorrect", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(LoginService(loginInput)).rejects.toThrow(
        "Incorrect password"
      );
    });
  });
});
