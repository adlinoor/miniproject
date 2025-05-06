import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { beforeEach, jest } from "@jest/globals";

// Create a mock instance of PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Mock the prisma import globally
jest.mock("../lib/prisma", () => ({
  __esModule: true,
  default: prismaMock,
}));

// Mock environment variables
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
process.env.EMAIL_USER = "test@email.com";
process.env.EMAIL_PASS = "test-password";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Mock Prisma transaction to prevent actual database connections
  (prismaMock.$transaction as jest.Mock).mockImplementation(
    async (callback) => {
      if (typeof callback === "function") {
        return callback(prismaMock);
      }
      return callback;
    }
  );
});

// Clean up after all tests
afterAll(async () => {
  // Disconnect Prisma mock
  await prismaMock.$disconnect();

  // Clear all Jest mocks
  jest.clearAllMocks();
  jest.restoreAllMocks();

  // Reset all manual mock implementations
  mockMailTransport.sendMail.mockClear();
  mockCloudinary.uploader.upload.mockClear();
  mockCloudinary.uploader.destroy.mockClear();

  // Clear any pending timers
  jest.clearAllTimers();

  // Reset environment variables
  jest.resetModules();
});
// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Mock console.log to reduce noise in tests
const originalLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
});

// Export types
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock nodemailer
type MailResponse = {
  accepted: string[];
  rejected: string[];
  response: string;
};

const mockMailTransport = {
  sendMail: jest.fn().mockImplementation(() =>
    Promise.resolve({
      accepted: ["test@example.com"],
      rejected: [],
      response: "250 Message accepted",
    } as MailResponse)
  ),
};

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => mockMailTransport),
}));

// Mock cloudinary
type CloudinaryResponse = {
  public_id: string;
  secure_url: string;
};

type CloudinaryDestroyResponse = {
  result: string;
};

const mockCloudinary = {
  config: jest.fn(),
  uploader: {
    upload: jest.fn().mockImplementation(() =>
      Promise.resolve({
        public_id: "test_public_id",
        secure_url: "https://test-cloudinary-url.com/image.jpg",
      } as CloudinaryResponse)
    ),
    destroy: jest.fn().mockImplementation(() =>
      Promise.resolve({
        result: "ok",
      } as CloudinaryDestroyResponse)
    ),
  },
};

jest.mock("cloudinary", () => ({
  v2: mockCloudinary,
}));

export {
  mockMailTransport,
  mockCloudinary,
  type MailResponse,
  type CloudinaryResponse,
  type CloudinaryDestroyResponse,
};
