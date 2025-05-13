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
describe("🔐 Auth Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Math, "random").mockReturnValue(0.123456); // stabilize referralCode
        process.env.SECRET_KEY = "test-secret"; // ensure token works
    });
    describe("📝 RegisterService", () => {
        it("should register a new user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.user.findFirst.mockResolvedValue(null);
            bcrypt_1.default.hash.mockResolvedValue(mockData_1.MOCK_HASHED_PASSWORD);
            prisma_1.default.user.create.mockResolvedValue({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                isVerified: false,
                role: mockData_1.MOCK_ROLE,
                referralCode: "REF-1Z2X3C4V", // stable referralCode for test
            });
            const user = yield (0, auth_service_1.RegisterService)({
                email: mockData_1.MOCK_EMAIL,
                password: mockData_1.MOCK_PASSWORD,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                role: mockData_1.MOCK_ROLE,
                referralCode: null, // tambahkan ini
            });
            expect(user).toBeDefined();
            expect(user.email).toBe(mockData_1.MOCK_EMAIL);
            expect(prisma_1.default.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: mockData_1.MOCK_EMAIL,
                    password: mockData_1.MOCK_HASHED_PASSWORD,
                    role: mockData_1.MOCK_ROLE,
                    referralCode: expect.stringMatching(/^REF-[A-Z0-9]{8}$/),
                }),
            });
        }));
        it("should throw an error if email is already registered", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.user.findFirst.mockResolvedValue({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
            });
            yield expect((0, auth_service_1.RegisterService)({
                email: mockData_1.MOCK_EMAIL,
                password: mockData_1.MOCK_PASSWORD,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                role: mockData_1.MOCK_ROLE,
                referralCode: null, // tambahkan ini
            })).rejects.toThrow("Email already registered");
            expect(prisma_1.default.user.create).not.toHaveBeenCalled();
        }));
    });
    describe("🔓 LoginService", () => {
        it("should log in successfully with valid credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.user.findFirst.mockResolvedValue({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                password: mockData_1.MOCK_HASHED_PASSWORD,
                role: mockData_1.MOCK_ROLE,
                isVerified: true,
            });
            bcrypt_1.default.compare.mockResolvedValue(true);
            jsonwebtoken_1.default.sign.mockReturnValue(mockData_1.MOCK_JWT_TOKEN);
            const result = yield (0, auth_service_1.LoginService)({
                email: mockData_1.MOCK_EMAIL,
                password: mockData_1.MOCK_PASSWORD,
            });
            expect(result.token).toBe(mockData_1.MOCK_JWT_TOKEN);
            expect(result.user.email).toBe(mockData_1.MOCK_EMAIL);
        }));
        it("should throw error if email not found", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.user.findFirst.mockResolvedValue(null);
            yield expect((0, auth_service_1.LoginService)({ email: "wrong@email.com", password: "pass" })).rejects.toThrow("Email not registered");
            expect(jsonwebtoken_1.default.sign).not.toHaveBeenCalled();
        }));
        it("should throw error if password is incorrect", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.user.findFirst.mockResolvedValue({
                id: 1,
                email: mockData_1.MOCK_EMAIL,
                first_name: mockData_1.MOCK_FIRST_NAME,
                last_name: mockData_1.MOCK_LAST_NAME,
                password: mockData_1.MOCK_HASHED_PASSWORD,
                role: mockData_1.MOCK_ROLE,
                isVerified: true,
            });
            bcrypt_1.default.compare.mockResolvedValue(false);
            yield expect((0, auth_service_1.LoginService)({
                email: mockData_1.MOCK_EMAIL,
                password: "wrongpassword",
            })).rejects.toThrow("Incorrect password");
        }));
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
});
