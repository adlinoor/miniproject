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
exports.getOrganizerStats = exports.createPromotion = exports.getEventById = exports.getEvents = exports.createEvent = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createEvent = (title, description, startDate, endDate, location, category, price, availableSeats, organizerId, ticketTypes) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const event = yield tx.event.create({
            data: {
                title,
                description,
                startDate,
                endDate,
                location,
                category,
                price,
                availableSeats,
                organizerId,
            },
        });
        if (ticketTypes && ticketTypes.length > 0) {
            yield tx.ticket.createMany({
                data: ticketTypes.map((ticket) => ({
                    eventId: event.id,
                    type: ticket.type,
                    price: ticket.price,
                    quantity: ticket.quantity,
                })),
            });
        }
        return event;
    }));
});
exports.createEvent = createEvent;
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
const createPromotion = (eventId, code, discount, startDate, endDate, maxUses) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.promotion.create({
        data: {
            eventId,
            code,
            discount,
            startDate,
            endDate,
            maxUses,
        },
    });
});
exports.createPromotion = createPromotion;
const getOrganizerStats = (organizerId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$queryRaw `
    SELECT 
      DATE_TRUNC('month', created_at) AS month,
      COUNT(*) AS event_count,
      SUM(available_seats) AS total_seats
    FROM events
    WHERE organizer_id = ${organizerId}
    GROUP BY month
  `;
});
exports.getOrganizerStats = getOrganizerStats;
