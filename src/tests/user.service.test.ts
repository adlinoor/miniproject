import {
  getUserById,
  updateUser,
  getUserRewardSummary,
} from "../services/user.service";
import { mockUser, mockPoints, mockCoupons } from "./mockData";
import { prismaMock } from "./setup"; // Mock prisma untuk test
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("../lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  point: {
    findMany: jest.fn(),
  },
  coupon: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation((callback) => {
    const mockTx = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      point: {
        create: jest.fn(),
      },
      coupon: {
        create: jest.fn(),
      },
    };
    return callback(mockTx);
  }),
}));

describe("User Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0.123456); // Mocking Math.random
    (jwt.verify as jest.Mock).mockImplementation(() => ({
      id: mockUser.id,
      role: mockUser.role,
      email: mockUser.email,
      first_name: mockUser.first_name,
      last_name: mockUser.last_name,
    }));
  });

  // Test untuk getUserById
  describe("getUserById", () => {
    it("should fetch user by id", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser); // Mock response untuk user

      const result = await getUserById(mockUser.id);

      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profilePicture: true,
          role: true,
          userPoints: true,
          createdAt: true,
        },
      });
    });

    it("should return null if user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // User not found

      const result = await getUserById(999);

      expect(result).toBeNull();
    });
  });

  // Test untuk updateUser
  describe("updateUser", () => {
    it("should update user profile", async () => {
      const updatedData = {
        first_name: "John",
        last_name: "Doe",
      };

      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        ...updatedData,
      });

      const result = await updateUser(mockUser.id, updatedData);

      expect(result).toBeDefined();
      expect(result.first_name).toBe(updatedData.first_name);
      expect(result.last_name).toBe(updatedData.last_name);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updatedData,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profilePicture: true,
          role: true,
          userPoints: true,
          updatedAt: true,
        },
      });
    });
  });

  // Test untuk getUserRewardSummary
  describe("getUserRewardSummary", () => {
    it("should return active points and coupons", async () => {
      prismaMock.point.findMany.mockResolvedValue(mockPoints);
      prismaMock.coupon.findMany.mockResolvedValue(mockCoupons);

      const result = await getUserRewardSummary(mockUser.id);

      expect(result.totalActivePoints).toBe(300); // Total points
      expect(result.coupons.active.length).toBe(1); // Active coupon
      expect(result.coupons.used.length).toBe(1); // Used coupon
      expect(result.coupons.expired.length).toBe(0); // No expired coupon
    });

    it("should return 0 points if no active points", async () => {
      prismaMock.point.findMany.mockResolvedValue([]);
      prismaMock.coupon.findMany.mockResolvedValue([]);

      const result = await getUserRewardSummary(mockUser.id);

      expect(result.totalActivePoints).toBe(0);
      expect(result.coupons.active.length).toBe(0);
      expect(result.coupons.used.length).toBe(0);
      expect(result.coupons.expired.length).toBe(0);
    });
  });
});
