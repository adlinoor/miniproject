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
exports.getVouchersByEvent = exports.createVoucher = exports.validatePromotion = exports.createPromotion = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createPromotion = (eventId, organizerId, code, discount, startDate, endDate, maxUses) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Verify the event belongs to the organizer
        const event = yield tx.event.findFirst({
            where: { id: eventId, organizerId },
        });
        if (!event) {
            throw new Error("Event not found or you are not the organizer");
        }
        // Create the promotion
        const promotion = yield tx.promotion.create({
            data: {
                eventId: Number(eventId),
                code,
                discount,
                startDate,
                endDate,
                maxUses,
            },
        });
        return promotion;
    }));
});
exports.createPromotion = createPromotion;
const validatePromotion = (code, eventId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const promotion = yield prisma_1.default.promotion.findUnique({
        where: { code },
    });
    if (!promotion) {
        return { valid: false, message: "Promotion code not found" };
    }
    if (promotion.eventId !== eventId) {
        return {
            valid: false,
            message: "This promotion is not valid for this event",
        };
    }
    const now = new Date();
    if (now < promotion.startDate) {
        return { valid: false, message: "Promotion has not started yet" };
    }
    if (now > promotion.endDate) {
        return { valid: false, message: "Promotion has expired" };
    }
    if (promotion.maxUses && promotion.uses >= promotion.maxUses) {
        return { valid: false, message: "Promotion has reached its usage limit" };
    }
    return { valid: true, discount: promotion.discount };
});
exports.validatePromotion = validatePromotion;
const createVoucher = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, discount, startDate, endDate, eventId } = data;
    const event = yield prisma_1.default.event.findUnique({
        where: { id: Number(eventId) },
    });
    if (!event)
        throw new Error("Event not found");
    return prisma_1.default.promotion.create({
        data: {
            code,
            discount,
            startDate,
            endDate,
            eventId: Number(eventId),
        },
    });
});
exports.createVoucher = createVoucher;
const getVouchersByEvent = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.promotion.findMany({ where: { eventId: Number(eventId) } });
});
exports.getVouchersByEvent = getVouchersByEvent;
