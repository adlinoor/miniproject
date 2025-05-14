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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// MOCK DATA
const MOCK_EMAIL = "test@example.com";
const MOCK_PASSWORD = "password123";
const MOCK_HASHED_PASSWORD = "hashed_password";
const MOCK_FIRST_NAME = "John";
const MOCK_LAST_NAME = "Doe";
const MOCK_ROLE = "CUSTOMER";
const MOCK_JWT_TOKEN = "mocked.jwt.token";
// 🔧 Buat mock function sekali untuk sinkronisasi
const mockUserFindFirst = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockPointCreate = jest.fn();
const mockCouponCreate = jest.fn();
// 🔧 Prisma mock sinkron di luar dan dalam transaksi
const mockPrisma = {
    $transaction: jest.fn((cb) => __awaiter(void 0, void 0, void 0, function* () {
        return cb({
            user: {
                findFirst: mockUserFindFirst,
                findUnique: mockUserFindUnique,
                create: mockUserCreate,
            },
            point: { create: mockPointCreate },
            coupon: { create: mockCouponCreate },
        });
    })),
    user: {
        findFirst: mockUserFindFirst,
        findUnique: mockUserFindUnique,
        create: mockUserCreate,
    },
    point: { create: mockPointCreate },
    coupon: { create: mockCouponCreate },
};
// ⛔️ Harus sebelum import auth.service
jest.mock("../lib/prisma", () => ({
    __esModule: true,
    default: mockPrisma,
}));
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
const auth_service_1 = require("../services/auth.service");
describe("Auth Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.SECRET_KEY = "test-secret";
        jest.spyOn(Math, "random").mockReturnValue(0.123456); // untuk referralCode konsisten
    });
    describe("RegisterService", () => {
        it("should register a new user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserFindFirst.mockResolvedValue(null); // email belum ada
            bcrypt_1.default.hash.mockResolvedValue(MOCK_HASHED_PASSWORD);
            mockUserCreate.mockResolvedValue({
                id: 1,
                email: MOCK_EMAIL,
                first_name: MOCK_FIRST_NAME,
                last_name: MOCK_LAST_NAME,
                role: MOCK_ROLE,
                isVerified: false,
                referralCode: "REF-1A2B3C4D",
            });
            const user = yield (0, auth_service_1.RegisterService)({
                email: MOCK_EMAIL,
                password: MOCK_PASSWORD,
                first_name: MOCK_FIRST_NAME,
                last_name: MOCK_LAST_NAME,
                role: MOCK_ROLE,
                referralCode: undefined,
            });
            expect(user).toBeDefined();
            expect(user.email).toBe(MOCK_EMAIL);
            expect(mockUserCreate).toHaveBeenCalled();
        }));
        it("should throw error if email already registered", () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserFindFirst.mockResolvedValue({ id: 1 });
            yield expect((0, auth_service_1.RegisterService)({
                email: MOCK_EMAIL,
                password: MOCK_PASSWORD,
                first_name: MOCK_FIRST_NAME,
                last_name: MOCK_LAST_NAME,
                role: MOCK_ROLE,
                referralCode: undefined,
            })).rejects.toThrow("Email already registered");
        }));
    });
    describe("LoginService", () => {
        beforeEach(() => {
            jsonwebtoken_1.default.sign.mockReturnValue(MOCK_JWT_TOKEN);
        });
        it("should login with valid credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserFindFirst.mockResolvedValue({
                id: 1,
                email: MOCK_EMAIL,
                first_name: MOCK_FIRST_NAME,
                last_name: MOCK_LAST_NAME,
                password: MOCK_HASHED_PASSWORD,
                role: MOCK_ROLE,
                isVerified: true,
            });
            bcrypt_1.default.compare.mockResolvedValue(true);
            const result = yield (0, auth_service_1.LoginService)({
                email: MOCK_EMAIL,
                password: MOCK_PASSWORD,
            });
            expect(result.token).toBe(MOCK_JWT_TOKEN);
            expect(result.user.email).toBe(MOCK_EMAIL);
        }));
        it("should throw error if email not found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserFindFirst.mockResolvedValue(null);
            yield expect((0, auth_service_1.LoginService)({ email: "notfound@example.com", password: "abc" })).rejects.toThrow("Email not registered");
        }));
        it("should throw error if password incorrect", () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserFindFirst.mockResolvedValue({
                id: 1,
                email: MOCK_EMAIL,
                password: MOCK_HASHED_PASSWORD,
                first_name: MOCK_FIRST_NAME,
                last_name: MOCK_LAST_NAME,
                role: MOCK_ROLE,
                isVerified: true,
            });
            bcrypt_1.default.compare.mockResolvedValue(false);
            yield expect((0, auth_service_1.LoginService)({ email: MOCK_EMAIL, password: "wrongpass" })).rejects.toThrow("Incorrect password");
        }));
    });
});
