import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const applyVoucherHandler = async (req: Request, res: Response) => {
  const { code, eventId } = req.body;
  const now = new Date();

  if (!code || !eventId) {
    return res.status(400).json({ message: "Code and eventId are required" });
  }

  const promo = await prisma.promotion.findFirst({
    where: {
      code,
      eventId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  if (!promo) {
    return res.status(404).json({ message: "Voucher not valid or expired" });
  }

  return res.status(200).json({
    discount: promo.discount,
    message: "Voucher applied",
  });
};
