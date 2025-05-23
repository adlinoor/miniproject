import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app";

describe("Auth Routes", () => {
  const uniqueEmail = `testuser_${Date.now()}@example.com`; // Unique every run

  // Register before login to make sure user is created
  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      first_name: "Johan",
      last_name: "Doe",
      email: uniqueEmail,
      password: "password123",
      role: "CUSTOMER",
    });

    console.log("REGISTER RESPONSE:", res.statusCode, res.body);

    // Assert that registration was successful
    if (res.statusCode !== 201) {
      throw new Error(
        `Failed to register user: ${res.body.error || "Unknown error"}`
      );
    }

    // Ensure that registration was successful
    expect(res.statusCode).toBe(201); // Expected status code for successful registration
    expect(res.body).toHaveProperty("user"); // Ensure user is returned
    expect(res.body.user).toHaveProperty("email", uniqueEmail); // Ensure the email matches
  });

  it("should login an existing user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: uniqueEmail,
      password: "password123",
    });

    console.log("LOGIN RESPONSE:", res.statusCode, res.body);

    // Assert that login is successful
    expect(res.statusCode).toBe(200); // Expected status code for successful login
    expect(res.body).toHaveProperty("user"); // Ensure user is returned
    expect(res.body.user).toHaveProperty("email", uniqueEmail); // Ensure the email matches
  });
});
