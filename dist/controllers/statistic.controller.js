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
exports.getEventStatistics = void 0;
const prisma_1 = require("../lib/prisma");
const getEventStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizerId = req.user.id;
        const { eventId } = req.params;
        const filter = {
            event: {
                organizerId,
            },
        };
        if (eventId) {
            filter.eventId = parseInt(eventId, 10);
        }
        const transactions = yield prisma_1.prisma.transaction.findMany({
            where: Object.assign(Object.assign({}, filter), { status: "DONE" }),
            select: {
                createdAt: true,
                totalPrice: true,
                quantity: true,
            },
        });
        // 🧠 Group data by date
        const dailyStats = {};
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
    }
    catch (error) {
        console.error("Error generating statistics:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getEventStatistics = getEventStatistics;
