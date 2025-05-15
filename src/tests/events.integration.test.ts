import request from "supertest";
import app from "../app";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

// ==========================
// 🔧 MOCK DATA & BEHAVIOR
// ==========================

const mockUser = {
  id: 1,
  email: "organizer@example.com",
  first_name: "Event",
  last_name: "Organizer",
  role: Role.ORGANIZER,
};

const mockEvent = {
  id: 101,
  title: "Test Event",
  description: "Test Description",
  startDate: new Date("2025-01-01T00:00:00.000Z"),
  endDate: new Date("2025-01-02T00:00:00.000Z"),
  location: "Test Location",
  category: "Test",
  price: 10000,
  availableSeats: 100,
  organizerId: mockUser.id,
};

const mockToken = "Bearer mock.token.here";

// Mock prisma
const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
  event: {
    create: jest.fn(),
  },
};

// Override module
jest.mock("../lib/prisma", () => prismaMock);

// Mock JWT
jest.mock("jsonwebtoken");

describe("Event API", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Simulasi payload token valid
    (jwt.verify as jest.Mock).mockImplementation(() => ({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      first_name: mockUser.first_name,
      last_name: mockUser.last_name,
    }));

    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.event.create.mockResolvedValue(mockEvent);
  });

  describe("POST /api/events", () => {
    it("should create a new event", async () => {
      const eventData = {
        title: "Test Event",
        description: "Test Description",
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-01-02T00:00:00.000Z",
        location: "Test Location",
        category: "Test",
        price: 10000,
        availableSeats: 100,
      };

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: {
          ...eventData,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          organizerId: mockUser.id,
        },
      });
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).post("/api/events").send({});
      expect(response.status).toBe(401);
    });

    it("should return 403 if token is invalid", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", "Bearer invalid-token")
        .send({});
      expect(response.status).toBe(403);
    });

    it("should reject non-organizer users", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => ({
        id: 2,
        email: "customer@example.com",
        role: Role.CUSTOMER,
        first_name: "Test",
        last_name: "Customer",
      }));

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send({
          title: "Test Event",
          description: "Test",
          startDate: "2025-01-01T00:00:00.000Z",
          endDate: "2025-01-02T00:00:00.000Z",
          location: "Here",
          category: "General",
          price: 10000,
          availableSeats: 10,
        });

      expect(response.status).toBe(403);
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("issues");
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it("should validate incorrect types", async () => {
      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send({
          title: "Wrong",
          description: "Type",
          startDate: "invalid-date",
          endDate: "2025-01-02",
          location: "Place",
          category: "Cat",
          price: "abc", // invalid
          availableSeats: "many", // invalid
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("issues");
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it("should validate date order", async () => {
      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send({
          title: "Wrong Date",
          description: "Start after end",
          startDate: "2025-02-01T00:00:00.000Z",
          endDate: "2025-01-01T00:00:00.000Z",
          location: "Wrong",
          category: "Invalid",
          price: 10000,
          availableSeats: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("issues");
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it("should return 500 if event creation fails", async () => {
      prismaMock.event.create.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send({
          title: "Crash Test",
          description: "To trigger 500",
          startDate: "2025-01-01T00:00:00.000Z",
          endDate: "2025-01-02T00:00:00.000Z",
          location: "CrashLand",
          category: "Crash",
          price: 50000,
          availableSeats: 5,
        });

      expect(response.status).toBe(500);
    });
  });
});
