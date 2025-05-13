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
const prisma_1 = __importDefault(require("../lib/prisma"));
const transaction_service_1 = require("../services/transaction.service");
const client_1 = require("@prisma/client");
require("../setup");
const mockData_1 = require("./mockData");
describe("💳 Transaction Service", () => {
    let userId;
    let eventId;
    let ticketId;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield prisma_1.default.user.create({
            data: Object.assign(Object.assign({}, mockData_1.mockUser), { userPoints: 20000 }),
        });
        userId = user.id;
        const event = yield prisma_1.default.event.create({
            data: Object.assign(Object.assign({}, mockData_1.mockEvent), { organizerId: userId }),
        });
        eventId = event.id;
        const ticket = yield prisma_1.default.ticket.create({
            data: {
                eventId,
                type: "VIP",
                price: 50000,
                quantity: 10,
            },
        });
        ticketId = ticket.id;
    }));
    it("✅ should create transaction with valid ticket & no discount", () => __awaiter(void 0, void 0, void 0, function* () {
        const tx = yield (0, transaction_service_1.createTransaction)(userId, eventId, 2, undefined, 0, ticketId);
        expect(tx).toHaveProperty("totalPrice", 100000);
        expect(tx.status).toBe(client_1.TransactionStatus.WAITING_FOR_PAYMENT);
    }));
    it("❌ should fail if not enough available seats", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect((0, transaction_service_1.createTransaction)(userId, eventId, 1000, undefined, 0, ticketId)).rejects.toThrow("Not enough available seats");
    }));
    it("✅ should apply voucher discount", () => __awaiter(void 0, void 0, void 0, function* () {
        const voucher = yield prisma_1.default.promotion.create({
            data: {
                code: "DISKON50K",
                eventId,
                discount: 50000,
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 86400000),
                uses: 0,
            },
        });
        const tx = yield (0, transaction_service_1.createTransaction)(userId, eventId, 2, voucher.code, 0, ticketId);
        expect(tx.totalPrice).toBe(50000); // 100k - 50k
    }));
    it("❌ should fail with expired voucher", () => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.default.promotion.create({
            data: {
                code: "EXPIRED",
                eventId,
                discount: 30000,
                startDate: new Date("2022-01-01"),
                endDate: new Date("2022-01-02"),
                uses: 0,
            },
        });
        yield expect((0, transaction_service_1.createTransaction)(userId, eventId, 1, "EXPIRED", 0, ticketId)).rejects.toThrow("Invalid or expired voucher");
    }));
    it("✅ should apply points discount", () => __awaiter(void 0, void 0, void 0, function* () {
        const tx = yield (0, transaction_service_1.createTransaction)(userId, eventId, 2, undefined, 100000, ticketId);
        expect(tx.totalPrice).toBe(0);
    }));
    it("❌ should fail if not enough points", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect((0, transaction_service_1.createTransaction)(userId, eventId, 2, undefined, 999999, ticketId)).rejects.toThrow("Not enough points");
    }));
});
