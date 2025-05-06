import {
  createTransaction,
  getTransaction,
  updateTransactionStatus,
} from "../services/transaction.service";
import { prismaMock } from "./setup";
import { Prisma, TransactionStatus } from "@prisma/client";
import { mockEvent, mockUser } from "./helpers";

type TransactionWithDetails = Prisma.TransactionGetPayload<{
  include: {
    event: true;
    user: { select: { email: true; first_name: true; last_name: true } };
    details: { include: { ticket: true } };
  };
}>;

describe("Transaction Service", () => {
  const mockDate = new Date();
  const mockTransaction = {
    id: 1,
    eventId: mockEvent.id,
    userId: mockUser.id,
    quantity: 2,
    totalPrice: mockEvent.price * 2,
    status: "waiting_for_payment" as TransactionStatus,
    expiresAt: new Date(mockDate.getTime() + 2 * 60 * 60 * 1000),
    paymentProof: null,
    voucherCode: null,
    pointsUsed: 0,
    createdAt: mockDate,
    updatedAt: mockDate,
    event: mockEvent,
    user: {
      id: mockUser.id,
      email: mockUser.email,
      first_name: mockUser.first_name,
      last_name: mockUser.last_name,
    },
    details: [],
    nextSteps: "Please complete payment within 2 hours",
    paymentWindow: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
  });

  describe("createTransaction", () => {
    it("should create a transaction successfully", async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...mockEvent,
        availableSeats: 10,
      });

      prismaMock.transaction.create.mockResolvedValue(mockTransaction);
      prismaMock.event.update.mockResolvedValue({
        ...mockEvent,
        availableSeats: 8,
      });

      (prismaMock.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return callback(prismaMock);
        }
      );

      const result = await createTransaction(mockUser.id, mockEvent.id, 2);

      expect(result).toEqual(mockTransaction);
      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
        data: { availableSeats: { decrement: 2 } }, // Changed to match actual implementation
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
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
        },
        details: [],
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
        status: "done" as TransactionStatus,
        paymentProof: "proof.jpg",
      };

      prismaMock.transaction.findUnique.mockResolvedValue(mockTransaction);
      prismaMock.transaction.update.mockResolvedValue(updatedTransaction);

      const result = await updateTransactionStatus(
        mockTransaction.id,
        "done",
        "proof.jpg"
      );

      expect(result).toEqual(updatedTransaction);
      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        data: {
          status: "done",
          paymentProof: "proof.jpg",
        },
      });
    });

    it("should throw error if transaction not found", async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);

      await expect(updateTransactionStatus(999, "done")).rejects.toThrow(
        "Transaction not found"
      );
    });
  });
});
