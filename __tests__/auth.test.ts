import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("Auth Routes", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      first_name: "John",
      last_name: "Doe",
      email: "johndoe@example.com",
      password: "password123",
      role: "CUSTOMER",
    });

    console.log("REGISTER RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", "johndoe@example.com");
  });

  it("should login an existing user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "johndoe@example.com",
      password: "password123",
    });

    console.log("LOGIN RESPONSE:", res.statusCode, res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", "johndoe@example.com");
  });
});
