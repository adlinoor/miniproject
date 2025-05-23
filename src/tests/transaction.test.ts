import request from "supertest";
import app from "../app";
import { describe, it, expect } from "vitest";

describe("Transaction Routes", () => {
  it("should fail to create transaction without login", async () => {
    const res = await request(app).post("/api/transactions").send({
      eventId: 1,
      quantity: 2,
    });
    expect(res.statusCode).toBe(401);
  });
});
