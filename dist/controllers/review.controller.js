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
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 1. Validate required fields
        const { eventId, rating, comment } = req.body;
        if (!eventId || !rating) {
            return res.status(400).json({
                message: "Event ID and rating are required",
            });
        }
        // 2. Check authentication and get user ID
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const userId = Number((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        // 3. Validate rating range (1-5)
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5",
            });
        }
        // 4. Check if user attended the event (with proper status)
        const hasAttended = yield prisma_1.default.transaction.findFirst({
            where: {
                userId,
                eventId,
                status: client_1.TransactionStatus.DONE, // Using enum for type safety
                event: {
                    endDate: { lt: new Date() }, // Event must have ended
                },
            },
            select: { id: true }, // Only need to know if exists, no need for full data
        });
        if (!hasAttended) {
            return res.status(403).json({
                message: "You can only review events you have attended after they end",
            });
        }
        // 5. Check for existing review
        const existingReview = yield prisma_1.default.review.findFirst({
            where: {
                userId,
                eventId,
            },
            select: { id: true }, // Only need to know if exists
        });
        if (existingReview) {
            return res.status(409).json({
                message: "You have already reviewed this event",
            });
        }
        // 6. Create the review
        const review = yield prisma_1.default.review.create({
            data: {
                eventId,
                userId,
                rating,
                comment: comment || null, // Make comment optional
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
                    select: {
                        title: true,
                    },
                },
            },
        });
        // 7. Return successful response
        return res.status(201).json({
            message: "Review created successfully",
            review,
        });
    }
    catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.createReview = createReview;
// Additional review controller methods
const getEventReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required",
            });
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
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json(reviews);
    }
    catch (error) {
        console.error("Error fetching reviews:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});
exports.getEventReviews = getEventReviews;
