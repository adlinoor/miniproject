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
const bcrypt_1 = __importDefault(require("bcrypt"));
const setup_1 = require("./setup");
const mockData_1 = require("./mockData");
jest.mock("bcrypt");
describe("🔐 Auth Service", () => {
    describe("RegisterService", () => {
        it("should register a new user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            bcrypt_1.default.hash.mockResolvedValue("hashed_password");
            setup_1.prismaMock.user.findUnique
                .mockResolvedValueOnce(null) // cek email
                .mockResolvedValueOnce(mockData_1.mockReferrerUser); // cek referral
            setup_1.prismaMock.user.create.mockResolvedValue(mockData_1.mockUser);
            const result = yield (0, auth_service_1.RegisterService)(mockData_1.mockUserInput);
            expect(result).toHaveProperty("user");
            expect(result.email).toBe(mockData_1.mockUser.email);
        }));
        it("should throw an error if email is already registered", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.user.findUnique.mockResolvedValueOnce(mockData_1.mockUser); // langsung ketemu email terdaftar
            yield expect((0, auth_service_1.RegisterService)(mockData_1.mockUserInput)).rejects.toThrow("Email is already registered");
        }));
    });
    describe("LoginService", () => {
        const loginInput = {
            email: mockData_1.mockUser.email,
            password: "secure123",
        };
        it("should log in successfully with valid credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.user.findUnique.mockResolvedValue(mockData_1.mockUser);
            bcrypt_1.default.compare.mockResolvedValue(true);
            const result = yield (0, auth_service_1.LoginService)(loginInput);
            expect(result).toHaveProperty("token");
            expect(result.user.email).toBe(mockData_1.mockUser.email);
        }));
        it("should throw error if email not found", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.user.findUnique.mockResolvedValue(null);
            yield expect((0, auth_service_1.LoginService)(loginInput)).rejects.toThrow("Email not registered");
        }));
        it("should throw error if password is incorrect", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.user.findUnique.mockResolvedValue(mockData_1.mockUser);
            bcrypt_1.default.compare.mockResolvedValue(false);
            yield expect((0, auth_service_1.LoginService)(loginInput)).rejects.toThrow("Incorrect password");
        }));
    });
});
