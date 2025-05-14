import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getEventStatistics = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user?.id;
    const { eventId } = req.params;

    const filter: any = {
      event: {
        organizerId,
      },
    };

    if (eventId) {
      filter.eventId = parseInt(eventId, 10);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        ...filter,
        status: "DONE",
      },
      select: {
        createdAt: true,
        totalPrice: true,
        quantity: true,
      },
    });

    // 🧠 Group data by date
    const dailyStats: Record<
      string,
      { total: number; count: number; quantity: number }
    > = {};

    for (const tx of transactions) {
      const dateKey = tx.createdAt.toISOString().split("T")[0]; // format YYYY-MM-DD

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { total: 0, count: 0, quantity: 0 };
      }

      dailyStats[dateKey].total += tx.totalPrice;
      dailyStats[dateKey].count += 1;
      dailyStats[dateKey].quantity += tx.quantity;
    }

    const result = Object.entries(dailyStats).map(([date, data]) => ({
      date,
      totalIncome: data.total,
      totalTransactions: data.count,
      totalTickets: data.quantity,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error generating statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};
