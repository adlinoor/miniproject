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
exports.getEventReviews = exports.createReview = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
// Buat ulasan baru
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { eventId, rating, comment } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Validasi login
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }
        // Validasi input
        if (!eventId || rating == null) {
            return res
                .status(400)
                .json({ message: "Event ID and rating are required" });
        }
        if (rating < 1 || rating > 5) {
            return res
                .status(400)
                .json({ message: "Rating must be between 1 and 5" });
        }
        // Cek apakah user pernah ikut event dan status transaksi selesai
        const hasAttended = yield prisma_1.default.transaction.findFirst({
            where: {
                userId,
                eventId: Number(eventId),
                status: client_1.TransactionStatus.DONE,
                event: {
                    endDate: { lt: new Date() }, // Event sudah berakhir
                },
            },
            select: { id: true },
        });
        if (!hasAttended) {
            return res.status(403).json({
                message: "Kamu hanya bisa memberi ulasan setelah mengikuti dan menyelesaikan event.",
            });
        }
        // Cek apakah user sudah review event ini
        const existingReview = yield prisma_1.default.review.findFirst({
            where: {
                userId,
                eventId: Number(eventId),
            },
            select: { id: true },
        });
        if (existingReview) {
            return res
                .status(409)
                .json({ message: "Kamu sudah memberikan ulasan untuk event ini." });
        }
        // Simpan review
        const review = yield prisma_1.default.review.create({
            data: {
                userId,
                eventId: Number(eventId),
                rating: Number(rating),
                comment: comment || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        profilePicture: true,
                    },
                },
                event: {
                    select: { title: true },
                },
            },
        });
        return res.status(201).json({
            message: "Review berhasil dikirim",
            review,
        });
    }
    catch (error) {
        console.error("❌ Error creating review:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.createReview = createReview;
// Ambil semua review untuk 1 event
const getEventReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        if (!eventId) {
            return res.status(400).json({ message: "Event ID is required" });
        }
        const reviews = yield prisma_1.default.review.findMany({
            where: { eventId: Number(eventId) },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        profilePicture: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(reviews);
    }
    catch (error) {
        console.error("❌ Error fetching reviews:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getEventReviews = getEventReviews;
