import request from "supertest";
import app from "../app";
import { mockUser } from "./mockData";
import "../setup";

describe("🔐 Auth Endpoints", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/auth/register").send(mockUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty("email", mockUser.email);
    expect(res.body).toHaveProperty("token");
  });

  it("should reject duplicate email", async () => {
    await request(app).post("/auth/register").send(mockUser);
    const res = await request(app).post("/auth/register").send(mockUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it("should login with correct credentials", async () => {
    await request(app).post("/auth/register").send(mockUser);
    const res = await request(app).post("/auth/login").send({
      email: mockUser.email,
      password: mockUser.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should fail login with wrong password", async () => {
    await request(app).post("/auth/register").send(mockUser);
    const res = await request(app).post("/auth/login").send({
      email: mockUser.email,
      password: "wrongpass",
    });

    expect(res.statusCode).toBe(401);
  });
});
