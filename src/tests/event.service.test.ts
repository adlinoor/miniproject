import {
  createEvent,
  getEvents,
  getEventById,
  createPromotion,
} from "../services/event.service";
import { prismaMock } from "./setup";
import { mockDate, mockEvent, mockUser, mockPromotion } from "./helpers";
import { Event, Promotion } from "@prisma/client";

interface TicketType {
  type: string;
  price: number;
  quantity: number;
}

describe("Event Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEvent", () => {
    it("should create an event successfully", async () => {
      prismaMock.event.create.mockResolvedValue(mockEvent);

      const result = await createEvent(
        mockEvent.title,
        mockEvent.description,
        mockEvent.startDate,
        mockEvent.endDate,
        mockEvent.location,
        mockEvent.category,
        mockEvent.price,
        mockEvent.availableSeats,
        mockEvent.organizerId
      );

      expect(result).toEqual(mockEvent);
      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: {
          title: mockEvent.title,
          description: mockEvent.description,
          startDate: mockEvent.startDate,
          endDate: mockEvent.endDate,
          location: mockEvent.location,
          category: mockEvent.category,
          price: mockEvent.price,
          availableSeats: mockEvent.availableSeats,
          organizerId: mockEvent.organizerId,
        },
      });
    });

    it("should create an event with ticket types", async () => {
      const mockTicketTypes: TicketType[] = [
        { type: "VIP", price: 20000, quantity: 50 },
        { type: "Regular", price: 10000, quantity: 100 },
      ];

      prismaMock.event.create.mockResolvedValue(mockEvent);
      prismaMock.ticket.createMany.mockResolvedValue({
        count: mockTicketTypes.length,
      });

      const result = await createEvent(
        mockEvent.title,
        mockEvent.description,
        mockEvent.startDate,
        mockEvent.endDate,
        mockEvent.location,
        mockEvent.category,
        mockEvent.price,
        mockEvent.availableSeats,
        mockEvent.organizerId,
        mockTicketTypes
      );

      expect(result).toEqual(mockEvent);
      expect(prismaMock.ticket.createMany).toHaveBeenCalledWith({
        data: mockTicketTypes.map((ticket) => ({
          eventId: mockEvent.id,
          ...ticket,
        })),
      });
    });
  });

  describe("getEvents", () => {
    it("should return all events without filters", async () => {
      const mockEvents = [mockEvent];
      prismaMock.event.findMany.mockResolvedValue(mockEvents);

      const result = await getEvents();

      expect(result).toEqual(mockEvents);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: { AND: [{}, {}, {}, {}] },
        include: expect.any(Object),
      });
    });

    it("should apply filters correctly", async () => {
      const filters = {
        category: "Music",
        location: "Location 1",
        search: "Event",
        upcomingOnly: true,
      };

      const mockFilteredEvents = [mockEvent];
      prismaMock.event.findMany.mockResolvedValue(mockFilteredEvents);

      const result = await getEvents(filters);

      expect(result).toEqual(mockFilteredEvents);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: expect.any(Object),
      });
    });
  });

  describe("getEventById", () => {
    it("should return event by id with all relations", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const result = await getEventById(1);

      expect(result).toEqual(mockEvent);
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it("should return null for non-existent event", async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const result = await getEventById(999);

      expect(result).toBeNull();
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: expect.any(Object),
      });
    });
  });

  describe("createPromotion", () => {
    it("should create a promotion successfully", async () => {
      prismaMock.promotion.create.mockResolvedValue(mockPromotion);

      const result = await createPromotion(
        mockPromotion.eventId,
        mockPromotion.code,
        mockPromotion.discount,
        mockPromotion.startDate,
        mockPromotion.endDate,
        mockPromotion.maxUses ?? undefined
      );

      expect(result).toEqual(mockPromotion);
      expect(prismaMock.promotion.create).toHaveBeenCalledWith({
        data: {
          eventId: mockPromotion.eventId,
          code: mockPromotion.code,
          discount: mockPromotion.discount,
          startDate: mockPromotion.startDate,
          endDate: mockPromotion.endDate,
          maxUses: mockPromotion.maxUses,
        },
      });
    });
  });
});
