"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockCloudinary = exports.mockMailTransport = exports.prismaMock = void 0;
const jest_mock_extended_1 = require("jest-mock-extended");
const globals_1 = require("@jest/globals");
// Create a mock instance of PrismaClient
exports.prismaMock = (0, jest_mock_extended_1.mockDeep)();
// Mock the prisma import globally
globals_1.jest.mock("../lib/prisma", () => ({
    __esModule: true,
    default: exports.prismaMock,
}));
// Mock environment variables
process.env.SECRET_KEY = "test-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
process.env.EMAIL_USER = "test@email.com";
process.env.EMAIL_PASS = "test-password";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";
// Reset all mocks before each test
(0, globals_1.beforeEach)(() => {
    globals_1.jest.clearAllMocks();
    // Mock Prisma transaction to prevent actual database connections
    exports.prismaMock.$transaction.mockImplementation((callback) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof callback === "function") {
            return callback(exports.prismaMock);
        }
        return callback;
    }));
});
// Clean up after all tests
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Disconnect Prisma mock
    yield exports.prismaMock.$disconnect();
    // Clear all Jest mocks
    globals_1.jest.clearAllMocks();
    globals_1.jest.restoreAllMocks();
    // Reset all manual mock implementations
    mockMailTransport.sendMail.mockClear();
    mockCloudinary.uploader.upload.mockClear();
    mockCloudinary.uploader.destroy.mockClear();
    // Clear any pending timers
    globals_1.jest.clearAllTimers();
    // Reset environment variables
    globals_1.jest.resetModules();
}));
// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
// Mock console.log to reduce noise in tests
const originalLog = console.log;
beforeAll(() => {
    console.log = globals_1.jest.fn();
});
afterAll(() => {
    console.log = originalLog;
});
// Mock jsonwebtoken
globals_1.jest.mock("jsonwebtoken", () => ({
    verify: globals_1.jest.fn(),
    sign: globals_1.jest.fn(),
}));
// Mock bcrypt
globals_1.jest.mock("bcrypt", () => ({
    hash: globals_1.jest.fn(),
    compare: globals_1.jest.fn(),
}));
const mockMailTransport = {
    sendMail: globals_1.jest.fn().mockImplementation(() => Promise.resolve({
        accepted: ["test@example.com"],
        rejected: [],
        response: "250 Message accepted",
    })),
};
exports.mockMailTransport = mockMailTransport;
globals_1.jest.mock("nodemailer", () => ({
    createTransport: globals_1.jest.fn(() => mockMailTransport),
}));
const mockCloudinary = {
    config: globals_1.jest.fn(),
    uploader: {
        upload: globals_1.jest.fn().mockImplementation(() => Promise.resolve({
            public_id: "test_public_id",
            secure_url: "https://test-cloudinary-url.com/image.jpg",
        })),
        destroy: globals_1.jest.fn().mockImplementation(() => Promise.resolve({
            result: "ok",
        })),
    },
};
exports.mockCloudinary = mockCloudinary;
globals_1.jest.mock("cloudinary", () => ({
    v2: mockCloudinary,
}));
