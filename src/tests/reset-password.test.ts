import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/lib/prisma";

let resetToken: string = "";

describe("Forgot & Reset Password Flow", () => {
  const testEmail = "forgot@example.com";

  beforeAll(async () => {
    // Buat user dummy
    await prisma.user.upsert({
      where: { email: testEmail },
      update: {},
      create: {
        email: testEmail,
        password: "hashed-password", // bisa dummy hash
        first_name: "Test",
        last_name: "User",
        role: "CUSTOMER",
      },
    });
  });

  it("should send reset link", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Reset link");

    // Ambil token dari database
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    expect(user?.resetToken).toBeTruthy();
    resetToken = user?.resetToken!;
  });

  it("should reset password with valid token", async () => {
    const res = await request(app)
      .post(`/api/auth/reset-password/${resetToken}`)
      .send({ password: "newpassword123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password updated successfully");

    // Pastikan token terhapus
    const updated = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    expect(updated?.resetToken).toBeNull();
    expect(updated?.resetTokenExp).toBeNull();
  });

  it("should fail with invalid token", async () => {
    const res = await request(app)
      .post(`/api/auth/reset-password/invalidtoken123`)
      .send({ password: "anything" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid|expired/i);
  });
});
