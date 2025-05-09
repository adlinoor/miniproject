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
const prisma_1 = __importDefault(require("../lib/prisma"));
const mockData_1 = require("./mockData");
// Mock dependencies
jest.mock("../lib/prisma", () => ({
    $transaction: jest.fn((callback) => __awaiter(void 0, void 0, void 0, function* () {
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
    })),
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
        it("should successfully apply referral code and create rewards", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock transaction behavior
            prisma_1.default.$transaction.mockImplementationOnce((callback) => __awaiter(void 0, void 0, void 0, function* () {
                const mockTx = {
                    user: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValueOnce(mockData_1.MOCK_NEW_USER) // First call for user
                            .mockResolvedValueOnce(mockData_1.MOCK_REFERRER), // Second call for referrer
                        update: jest.fn().mockResolvedValue(Object.assign(Object.assign({}, mockData_1.MOCK_NEW_USER), { referredBy: mockData_1.MOCK_REFERRAL_CODE })),
                    },
                    point: {
                        create: jest.fn().mockResolvedValue(mockData_1.MOCK_POINTS),
                    },
                    coupon: {
                        create: jest.fn().mockResolvedValue(mockData_1.MOCK_COUPON),
                    },
                };
                return callback(mockTx);
            }));
            const result = yield (0, user_service_1.applyReferral)(mockData_1.MOCK_USER_ID, mockData_1.MOCK_REFERRAL_CODE);
            expect(result).toEqual(mockData_1.MOCK_COUPON);
            expect(prisma_1.default.$transaction).toHaveBeenCalledTimes(1);
        }));
        it("should throw error if user already used a referral", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.$transaction.mockImplementationOnce((callback) => __awaiter(void 0, void 0, void 0, function* () {
                const mockTx = {
                    user: {
                        findUnique: jest.fn().mockResolvedValueOnce(Object.assign(Object.assign({}, mockData_1.MOCK_NEW_USER), { referredBy: "EXISTING123" })),
                    },
                };
                return callback(mockTx);
            }));
            yield expect((0, user_service_1.applyReferral)(mockData_1.MOCK_USER_ID, mockData_1.MOCK_REFERRAL_CODE)).rejects.toThrow("You already used a referral code");
        }));
        it("should throw error for invalid referral code", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.$transaction.mockImplementationOnce((callback) => __awaiter(void 0, void 0, void 0, function* () {
                const mockTx = {
                    user: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValueOnce(mockData_1.MOCK_NEW_USER) // First call for user
                            .mockResolvedValueOnce(null), // Second call for referrer (not found)
                    },
                };
                return callback(mockTx);
            }));
            yield expect((0, user_service_1.applyReferral)(mockData_1.MOCK_USER_ID, "INVALID123")).rejects.toThrow("Invalid referral code");
        }));
        it("should throw error when using own referral code", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.$transaction.mockImplementationOnce((callback) => __awaiter(void 0, void 0, void 0, function* () {
                const mockTx = {
                    user: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValueOnce(mockData_1.MOCK_NEW_USER) // First call for user
                            .mockResolvedValueOnce(Object.assign(Object.assign({}, mockData_1.MOCK_REFERRER), { id: mockData_1.MOCK_USER_ID })),
                    },
                };
                return callback(mockTx);
            }));
            yield expect((0, user_service_1.applyReferral)(mockData_1.MOCK_USER_ID, mockData_1.MOCK_REFERRAL_CODE)).rejects.toThrow("Cannot use your own referral code");
        }));
        it("should throw error if user not found", () => __awaiter(void 0, void 0, void 0, function* () {
            prisma_1.default.$transaction.mockImplementationOnce((callback) => __awaiter(void 0, void 0, void 0, function* () {
                const mockTx = {
                    user: {
                        findUnique: jest.fn().mockResolvedValueOnce(null), // User not found
                    },
                };
                return callback(mockTx);
            }));
            yield expect((0, user_service_1.applyReferral)(999, mockData_1.MOCK_REFERRAL_CODE)).rejects.toThrow("User not found");
        }));
    });
});
