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
const user_service_1 = require("../services/user.service");
const mockData_1 = require("./mockData");
const setup_1 = require("./setup"); // Mock prisma untuk test
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
        jsonwebtoken_1.default.verify.mockImplementation(() => ({
            id: mockData_1.mockUser.id,
            role: mockData_1.mockUser.role,
            email: mockData_1.mockUser.email,
            first_name: mockData_1.mockUser.first_name,
            last_name: mockData_1.mockUser.last_name,
        }));
    });
    // Test untuk getUserById
    describe("getUserById", () => {
        it("should fetch user by id", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.user.findUnique.mockResolvedValue(mockData_1.mockUser); // Mock response untuk user
            const result = yield (0, user_service_1.getUserById)(mockData_1.mockUser.id);
            expect(result).toBeDefined();
            expect(result === null || result === void 0 ? void 0 : result.email).toBe(mockData_1.mockUser.email);
            expect(setup_1.prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockData_1.mockUser.id },
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
        }));
        it("should return null if user not found", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.user.findUnique.mockResolvedValue(null); // User not found
            const result = yield (0, user_service_1.getUserById)(999);
            expect(result).toBeNull();
        }));
    });
    // Test untuk updateUser
    describe("updateUser", () => {
        it("should update user profile", () => __awaiter(void 0, void 0, void 0, function* () {
            const updatedData = {
                first_name: "John",
                last_name: "Doe",
            };
            setup_1.prismaMock.user.update.mockResolvedValue(Object.assign(Object.assign({}, mockData_1.mockUser), updatedData));
            const result = yield (0, user_service_1.updateUser)(mockData_1.mockUser.id, updatedData);
            expect(result).toBeDefined();
            expect(result.first_name).toBe(updatedData.first_name);
            expect(result.last_name).toBe(updatedData.last_name);
            expect(setup_1.prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: mockData_1.mockUser.id },
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
        }));
    });
    // Test untuk getUserRewardSummary
    describe("getUserRewardSummary", () => {
        it("should return active points and coupons", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.point.findMany.mockResolvedValue(mockData_1.mockPoints);
            setup_1.prismaMock.coupon.findMany.mockResolvedValue(mockData_1.mockCoupons);
            const result = yield (0, user_service_1.getUserRewardSummary)(mockData_1.mockUser.id);
            expect(result.totalActivePoints).toBe(300); // Total points
            expect(result.coupons.active.length).toBe(1); // Active coupon
            expect(result.coupons.used.length).toBe(1); // Used coupon
            expect(result.coupons.expired.length).toBe(0); // No expired coupon
        }));
        it("should return 0 points if no active points", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.point.findMany.mockResolvedValue([]);
            setup_1.prismaMock.coupon.findMany.mockResolvedValue([]);
            const result = yield (0, user_service_1.getUserRewardSummary)(mockData_1.mockUser.id);
            expect(result.totalActivePoints).toBe(0);
            expect(result.coupons.active.length).toBe(0);
            expect(result.coupons.used.length).toBe(0);
            expect(result.coupons.expired.length).toBe(0);
        }));
    });
});
