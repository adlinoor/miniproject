import prisma from "../lib/prisma";
import { createTransaction } from "../services/transaction.service";
import { Role, TransactionStatus } from "@prisma/client";
import "../setup";
import { mockEvent, mockUser } from "./mockData";

describe("💳 Transaction Service", () => {
  let userId: number;
  let eventId: number;
  let ticketId: number;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { ...mockUser, userPoints: 20000 },
    });
    userId = user.id;

    const event = await prisma.event.create({
      data: { ...mockEvent, organizerId: userId },
    });
    eventId = event.id;

    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        type: "VIP",
        price: 50000,
        quantity: 10,
      },
    });
    ticketId = ticket.id;
  });

  it("✅ should create transaction with valid ticket & no discount", async () => {
    const tx = await createTransaction(
      userId,
      eventId,
      2,
      undefined,
      0,
      ticketId
    );

    expect(tx).toHaveProperty("totalPrice", 100000);
    expect(tx.status).toBe(TransactionStatus.WAITING_FOR_PAYMENT);
  });

  it("❌ should fail if not enough available seats", async () => {
    await expect(
      createTransaction(userId, eventId, 1000, undefined, 0, ticketId)
    ).rejects.toThrow("Not enough available seats");
  });

  it("✅ should apply voucher discount", async () => {
    const voucher = await prisma.promotion.create({
      data: {
        code: "DISKON50K",
        eventId,
        discount: 50000,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 86400000),
        uses: 0,
      },
    });

    const tx = await createTransaction(
      userId,
      eventId,
      2,
      voucher.code,
      0,
      ticketId
    );
    expect(tx.totalPrice).toBe(50000); // 100k - 50k
  });

  it("❌ should fail with expired voucher", async () => {
    await prisma.promotion.create({
      data: {
        code: "EXPIRED",
        eventId,
        discount: 30000,
        startDate: new Date("2022-01-01"),
        endDate: new Date("2022-01-02"),
        uses: 0,
      },
    });

    await expect(
      createTransaction(userId, eventId, 1, "EXPIRED", 0, ticketId)
    ).rejects.toThrow("Invalid or expired voucher");
  });

  it("✅ should apply points discount", async () => {
    const tx = await createTransaction(
      userId,
      eventId,
      2,
      undefined,
      100000,
      ticketId
    );
    expect(tx.totalPrice).toBe(0);
  });

  it("❌ should fail if not enough points", async () => {
    await expect(
      createTransaction(userId, eventId, 2, undefined, 999999, ticketId)
    ).rejects.toThrow("Not enough points");
  });
});
