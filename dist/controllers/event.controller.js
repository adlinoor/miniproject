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
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date",
    }),
    endDate: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
    price: zod_1.z.number().min(0),
    seats: zod_1.z.number().min(1),
    eventType: zod_1.z.enum(["PAID", "FREE"]),
    category: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    location: zod_1.z.string().min(1),
    ticketTypes: zod_1.z
        .array(zod_1.z.object({
        type: zod_1.z.string(),
        price: zod_1.z.number().min(0),
        quantity: zod_1.z.number().min(1),
    }))
        .min(1),
    imageUrls: zod_1.z.array(zod_1.z.string().url()).optional(), // hasil upload middleware
});
exports.updateEventSchema = exports.createEventSchema.partial();
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // ticketTypes bisa string (dari FormData) atau array
        let ticketTypes = req.body.ticketTypes;
        if (typeof ticketTypes === "string")
            ticketTypes = JSON.parse(ticketTypes);
        const dataToValidate = Object.assign(Object.assign({}, req.body), { ticketTypes, price: Number(req.body.price), seats: Number(req.body.seats) });
        const validated = exports.createEventSchema.parse(dataToValidate);
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!organizerId)
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        const event = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const created = yield tx.event.create({
                data: {
                    title: validated.name,
                    description: validated.description,
                    startDate: new Date(validated.startDate),
                    endDate: new Date(validated.endDate),
                    price: validated.eventType === "FREE" ? 0 : validated.price,
                    availableSeats: validated.seats,
                    category: validated.category,
                    location: validated.location,
                    organizerId,
                },
            });
            // Save images
            if ((_a = validated.imageUrls) === null || _a === void 0 ? void 0 : _a.length) {
                yield tx.image.createMany({
                    data: validated.imageUrls.map((url) => ({
                        url,
                        eventId: created.id,
                    })),
                });
            }
            // Save tickets
            if (validated.ticketTypes.length) {
                yield tx.ticket.createMany({
                    data: validated.ticketTypes.map((t) => ({
                        eventId: created.id,
                        type: t.type,
                        price: t.price,
                        quantity: t.quantity,
                    })),
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
            if (startDate && !isNaN(Date.parse(startDate))) {
                where.startDate.gte = new Date(startDate);
            }
            if (endDate && !isNaN(Date.parse(endDate))) {
                where.startDate.lte = new Date(endDate);
            }
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
                    images: true,
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
const getEventById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const event = yield prisma_1.default.event.findUnique({
            where: { id },
            include: {
                organizer: { select: { id: true, first_name: true, last_name: true } },
                tickets: true,
                images: true,
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
        // Parse ticketTypes jika FormData
        let ticketTypes = req.body.ticketTypes;
        if (typeof ticketTypes === "string")
            ticketTypes = JSON.parse(ticketTypes);
        const dataToValidate = Object.assign(Object.assign({}, req.body), { ticketTypes, price: Number(req.body.price), seats: Number(req.body.seats) });
        const validated = exports.updateEventSchema.parse(dataToValidate);
        // Update event data
        const updateData = {
            title: validated.name,
            description: validated.description,
            startDate: validated.startDate
                ? new Date(validated.startDate)
                : undefined,
            endDate: validated.endDate ? new Date(validated.endDate) : undefined,
            price: validated.eventType === "FREE" ? 0 : validated.price,
            availableSeats: validated.seats,
            category: validated.category,
            location: validated.location,
        };
        const updated = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const eventUpdate = yield tx.event.update({
                where: { id },
                data: updateData,
            });
            // Handle image update
            if ((_a = validated.imageUrls) === null || _a === void 0 ? void 0 : _a.length) {
                yield tx.image.deleteMany({ where: { eventId: id } }); // Remove old
                yield tx.image.createMany({
                    data: validated.imageUrls.map((url) => ({
                        url,
                        eventId: id,
                    })),
                });
            }
            // Handle ticket update (replace all for simplicity)
            if ((_b = validated.ticketTypes) === null || _b === void 0 ? void 0 : _b.length) {
                yield tx.ticket.deleteMany({ where: { eventId: id } });
                yield tx.ticket.createMany({
                    data: validated.ticketTypes.map((t) => ({
                        eventId: id,
                        type: t.type,
                        price: t.price,
                        quantity: t.quantity,
                    })),
                });
            }
            return eventUpdate;
        }));
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
const getEventsByOrganizer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const events = yield prisma_1.default.event.findMany({
            where: { organizerId },
            orderBy: { createdAt: "desc" },
            include: { images: true, tickets: true },
        });
        res.status(200).json({ status: "success", data: events });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getEventsByOrganizer = getEventsByOrganizer;
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
