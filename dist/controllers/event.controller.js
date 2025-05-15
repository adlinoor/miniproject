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
exports.getEventsByOrganizer = exports.getEventAttendees = exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getEvents = exports.createEvent = exports.updateEventSchema = exports.createEventSchema = void 0;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date",
    }),
    endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date",
    }),
    location: zod_1.z.string().min(1, "Location is required"),
    category: zod_1.z.string().min(1, "Category is required"),
    price: zod_1.z.number().min(0, "Price must be a positive number"),
    availableSeats: zod_1.z.number().min(1, "Available seats must be at least 1"),
});
exports.updateEventSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    startDate: zod_1.z
        .string()
        .optional()
        .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: "Invalid start date",
    }),
    endDate: zod_1.z
        .string()
        .optional()
        .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: "Invalid end date",
    }),
    location: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    price: zod_1.z.number().min(0, "Price must be a positive number").optional(),
    availableSeats: zod_1.z
        .number()
        .min(1, "Available seats must be at least 1")
        .optional(),
});
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, startDate, endDate, location, category, price, availableSeats, ticketTypes, } = req.body;
        const organizerId = req.user.id;
        if (!organizerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const event = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const newEvent = yield tx.event.create({
                data: {
                    title,
                    description,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    location,
                    category,
                    price,
                    availableSeats: Number(availableSeats),
                    organizerId,
                },
            });
            if (ticketTypes && ticketTypes.length > 0) {
                yield tx.ticket.createMany({
                    data: ticketTypes.map((ticket) => (Object.assign({ eventId: newEvent.id }, ticket))),
                });
            }
            return newEvent;
        }));
        res.status(201).json(event);
    }
    catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.createEvent = createEvent;
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, location, search, minPrice, maxPrice, startDate, endDate, sortBy, sortOrder = "asc", page = "1", limit = "10", } = req.query;
        const where = {};
        // 🔍 Search
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        // 🔖 Filter
        if (category)
            where.category = { equals: category };
        if (location)
            where.location = { equals: location };
        // 💰 Price Range
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = parseInt(minPrice, 10);
            if (maxPrice)
                where.price.lte = parseInt(maxPrice, 10);
        }
        // 📆 Date Range
        if (startDate || endDate) {
            where.startDate = {};
            if (startDate)
                where.startDate.gte = new Date(startDate);
            if (endDate)
                where.startDate.lte = new Date(endDate);
        }
        // ↕ Sort
        const orderBy = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder;
        }
        else {
            orderBy.startDate = "asc";
        }
        // 📄 Pagination
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNumber - 1) * pageSize;
        const [events, total] = yield Promise.all([
            prisma_1.prisma.event.findMany({
                where,
                include: {
                    organizer: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                    tickets: true,
                    promotions: {
                        where: {
                            startDate: { lte: new Date() },
                            endDate: { gte: new Date() },
                        },
                    },
                },
                orderBy,
                skip,
                take: pageSize,
            }),
            prisma_1.prisma.event.count({ where }),
        ]);
        // 🛑 Handling No Results
        if (events.length === 0) {
            return res.status(200).json({
                data: [],
                meta: {
                    total: 0,
                    page: pageNumber,
                    limit: pageSize,
                    totalPages: 0,
                },
                message: "No events found matching your criteria.",
            });
        }
        // ✅ Response
        res.json({
            data: events,
            meta: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getEvents = getEvents;
const getEventById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const event = yield prisma_1.prisma.event.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                organizer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
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
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.json(event);
    }
    catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getEventById = getEventById;
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const eventId = parseInt(id, 10);
        const userId = req.user.id;
        const existing = yield prisma_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!existing)
            return res.status(404).json({ message: "Event not found" });
        if (existing.organizerId !== userId) {
            return res
                .status(403)
                .json({ message: "Unauthorized to modify this event" });
        }
        const updateData = req.body;
        if (updateData.startDate)
            updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate)
            updateData.endDate = new Date(updateData.endDate);
        const event = yield prisma_1.prisma.event.update({
            where: { id: eventId },
            data: updateData,
        });
        res.json(event);
    }
    catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.updateEvent = updateEvent;
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const eventId = parseInt(id, 10);
        const userId = req.user.id;
        const existing = yield prisma_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!existing)
            return res.status(404).json({ message: "Event not found" });
        if (existing.organizerId !== userId) {
            return res
                .status(403)
                .json({ message: "Unauthorized to delete this event" });
        }
        yield prisma_1.prisma.event.delete({
            where: { id: eventId },
        });
        res.json({ message: "Event deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.deleteEvent = deleteEvent;
const getEventAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.id, 10);
        const organizerId = req.user.id;
        if (isNaN(eventId)) {
            return res.status(400).json({ message: "Invalid event ID" });
        }
        const event = yield prisma_1.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event || event.organizerId !== organizerId) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const attendees = yield prisma_1.prisma.transaction.findMany({
            where: {
                eventId,
                status: { in: ["DONE", "WAITING_FOR_ADMIN_CONFIRMATION"] }, // hanya yang bayar
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
                    include: {
                        ticket: true,
                    },
                },
            },
        });
        const formatted = attendees.map((tx) => ({
            user: tx.user,
            ticketTypes: tx.details.map((d) => ({
                type: d.ticket.type,
                quantity: d.quantity,
                price: d.ticket.price,
            })),
            totalQuantity: tx.quantity,
            totalPaid: tx.totalPrice,
            status: tx.status,
            paymentProof: tx.paymentProof,
        }));
        res.status(200).json({ attendees: formatted });
    }
    catch (error) {
        console.error("Error fetching attendees:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getEventAttendees = getEventAttendees;
const getEventsByOrganizer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizerId = req.user.id;
        const events = yield prisma_1.prisma.event.findMany({
            where: { organizerId },
            orderBy: { createdAt: "desc" },
        });
        res.json(events);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch your events" });
    }
});
exports.getEventsByOrganizer = getEventsByOrganizer;
