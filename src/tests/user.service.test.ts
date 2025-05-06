import { applyReferral } from "../services/user.service";
import prisma from "../lib/prisma";
import { sendEmail } from "../services/email.service";
import {
  MOCK_USER_ID,
  MOCK_REFERRAL_CODE,
  MOCK_REFERRER,
  MOCK_NEW_USER,
  MOCK_COUPON,
  MOCK_POINTS,
} from "./mockData";

// Mock dependencies
jest.mock("../lib/prisma", () => ({
  $transaction: jest.fn(async (callback) => {
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
}));

jest.mock("../services/email.service", () => ({
  sendEmail: jest.fn(),
}));

describe("User Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0.123456); // Mocking Math.random
  });

  describe("applyReferral", () => {
    it("should successfully apply referral code and create rewards", async () => {
      // Mock transaction behavior
      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async (callback) => {
          const mockTx = {
            user: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(MOCK_NEW_USER) // First call for user
                .mockResolvedValueOnce(MOCK_REFERRER), // Second call for referrer
              update: jest.fn().mockResolvedValue({
                ...MOCK_NEW_USER,
                referredBy: MOCK_REFERRAL_CODE,
              }),
            },
            point: {
              create: jest.fn().mockResolvedValue(MOCK_POINTS),
            },
            coupon: {
              create: jest.fn().mockResolvedValue(MOCK_COUPON),
            },
          };
          return callback(mockTx);
        }
      );

      const result = await applyReferral(MOCK_USER_ID, MOCK_REFERRAL_CODE);

      expect(result).toEqual(MOCK_COUPON);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("should throw error if user already used a referral", async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async (callback) => {
          const mockTx = {
            user: {
              findUnique: jest.fn().mockResolvedValueOnce({
                ...MOCK_NEW_USER,
                referredBy: "EXISTING123",
              }),
            },
          };
          return callback(mockTx);
        }
      );

      await expect(
        applyReferral(MOCK_USER_ID, MOCK_REFERRAL_CODE)
      ).rejects.toThrow("You already used a referral code");
    });

    it("should throw error for invalid referral code", async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async (callback) => {
          const mockTx = {
            user: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(MOCK_NEW_USER) // First call for user
                .mockResolvedValueOnce(null), // Second call for referrer (not found)
            },
          };
          return callback(mockTx);
        }
      );

      await expect(applyReferral(MOCK_USER_ID, "INVALID123")).rejects.toThrow(
        "Invalid referral code"
      );
    });

    it("should throw error when using own referral code", async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async (callback) => {
          const mockTx = {
            user: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(MOCK_NEW_USER) // First call for user
                .mockResolvedValueOnce({
                  ...MOCK_REFERRER,
                  id: MOCK_USER_ID, // Same ID as the user
                }),
            },
          };
          return callback(mockTx);
        }
      );

      await expect(
        applyReferral(MOCK_USER_ID, MOCK_REFERRAL_CODE)
      ).rejects.toThrow("Cannot use your own referral code");
    });

    it("should throw error if user not found", async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        async (callback) => {
          const mockTx = {
            user: {
              findUnique: jest.fn().mockResolvedValueOnce(null), // User not found
            },
          };
          return callback(mockTx);
        }
      );

      await expect(applyReferral(999, MOCK_REFERRAL_CODE)).rejects.toThrow(
        "User not found"
      );
    });
  });
});
