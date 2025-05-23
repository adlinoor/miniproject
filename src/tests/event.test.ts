import request from "supertest";
import app from "../app";
import { describe, it, expect } from "vitest";

describe("Event Routes", () => {
  it("should fetch list of events", async () => {
    const res = await request(app).get("/api/events");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
  });
});
