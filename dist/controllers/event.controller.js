"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getVouchersByEvent = exports.createVoucher = exports.getEventAttendees = exports.getEventsByOrganizer = exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getEvents = exports.createEvent = exports.updateEventSchema = exports.createEventSchema = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const voucherService = __importStar(require("../services/promotion.service"));
// === Schema Validation ===
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date",
    }),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end date",
    }),
    location: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    price: zod_1.z.number().min(0),
    availableSeats: zod_1.z.number().min(1),
    imageUrl: zod_1.z.string().url().optional(),
    ticketTypes: zod_1.z
        .array(zod_1.z.object({
        type: zod_1.z.string(),
        price: zod_1.z.number().min(0),
        quota: zod_1.z.number().min(1),
        quantity: zod_1.z.number().min(1).optional(),
    }))
        .optional(),
});
exports.updateEventSchema = exports.createEventSchema.partial();
// === Create Event ===
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const validated = exports.createEventSchema.parse(req.body);
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!organizerId)
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        const event = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const created = yield tx.event.create({
                data: Object.assign(Object.assign({}, validated), { startDate: new Date(validated.startDate), endDate: new Date(validated.endDate), organizerId }),
            });
            if (validated.imageUrl) {
                yield tx.image.create({
                    data: { url: validated.imageUrl, eventId: created.id },
                });
            }
            if ((_a = validated.ticketTypes) === null || _a === void 0 ? void 0 : _a.length) {
                yield tx.ticket.createMany({
                    data: validated.ticketTypes.map((ticket) => {
                        var _a;
                        return ({
                            eventId: created.id,
                            type: ticket.type,
                            price: ticket.price,
                            quota: ticket.quota,
                            quantity: (_a = ticket.quantity) !== null && _a !== void 0 ? _a : ticket.quota,
                        });
                    }),
                });
            }
            return created;
        }));
        res.status(201).json({
            status: "success",
            message: "Event created",
            data: event,
        });
    }
    catch (error) {
        const status = error.name === "ZodError" ? 400 : 500;
        res.status(status).json({ status: "error", message: error.message });
    }
});
exports.createEvent = createEvent;
// === Get Events with Filters & Pagination ===
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category, location, minPrice, maxPrice, startDate, endDate, sortBy, sortOrder = "asc", page = "1", limit = "10", } = req.query;
        const where = {};
        if (typeof search === "string") {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        if (typeof category === "string")
            where.category = category;
        if (typeof location === "string")
            where.location = location;
        if (typeof minPrice === "string" || typeof maxPrice === "string") {
            where.price = {};
            if (typeof minPrice === "string")
                where.price.gte = Number(minPrice);
            if (typeof maxPrice === "string")
                where.price.lte = Number(maxPrice);
        }
        if (typeof startDate === "string" || typeof endDate === "string") {
            where.startDate = {};
            if (typeof startDate === "string")
                where.startDate.gte = new Date(startDate);
            if (typeof endDate === "string")
                where.startDate.lte = new Date(endDate);
        }
        const validSortOrder = sortOrder === "desc" ? "desc" : "asc";
        const orderBy = typeof sortBy === "string"
            ? { [sortBy]: validSortOrder }
            : { startDate: "asc" };
        const pageNumber = Math.max(1, parseInt(page, 10));
        const pageSize = Math.max(1, parseInt(limit, 10));
        const skip = (pageNumber - 1) * pageSize;
        const [events, total] = yield Promise.all([
            prisma_1.default.event.findMany({
                where,
                include: {
                    organizer: {
                        select: { id: true, first_name: true, last_name: true },
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
            prisma_1.default.event.count({ where }),
        ]);
        res.status(200).json({
            status: "success",
            message: "Events retrieved",
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
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getEvents = getEvents;
// === Get Event by ID ===
const getEventById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const event = yield prisma_1.default.event.findUnique({
            where: { id },
            include: {
                organizer: { select: { id: true, first_name: true, last_name: true } },
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
        if (!event)
            return res
                .status(404)
                .json({ status: "error", message: "Event not found" });
        const dataWithOrganizerId = Object.assign(Object.assign({}, event), { organizerId: event.organizer.id });
        res.status(200).json({
            status: "success",
            message: "Event detail",
            data: dataWithOrganizerId,
        });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getEventById = getEventById;
// === Update Event ===
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = Number(req.params.id);
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const event = yield prisma_1.default.event.findUnique({ where: { id } });
        if (!event)
            return res
                .status(404)
                .json({ status: "error", message: "Event not found" });
        if (event.organizerId !== organizerId)
            return res.status(403).json({ status: "error", message: "Forbidden" });
        const validated = exports.updateEventSchema.parse(req.body);
        const updateData = Object.assign(Object.assign(Object.assign({}, validated), (validated.startDate && { startDate: new Date(validated.startDate) })), (validated.endDate && { endDate: new Date(validated.endDate) }));
        const updated = yield prisma_1.default.event.update({
            where: { id },
            data: updateData,
        });
        res.status(200).json({
            status: "success",
            message: "Event updated",
            data: updated,
        });
    }
    catch (error) {
        const status = error.name === "ZodError" ? 400 : 500;
        res.status(status).json({ status: "error", message: error.message });
    }
});
exports.updateEvent = updateEvent;
// === Delete Event ===
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = Number(req.params.id);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const event = yield prisma_1.default.event.findUnique({ where: { id } });
        if (!event)
            return res
                .status(404)
                .json({ status: "error", message: "Event not found" });
        if (event.organizerId !== userId)
            return res.status(403).json({ status: "error", message: "Forbidden" });
        yield prisma_1.default.event.delete({ where: { id } });
        res.status(200).json({ status: "success", message: "Event deleted" });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.deleteEvent = deleteEvent;
// === Get Events by Organizer ===
const getEventsByOrganizer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const events = yield prisma_1.default.event.findMany({
            where: { organizerId },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ status: "success", data: events });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getEventsByOrganizer = getEventsByOrganizer;
// === Get Attendees by Event ===
const getEventAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = Number(req.params.id);
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const event = yield prisma_1.default.event.findUnique({ where: { id } });
        if (!event || event.organizerId !== organizerId)
            return res.status(403).json({ status: "error", message: "Unauthorized" });
        const attendees = yield prisma_1.default.transaction.findMany({
            where: {
                eventId: id,
                status: { in: ["DONE", "WAITING_FOR_ADMIN_CONFIRMATION"] },
            },
            include: {
                user: {
                    select: { id: true, first_name: true, last_name: true, email: true },
                },
                details: { include: { ticket: true } },
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
        res.status(200).json({ status: "success", data: formatted });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getEventAttendees = getEventAttendees;
// === Vouchers ===
const createVoucher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, discount, startDate, endDate } = req.body;
        const eventId = req.params.eventId;
        const voucher = yield voucherService.createVoucher({
            code,
            discount: Number(discount),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            eventId,
        });
        res.status(201).json({ status: "success", data: voucher });
    }
    catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
});
exports.createVoucher = createVoucher;
const getVouchersByEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vouchers = yield voucherService.getVouchersByEvent(req.params.eventId);
        res.status(200).json({ status: "success", data: vouchers });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getVouchersByEvent = getVouchersByEvent;
