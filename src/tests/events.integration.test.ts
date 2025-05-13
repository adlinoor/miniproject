import request from "supertest";
import app from "../app";
import { prismaMock } from "./setup";
import jwt from "jsonwebtoken";
import { mockEvent, mockUser } from "./mockData";
import { Role } from "@prisma/client";

describe("Event API", () => {
  const mockToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT verify
    (jwt.verify as jest.Mock).mockImplementation(() => ({
      id: mockUser.id,
      role: mockUser.role,
      email: mockUser.email,
      first_name: mockUser.first_name,
      last_name: mockUser.last_name,
    }));

    // Mock Prisma user create
    prismaMock.user.create.mockResolvedValue(mockUser);

    // Mock event creation
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

      console.log(response.body); // Log the response body to inspect the error

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
    it("should reject unauthorized access", async () => {
      // Mock token verification failure
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", "Bearer invalid-token")
        .send({});

      // Assert unauthorized error response
      expect(response.status).toBe(401);
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it("should reject non-organizer users", async () => {
      // Mock regular user role
      (jwt.verify as jest.Mock).mockImplementation(() => ({
        id: 2,
        role: "customer" as Role,
        email: "customer@example.com",
        first_name: "Test",
        last_name: "Customer",
      }));

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

      // Assert forbidden error response
      expect(response.status).toBe(403);
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send({});

      // Assert bad request response due to missing required fields
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("issues");
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it("should validate data types", async () => {
      const invalidEventData = {
        title: "Test Event",
        description: "Test Description",
        startDate: "invalid-date",
        endDate: "2025-01-02",
        location: "Test Location",
        category: "Test",
        price: "10000", // String instead of number
        availableSeats: "100", // String instead of number
      };

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send(invalidEventData);

      // Assert bad request response due to incorrect data types
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("issues");
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it("should validate date order", async () => {
      const invalidEventData = {
        title: "Test Event",
        description: "Test Description",
        startDate: "2025-01-02T00:00:00.000Z", // Later date
        endDate: "2025-01-01T00:00:00.000Z", // Earlier date
        location: "Test Location",
        category: "Test",
        price: 10000,
        availableSeats: 100,
      };

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", mockToken)
        .send(invalidEventData);

      // Assert bad request response due to invalid date range
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("issues");
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    // Cleanup if needed (not mandatory in this case)
  });
});
