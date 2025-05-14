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
const event_service_1 = require("../services/event.service");
const setup_1 = require("./setup");
const mockData_1 = require("./mockData");
describe("🎪 Event Service", () => {
    describe("createEvent", () => {
        it("should create event successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.create.mockResolvedValue(mockData_1.mockEvent);
            const result = yield (0, event_service_1.createEvent)(mockData_1.mockEvent);
            expect(result).toEqual(mockData_1.mockEvent);
            expect(setup_1.prismaMock.event.create).toHaveBeenCalledWith({
                data: mockData_1.mockEvent,
            });
        }));
    });
    describe("getEvents", () => {
        it("should return list of events", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.findMany.mockResolvedValue([mockData_1.mockEvent]);
            const result = yield (0, event_service_1.getEvents)();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(1);
        }));
    });
    describe("getEventById", () => {
        it("should return event by id", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.findUnique.mockResolvedValue(mockData_1.mockEvent);
            const result = yield (0, event_service_1.getEventById)(mockData_1.mockEvent.id);
            expect(result).toEqual(mockData_1.mockEvent);
        }));
    });
    describe("createPromotion", () => {
        it("should create promotion for an event", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.promotion.create.mockResolvedValue(mockData_1.mockPromotion);
            const result = yield (0, event_service_1.createPromotion)(mockData_1.mockPromotion.eventId, mockData_1.mockPromotion.code, mockData_1.mockPromotion.discount, mockData_1.mockPromotion.startDate, mockData_1.mockPromotion.endDate, mockData_1.mockPromotion.maxUses);
            expect(result).toEqual(mockData_1.mockPromotion);
            expect(setup_1.prismaMock.promotion.create).toHaveBeenCalledWith({
                data: {
                    eventId: mockData_1.mockPromotion.eventId,
                    code: mockData_1.mockPromotion.code,
                    discount: mockData_1.mockPromotion.discount,
                    startDate: mockData_1.mockPromotion.startDate,
                    endDate: mockData_1.mockPromotion.endDate,
                    maxUses: mockData_1.mockPromotion.maxUses,
                },
            });
        }));
    });
    describe("getOrganizerStats", () => {
        it("should return stats for organizer", () => __awaiter(void 0, void 0, void 0, function* () {
            const stats = [
                {
                    month: new Date(),
                    event_count: 3,
                    total_seats: 150,
                },
            ];
            setup_1.prismaMock.$queryRaw.mockResolvedValue(stats);
            const result = (yield (0, event_service_1.getOrganizerStats)(1));
            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty("event_count");
            expect(result[0]).toHaveProperty("total_seats");
        }));
    });
});
