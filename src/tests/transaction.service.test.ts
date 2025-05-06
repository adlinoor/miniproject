import {
  createTransaction,
  getTransaction,
  updateTransactionStatus,
} from "../services/transaction.service";
import { prismaMock } from "./setup";
import { TransactionStatus } from "@prisma/client";
import { mockEvent, mockUser } from "./helpers";

describe("Transaction Service", () => {
  const mockDate = new Date();

  const mockTransaction = {
    id: 1,
    eventId: mockEvent.id,
    userId: mockUser.id,
    quantity: 2,
    totalPrice: mockEvent.price * 2,
    status: "waiting_for_payment" as TransactionStatus,
    expiresAt: new Date(mockDate.getTime() + 24 * 60 * 60 * 1000),
    paymentProof: null,
    voucherCode: null,
    pointsUsed: 0,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTransaction", () => {
    it("should create a transaction successfully", async () => {
      // Mock event find
      prismaMock.event.findUnique.mockResolvedValue({
        ...mockEvent,
        availableSeats: 10,
      });

      // Mock transaction create
      prismaMock.transaction.create.mockResolvedValue(mockTransaction);

      // Mock event update
      prismaMock.event.update.mockResolvedValue({
        ...mockEvent,
        availableSeats: 8,
      });

      // Mock transaction
      (prismaMock.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prismaMock)
      );

      const result = await createTransaction(
        mockTransaction.userId,
        mockTransaction.eventId,
        mockTransaction.quantity
      );

      expect(result).toEqual(mockTransaction);
      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
        data: { availableSeats: 8 },
      });
    });

    it("should throw error if event not found", async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);
      (prismaMock.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prismaMock)
      );

      await expect(createTransaction(mockUser.id, 999, 2)).rejects.toThrow(
        "Event not found"
      );
      expect(prismaMock.event.update).not.toHaveBeenCalled();
    });

    it("should throw error if not enough seats", async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...mockEvent,
        availableSeats: 1,
      });
      (prismaMock.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prismaMock)
      );

      await expect(
        createTransaction(mockUser.id, mockEvent.id, 2)
      ).rejects.toThrow("Not enough available seats for this event");
      expect(prismaMock.event.update).not.toHaveBeenCalled();
    });
  });

  describe("getTransaction", () => {
    it("should return transaction with event and user details", async () => {
      const mockTransactionWithDetails = {
        ...mockTransaction,
        event: mockEvent,
        user: {
          id: mockUser.id,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          email: mockUser.email,
        },
      };

      prismaMock.transaction.findUnique.mockResolvedValue(
        mockTransactionWithDetails
      );

      const result = await getTransaction(mockTransaction.id);

      expect(result).toEqual(mockTransactionWithDetails);
      expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        include: {
          event: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });
    });

    it("should throw error if transaction not found", async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);

      await expect(getTransaction(999)).rejects.toThrow(
        "Transaction not found"
      );
    });
  });

  describe("updateTransactionStatus", () => {
    it("should update transaction status successfully", async () => {
      const updatedTransaction = {
        ...mockTransaction,
        status: "paid" as TransactionStatus,
        paymentProof: "proof.jpg",
      };

      prismaMock.transaction.findUnique.mockResolvedValue(mockTransaction);
      prismaMock.transaction.update.mockResolvedValue(updatedTransaction);

      const result = await updateTransactionStatus(
        mockTransaction.id,
        "paid" as TransactionStatus,
        "proof.jpg"
      );

      expect(result).toEqual(updatedTransaction);
      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        data: {
          status: "paid",
          paymentProof: "proof.jpg",
        },
      });
    });

    it("should throw error if transaction not found", async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);

      await expect(
        updateTransactionStatus(999, "paid" as TransactionStatus)
      ).rejects.toThrow("Transaction not found");
    });
  });
});
