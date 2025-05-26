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
const vitest_1 = require("vitest");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_service_1 = require("../services/auth.service");
(0, vitest_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.transactionDetail.deleteMany({});
    yield prisma_1.default.transaction.deleteMany({});
    yield prisma_1.default.point.deleteMany({});
    yield prisma_1.default.coupon.deleteMany({});
    yield prisma_1.default.review.deleteMany({});
    yield prisma_1.default.event.deleteMany({});
    yield prisma_1.default.user.deleteMany({});
}));
(0, vitest_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.transactionDetail.deleteMany({});
    yield prisma_1.default.transaction.deleteMany({});
    yield prisma_1.default.point.deleteMany({});
    yield prisma_1.default.coupon.deleteMany({});
    yield prisma_1.default.review.deleteMany({});
    yield prisma_1.default.event.deleteMany({});
    yield prisma_1.default.user.deleteMany({});
    yield prisma_1.default.$disconnect();
}));
(0, vitest_1.describe)("Referral Registration", () => {
    (0, vitest_1.it)("should register user without referral and userPoints=0", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_service_1.RegisterService)({
            email: "user1@example.com",
            password: "password",
            first_name: "First",
            last_name: "User",
            role: "CUSTOMER",
        });
        (0, vitest_1.expect)(user).not.toBeNull();
        (0, vitest_1.expect)(user.userPoints).toBe(0);
    }));
    (0, vitest_1.it)("should register user with valid referral code and both get points", () => __awaiter(void 0, void 0, void 0, function* () {
        const referrer = yield (0, auth_service_1.RegisterService)({
            email: "referrer@example.com",
            password: "password",
            first_name: "Ref",
            last_name: "User",
            role: "CUSTOMER",
        });
        (0, vitest_1.expect)(referrer).not.toBeNull();
        // Register new user with referral code
        const newUser = yield (0, auth_service_1.RegisterService)({
            email: "user2@example.com",
            password: "password",
            first_name: "Second",
            last_name: "User",
            role: "CUSTOMER",
            referralCode: referrer.referralCode || undefined,
        });
        (0, vitest_1.expect)(newUser).not.toBeNull();
        (0, vitest_1.expect)(newUser.userPoints).toBe(10000);
        const updatedReferrer = yield prisma_1.default.user.findUnique({
            where: { id: referrer.id },
        });
        (0, vitest_1.expect)(updatedReferrer).not.toBeNull();
        (0, vitest_1.expect)(updatedReferrer.userPoints).toBe(10000);
    }));
    (0, vitest_1.it)("should throw error for invalid referral code", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, vitest_1.expect)((0, auth_service_1.RegisterService)({
            email: "user3@example.com",
            password: "password",
            first_name: "Third",
            last_name: "User",
            role: "CUSTOMER",
            referralCode: "INVALIDCODE",
        })).rejects.toThrow("Invalid referral code");
    }));
    (0, vitest_1.it)("should not allow duplicate email registration", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, auth_service_1.RegisterService)({
            email: "user4@example.com",
            password: "password",
            first_name: "Fourth",
            last_name: "User",
            role: "CUSTOMER",
        });
        yield (0, vitest_1.expect)((0, auth_service_1.RegisterService)({
            email: "user4@example.com",
            password: "password",
            first_name: "Fourth",
            last_name: "User",
            role: "CUSTOMER",
        })).rejects.toThrow("Email already registered");
    }));
});
