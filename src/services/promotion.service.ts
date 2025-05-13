import { CreateVoucherInput } from "../interfaces/event.interface";
import prisma from "../lib/prisma";
import { Promotion } from "@prisma/client";

export const createPromotion = async (
  eventId: number,
  organizerId: number,
  code: string,
  discount: number,
  startDate: Date,
  endDate: Date,
  maxUses?: number
): Promise<Promotion> => {
  return await prisma.$transaction(async (tx) => {
    // Verify the event belongs to the organizer
    const event = await tx.event.findFirst({
      where: { id: eventId, organizerId },
    });

    if (!event) {
      throw new Error("Event not found or you are not the organizer");
    }

    // Create the promotion
    const promotion = await tx.promotion.create({
      data: {
        eventId: Number(eventId),
        code,
        discount,
        startDate,
        endDate,
        maxUses,
      },
    });

    return promotion;
  });
};

export const validatePromotion = async (
  code: string,
  eventId: number,
  userId: number
): Promise<{ valid: boolean; discount?: number; message?: string }> => {
  const promotion = await prisma.promotion.findUnique({
    where: { code },
  });

  if (!promotion) {
    return { valid: false, message: "Promotion code not found" };
  }

  if (promotion.eventId !== eventId) {
    return {
      valid: false,
      message: "This promotion is not valid for this event",
    };
  }

  const now = new Date();
  if (now < promotion.startDate) {
    return { valid: false, message: "Promotion has not started yet" };
  }

  if (now > promotion.endDate) {
    return { valid: false, message: "Promotion has expired" };
  }

  if (promotion.maxUses && promotion.uses >= promotion.maxUses) {
    return { valid: false, message: "Promotion has reached its usage limit" };
  }

  return { valid: true, discount: promotion.discount };
};

export const createVoucher = async (data: CreateVoucherInput) => {
  const { code, discount, startDate, endDate, eventId } = data;

  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) },
  });
  if (!event) throw new Error("Event not found");

  return prisma.promotion.create({
    data: {
      code,
      discount,
      startDate,
      endDate,
      eventId: Number(eventId),
    },
  });
};

export const getVouchersByEvent = async (eventId: string) => {
  return prisma.promotion.findMany({ where: { eventId: Number(eventId) } });
};
