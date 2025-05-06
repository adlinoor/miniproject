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
const helpers_1 = require("./helpers");
describe("Event Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("createEvent", () => {
        it("should create an event successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.create.mockResolvedValue(helpers_1.mockEvent);
            const result = yield (0, event_service_1.createEvent)(helpers_1.mockEvent.title, helpers_1.mockEvent.description, helpers_1.mockEvent.startDate, helpers_1.mockEvent.endDate, helpers_1.mockEvent.location, helpers_1.mockEvent.category, helpers_1.mockEvent.price, helpers_1.mockEvent.availableSeats, helpers_1.mockEvent.organizerId);
            expect(result).toEqual(helpers_1.mockEvent);
            expect(setup_1.prismaMock.event.create).toHaveBeenCalledWith({
                data: {
                    title: helpers_1.mockEvent.title,
                    description: helpers_1.mockEvent.description,
                    startDate: helpers_1.mockEvent.startDate,
                    endDate: helpers_1.mockEvent.endDate,
                    location: helpers_1.mockEvent.location,
                    category: helpers_1.mockEvent.category,
                    price: helpers_1.mockEvent.price,
                    availableSeats: helpers_1.mockEvent.availableSeats,
                    organizerId: helpers_1.mockEvent.organizerId,
                },
            });
        }));
        it("should create an event with ticket types", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTicketTypes = [
                { type: "VIP", price: 20000, quantity: 50 },
                { type: "Regular", price: 10000, quantity: 100 },
            ];
            setup_1.prismaMock.event.create.mockResolvedValue(helpers_1.mockEvent);
            setup_1.prismaMock.ticket.createMany.mockResolvedValue({
                count: mockTicketTypes.length,
            });
            const result = yield (0, event_service_1.createEvent)(helpers_1.mockEvent.title, helpers_1.mockEvent.description, helpers_1.mockEvent.startDate, helpers_1.mockEvent.endDate, helpers_1.mockEvent.location, helpers_1.mockEvent.category, helpers_1.mockEvent.price, helpers_1.mockEvent.availableSeats, helpers_1.mockEvent.organizerId, mockTicketTypes);
            expect(result).toEqual(helpers_1.mockEvent);
            expect(setup_1.prismaMock.ticket.createMany).toHaveBeenCalledWith({
                data: mockTicketTypes.map((ticket) => (Object.assign({ eventId: helpers_1.mockEvent.id }, ticket))),
            });
        }));
    });
    describe("getEvents", () => {
        it("should return all events without filters", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockEvents = [helpers_1.mockEvent];
            setup_1.prismaMock.event.findMany.mockResolvedValue(mockEvents);
            const result = yield (0, event_service_1.getEvents)();
            expect(result).toEqual(mockEvents);
            expect(setup_1.prismaMock.event.findMany).toHaveBeenCalledWith({
                where: { AND: [{}, {}, {}, {}] },
                include: expect.any(Object),
            });
        }));
        it("should apply filters correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const filters = {
                category: "Music",
                location: "Location 1",
                search: "Event",
                upcomingOnly: true,
            };
            const mockFilteredEvents = [helpers_1.mockEvent];
            setup_1.prismaMock.event.findMany.mockResolvedValue(mockFilteredEvents);
            const result = yield (0, event_service_1.getEvents)(filters);
            expect(result).toEqual(mockFilteredEvents);
            expect(setup_1.prismaMock.event.findMany).toHaveBeenCalledWith({
                where: expect.any(Object),
                include: expect.any(Object),
            });
        }));
    });
    describe("getEventById", () => {
        it("should return event by id with all relations", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.findUnique.mockResolvedValue(helpers_1.mockEvent);
            const result = yield (0, event_service_1.getEventById)(1);
            expect(result).toEqual(helpers_1.mockEvent);
            expect(setup_1.prismaMock.event.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: expect.any(Object),
            });
        }));
        it("should return null for non-existent event", () => __awaiter(void 0, void 0, void 0, function* () {
            setup_1.prismaMock.event.findUnique.mockResolvedValue(null);
            const result = yield (0, event_service_1.getEventById)(999);
            expect(result).toBeNull();
            expect(setup_1.prismaMock.event.findUnique).toHaveBeenCalledWith({
                where: { id: 999 },
                include: expect.any(Object),
            });
        }));
    });
    describe("createPromotion", () => {
        it("should create a promotion successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            setup_1.prismaMock.promotion.create.mockResolvedValue(helpers_1.mockPromotion);
            const result = yield (0, event_service_1.createPromotion)(helpers_1.mockPromotion.eventId, helpers_1.mockPromotion.code, helpers_1.mockPromotion.discount, helpers_1.mockPromotion.startDate, helpers_1.mockPromotion.endDate, (_a = helpers_1.mockPromotion.maxUses) !== null && _a !== void 0 ? _a : undefined);
            expect(result).toEqual(helpers_1.mockPromotion);
            expect(setup_1.prismaMock.promotion.create).toHaveBeenCalledWith({
                data: {
                    eventId: helpers_1.mockPromotion.eventId,
                    code: helpers_1.mockPromotion.code,
                    discount: helpers_1.mockPromotion.discount,
                    startDate: helpers_1.mockPromotion.startDate,
                    endDate: helpers_1.mockPromotion.endDate,
                    maxUses: helpers_1.mockPromotion.maxUses,
                },
            });
        }));
    });
});
