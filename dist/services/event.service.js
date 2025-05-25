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
exports.getVouchersByEvent = exports.getAttendeesByEvent = exports.getEventsByOrganizer = exports.getEventById = exports.getEvents = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Ambil daftar event berdasarkan filter ringan (jika dibutuhkan).
 */
const getEvents = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    const { category, location, search, upcomingOnly } = filters;
    const now = new Date();
    return yield prisma_1.default.event.findMany({
        where: {
            AND: [
                category ? { category } : {},
                location ? { location } : {},
                search
                    ? {
                        OR: [
                            { title: { contains: search, mode: "insensitive" } },
                            { description: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {},
                upcomingOnly ? { startDate: { gt: now } } : {},
            ],
        },
        include: {
            organizer: {
                select: {
                    first_name: true,
                    last_name: true,
                    profilePicture: true,
                },
            },
            promotions: {
                where: {
                    startDate: { lte: now },
                    endDate: { gte: now },
                },
            },
        },
    });
});
exports.getEvents = getEvents;
/**
 * Ambil detail satu event by ID lengkap dengan tiket, promo, dan review.
 */
const getEventById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.event.findUnique({
        where: { id },
        include: {
            organizer: true,
            tickets: true,
            promotions: true,
            reviews: {
                include: {
                    user: {
                        select: {
                            first_name: true,
                            last_name: true,
                            profilePicture: true,
                        },
                    },
                },
            },
        },
    });
});
exports.getEventById = getEventById;
/**
 * Ambil semua event milik organizer tertentu.
 */
const getEventsByOrganizer = (organizerId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.event.findMany({
        where: { organizerId },
        orderBy: { createdAt: "desc" },
    });
});
exports.getEventsByOrganizer = getEventsByOrganizer;
/**
 * Ambil peserta dari event tertentu (untuk dashboard organizer).
 */
const getAttendeesByEvent = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.transaction.findMany({
        where: {
            eventId,
            status: { in: ["DONE", "WAITING_FOR_ADMIN_CONFIRMATION"] },
        },
        include: {
            user: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                },
            },
            details: {
                include: { ticket: true },
            },
        },
    });
});
exports.getAttendeesByEvent = getAttendeesByEvent;
/**
 * Ambil semua voucher milik suatu event.
 */
const getVouchersByEvent = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.promotion.findMany({
        where: { eventId: parseInt(eventId) },
    });
});
exports.getVouchersByEvent = getVouchersByEvent;
