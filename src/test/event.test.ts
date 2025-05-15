import request from "supertest";
import app from "../app";
import { mockUserAndToken } from "../test/authHelper";

describe("Feature 1.1 - Event Creation and Listing", () => {
  it("Organizer should create an event successfully", async () => {
    const { token } = await mockUserAndToken("ORGANIZER");
    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Mock Event",
        price: 50000,
        startDate: new Date(),
        endDate: new Date(),
        availableSeats: 100,
        description: "Mocked test event",
      });
    expect(res.status).toBe(201);
  });

  it("Customer should not be allowed to create an event", async () => {
    const { token } = await mockUserAndToken("CUSTOMER");
    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Invalid Event",
        price: 30000,
        startDate: new Date(),
        endDate: new Date(),
        availableSeats: 10,
        description: "Should fail",
      });
    expect(res.status).toBe(403);
  });
});
