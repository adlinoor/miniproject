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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../services/auth.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mockData_1 = require("./mockData");
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
        it("should register a new user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mocking Prisma and bcrypt behavior
            prisma_1.default.user.findFirst.mockResolvedValue(null); // No existing user
            bcrypt_1.default.hash.mockResolvedValue(mockData_1.MOCK_HASHED_PASSWORD); // Mock hashed password
            prisma_1.default.user.create.mockResolvedValue({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                isVerified: false,
                role: mockData_1.MOCK_ROLE,
                referralCode: `REF-${Math.random()
                    .toString(36)
                    .substring(2, 10)
                    .toUpperCase()}`,
            });
            // Call the service
            const user = yield (0, auth_service_1.RegisterService)({
                email: mockData_1.MOCK_EMAIL,
                password: mockData_1.MOCK_PASSWORD,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                role: mockData_1.MOCK_ROLE,
            });
            // Assertions
            expect(user).toBeDefined();
            expect(user.email).toBe(mockData_1.MOCK_EMAIL);
            expect(prisma_1.default.user.create).toHaveBeenCalledWith({
                data: {
                    first_name: mockData_1.MOCK_FIRST_NAME,
                    last_name: mockData_1.MOCK_LAST_NAME,
                    email: mockData_1.MOCK_EMAIL,
                    password: mockData_1.MOCK_HASHED_PASSWORD,
                    role: mockData_1.MOCK_ROLE,
                    isVerified: false,
                    referralCode: `REF-${Math.random()
                        .toString(36)
                        .substring(2, 10)
                        .toUpperCase()}`,
                },
            });
        }));
        it("should throw an error if email is already registered", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mocking Prisma behavior
            prisma_1.default.user.findFirst.mockResolvedValue({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
            });
            // Call the service and expect an error
            yield expect((0, auth_service_1.RegisterService)({
                email: mockData_1.MOCK_EMAIL,
                password: mockData_1.MOCK_PASSWORD,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                role: mockData_1.MOCK_ROLE,
            })).rejects.toThrow("Email already registered");
            // Assertions
            expect(prisma_1.default.user.findFirst).toHaveBeenCalledWith({
                where: { email: mockData_1.MOCK_EMAIL },
            });
            expect(prisma_1.default.user.create).not.toHaveBeenCalled();
        }));
    });
    describe("LoginService", () => {
        beforeEach(() => {
            // Clear all mocks
            jest.clearAllMocks();
            // Mock JWT sign to return our mock token
            jsonwebtoken_1.default.sign.mockReturnValue(mockData_1.MOCK_JWT_TOKEN);
            // Ensure JWT_SECRET is set
            process.env.SECRET_KEY = "test-secret";
        });
        it("should log in successfully with valid credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mocking Prisma, bcrypt, and JWT behavior
            prisma_1.default.user.findFirst.mockResolvedValue({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                password: mockData_1.MOCK_HASHED_PASSWORD,
                role: mockData_1.MOCK_ROLE,
                isVerified: true,
            });
            bcrypt_1.default.compare.mockResolvedValue(true); // Password matches
            // Call the service
            const result = yield (0, auth_service_1.LoginService)({
                email: mockData_1.MOCK_EMAIL,
                password: mockData_1.MOCK_PASSWORD,
            });
            // Assertions
            expect(result).toBeDefined();
            expect(result.token).toBe(mockData_1.MOCK_JWT_TOKEN);
            expect(result.user.email).toBe(mockData_1.MOCK_EMAIL);
            expect(bcrypt_1.default.compare).toHaveBeenCalledWith(mockData_1.MOCK_PASSWORD, mockData_1.MOCK_HASHED_PASSWORD);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                role: mockData_1.MOCK_ROLE,
            }, "test-secret", // Use the actual secret from environment
            { expiresIn: "1h" });
        }));
        it("should throw an error if email is not registered", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mocking Prisma behavior
            prisma_1.default.user.findFirst.mockResolvedValue(null); // No user found
            // Call the service and expect an error
            yield expect((0, auth_service_1.LoginService)({
                email: "nonexistent@example.com",
                password: mockData_1.MOCK_PASSWORD,
            })).rejects.toThrow("Email not registered");
            // Assertions
            expect(prisma_1.default.user.findFirst).toHaveBeenCalledWith({
                where: { email: "nonexistent@example.com" },
            });
            expect(bcrypt_1.default.compare).not.toHaveBeenCalled();
            expect(jsonwebtoken_1.default.sign).not.toHaveBeenCalled();
        }));
        it("should throw an error if password is incorrect", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mocking Prisma and bcrypt behavior
            prisma_1.default.user.findFirst.mockResolvedValue({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                password: mockData_1.MOCK_HASHED_PASSWORD,
                role: mockData_1.MOCK_ROLE,
                isVerified: true,
            });
            bcrypt_1.default.compare.mockResolvedValue(false); // Password does not match
            // Call the service and expect an error
            yield expect((0, auth_service_1.LoginService)({
                email: mockData_1.MOCK_EMAIL,
                password: "wrongpassword",
            })).rejects.toThrow("Incorrect password");
            // Assertions
            expect(prisma_1.default.user.findFirst).toHaveBeenCalledWith({
                where: { email: mockData_1.MOCK_EMAIL },
            });
            expect(bcrypt_1.default.compare).toHaveBeenCalledWith("wrongpassword", mockData_1.MOCK_HASHED_PASSWORD);
            expect(jsonwebtoken_1.default.sign).not.toHaveBeenCalled();
        }));
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
});
