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
exports.getOrganizerRatings = exports.getEventReviews = exports.createReview = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createReview = (userId, eventId, rating, comment) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield prisma_1.default.event.findUnique({
        where: { id: eventId },
        select: { endDate: true, organizerId: true },
    });
    if (!event)
        throw new Error("Event not found");
    if (new Date() < event.endDate)
        throw new Error("Event has not ended");
    const hasAttended = yield prisma_1.default.transaction.findFirst({
        where: {
            userId,
            eventId,
            status: "DONE", // pastikan status transaksi selesai
        },
    });
    if (!hasAttended)
        throw new Error("You have not attended this event");
    return prisma_1.default.review.create({
        data: {
            userId,
            eventId,
            rating,
            comment,
        },
    });
});
exports.createReview = createReview;
const getEventReviews = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.review.findMany({
        where: { eventId },
        include: {
            user: { select: { first_name: true, last_name: true } },
        },
    });
});
exports.getEventReviews = getEventReviews;
const getOrganizerRatings = (organizerId) => __awaiter(void 0, void 0, void 0, function* () {
    const events = yield prisma_1.default.event.findMany({
        where: { organizerId },
        select: { id: true },
    });
    const eventIds = events.map((e) => e.id);
    return prisma_1.default.review.findMany({
        where: { eventId: { in: eventIds } },
        include: {
            event: { select: { title: true } },
            user: { select: { first_name: true, last_name: true } },
        },
    });
});
exports.getOrganizerRatings = getOrganizerRatings;
