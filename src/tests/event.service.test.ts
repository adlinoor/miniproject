import {
  createEvent,
  getEventById,
  getEvents,
  createPromotion,
  getOrganizerStats,
} from "../services/event.service";
import { prismaMock } from "./setup";
import { mockEvent, mockPromotion } from "./mockData";

describe("🎪 Event Service", () => {
  describe("createEvent", () => {
    it("should create event successfully", async () => {
      prismaMock.event.create.mockResolvedValue(mockEvent);

      const result = await createEvent(mockEvent);

      expect(result).toEqual(mockEvent);
      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: mockEvent,
      });
    });
  });

  describe("getEvents", () => {
    it("should return list of events", async () => {
      prismaMock.event.findMany.mockResolvedValue([mockEvent]);

      const result = await getEvents();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getEventById", () => {
    it("should return event by id", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const result = await getEventById(mockEvent.id);

      expect(result).toEqual(mockEvent);
    });
  });

  describe("createPromotion", () => {
    it("should create promotion for an event", async () => {
      prismaMock.promotion.create.mockResolvedValue(mockPromotion);

      const result = await createPromotion(
        mockPromotion.eventId,
        mockPromotion.code,
        mockPromotion.discount,
        mockPromotion.startDate,
        mockPromotion.endDate,
        mockPromotion.maxUses!
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

  describe("getOrganizerStats", () => {
    it("should return stats for organizer", async () => {
      const stats = [
        {
          month: new Date(),
          event_count: 3,
          total_seats: 150,
        },
      ];

      prismaMock.$queryRaw.mockResolvedValue(stats as any);

      const result = (await getOrganizerStats(1)) as {
        month: Date;
        event_count: number;
        total_seats: number;
      }[];

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("event_count");
      expect(result[0]).toHaveProperty("total_seats");
    });
  });
});
