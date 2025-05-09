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
const transaction_service_1 = require("../services/transaction.service");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
describe("Transaction Service", () => {
    const mockDate = new Date();
    const mockTransaction = {
        id: 1,
        eventId: helpers_1.mockEvent.id,
        userId: helpers_1.mockUser.id,
        quantity: 2,
        totalPrice: helpers_1.mockEvent.price * 2,
        status: "WAITING_FOR_PAYMENT",
        expiresAt: new Date(mockDate.getTime() + 2 * 60 * 60 * 1000),
        paymentProof: null,
        voucherCode: null,
        pointsUsed: 0,
        createdAt: mockDate,
        updatedAt: mockDate,
        event: helpers_1.mockEvent,
        user: {
            id: helpers_1.mockUser.id,
            email: helpers_1.mockUser.email,
            first_name: helpers_1.mockUser.first_name,
            last_name: helpers_1.mockUser.last_name,
        },
        details: [],
        nextSteps: "Please complete payment within 2 hours",
        paymentWindow: 2,
    };
    beforeEach(() => {
        jest.clearAllMocks();
        setup_1.prismaMock.user.findUnique.mockResolvedValue(helpers_1.mockUser);
    });
    describe("createTransaction", () => {
        it("should create a transaction successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.findUnique.mockResolvedValue(Object.assign(Object.assign({}, helpers_1.mockEvent), { availableSeats: 10 }));
            setup_1.prismaMock.transaction.create.mockResolvedValue(mockTransaction);
            setup_1.prismaMock.event.update.mockResolvedValue(Object.assign(Object.assign({}, helpers_1.mockEvent), { availableSeats: 8 }));
            setup_1.prismaMock.$transaction.mockImplementation((callback) => __awaiter(void 0, void 0, void 0, function* () {
                return callback(setup_1.prismaMock);
            }));
            const result = yield (0, transaction_service_1.createTransaction)(helpers_1.mockUser.id, helpers_1.mockEvent.id, 2);
            expect(result).toEqual(mockTransaction);
            expect(setup_1.prismaMock.event.update).toHaveBeenCalledWith({
                where: { id: helpers_1.mockEvent.id },
                data: { availableSeats: { decrement: 2 } }, // Changed to match actual implementation
            });
        }));
        it("should throw error if event not found", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.findUnique.mockResolvedValue(null);
            setup_1.prismaMock.$transaction.mockImplementation((callback) => callback(setup_1.prismaMock));
            yield expect((0, transaction_service_1.createTransaction)(helpers_1.mockUser.id, 999, 2)).rejects.toThrow("Event not found");
            expect(setup_1.prismaMock.event.update).not.toHaveBeenCalled();
        }));
        it("should throw error if not enough seats", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.findUnique.mockResolvedValue(Object.assign(Object.assign({}, helpers_1.mockEvent), { availableSeats: 1 }));
            setup_1.prismaMock.$transaction.mockImplementation((callback) => callback(setup_1.prismaMock));
            yield expect((0, transaction_service_1.createTransaction)(helpers_1.mockUser.id, helpers_1.mockEvent.id, 2)).rejects.toThrow("Not enough available seats for this event");
            expect(setup_1.prismaMock.event.update).not.toHaveBeenCalled();
        }));
    });
    describe("getTransaction", () => {
        it("should return transaction with event and user details", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransactionWithDetails = Object.assign(Object.assign({}, mockTransaction), { event: helpers_1.mockEvent, user: {
                    id: helpers_1.mockUser.id,
                    email: helpers_1.mockUser.email,
                    first_name: helpers_1.mockUser.first_name,
                    last_name: helpers_1.mockUser.last_name,
                }, details: [] });
            setup_1.prismaMock.transaction.findUnique.mockResolvedValue(mockTransactionWithDetails);
            const result = yield (0, transaction_service_1.getTransaction)(mockTransaction.id);
            expect(result).toEqual(mockTransactionWithDetails);
            expect(setup_1.prismaMock.transaction.findUnique).toHaveBeenCalledWith({
                where: { id: mockTransaction.id },
                include: {
                    event: true,
                    user: {
                        select: {
                            email: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                    details: {
                        include: {
                            ticket: true,
                        },
                    },
                },
            });
        }));
        it("should throw error if transaction not found", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.transaction.findUnique.mockResolvedValue(null);
            yield expect((0, transaction_service_1.getTransaction)(999)).rejects.toThrow("Transaction not found");
        }));
    });
    describe("updateTransactionStatus", () => {
        it("should update transaction status successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const updatedTransaction = Object.assign(Object.assign({}, mockTransaction), { status: "DONE", paymentProof: "proof.jpg" });
            setup_1.prismaMock.transaction.findUnique.mockResolvedValue(mockTransaction);
            setup_1.prismaMock.transaction.update.mockResolvedValue(updatedTransaction);
            const result = yield (0, transaction_service_1.updateTransactionStatus)(mockTransaction.id, "DONE", "proof.jpg");
            expect(result).toEqual(updatedTransaction);
            expect(setup_1.prismaMock.transaction.update).toHaveBeenCalledWith({
                where: { id: mockTransaction.id },
                data: {
                    status: "DONE",
                    paymentProof: "proof.jpg",
                },
            });
        }));
        it("should throw error if transaction not found", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.transaction.findUnique.mockResolvedValue(null);
            yield expect((0, transaction_service_1.updateTransactionStatus)(999, "DONE")).rejects.toThrow("Transaction not found");
        }));
    });
});
