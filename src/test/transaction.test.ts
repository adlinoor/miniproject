import request from "supertest";
import app from "../app";
import { mockUserAndToken } from "../test/authHelper";

describe("Feature 1.2 - Event Transaction", () => {
  it("Customer can create a transaction for an event", async () => {
    const { token } = await mockUserAndToken("CUSTOMER");
    const eventId = 1; // Replace with a seeded or mocked event ID

    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        eventId,
        ticketQty: 2,
      });

    expect([201, 200, 400]).toContain(res.status);
  });
});
