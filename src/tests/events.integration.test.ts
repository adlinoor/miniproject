import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

jest.mock("../src/lib/prisma");
jest.mock("jsonwebtoken");

describe("Event API", () => {
  const mockUser = {
    id: 1,
    email: "organizer@example.com",
    role: "organizer",
  };

  const mockEvent = {
    id: 1,
    title: "Test Event",
    organizerId: 1,
  };

  beforeAll(() => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: mockUser.id });
  });

  describe("POST /api/events", () => {
    it("should create a new event", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const response = await request(app)
        .post("/api/events")
        .set("Cookie", "token=validtoken")
        .send({
          title: "Test Event",
          description: "Test Description",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
          location: "Test Location",
          category: "Test",
          price: 10000,
          availableSeats: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });

    it("should reject unauthorized access", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const response = await request(app)
        .post("/api/events")
        .set("Cookie", "token=invalidtoken")
        .send({});

      expect(response.status).toBe(401);
    });
  });
});
