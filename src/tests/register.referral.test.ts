import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../lib/prisma";
import { RegisterService } from "../services/auth.service";

const TEST_EMAILS = [
  "user1@example.com",
  "user2@example.com",
  "user3@example.com",
  "user4@example.com",
  "referrer@example.com",
];

beforeAll(async () => {
  await prisma.coupon.deleteMany({
    where: { user: { email: { in: TEST_EMAILS } } },
  });
  await prisma.point.deleteMany({
    where: { user: { email: { in: TEST_EMAILS } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });
});

afterAll(async () => {
  await prisma.coupon.deleteMany({
    where: { user: { email: { in: TEST_EMAILS } } },
  });
  await prisma.point.deleteMany({
    where: { user: { email: { in: TEST_EMAILS } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });
  await prisma.$disconnect();
});

describe("Referral Registration", () => {
  it("should register user without referral and userPoints=0", async () => {
    const user = await RegisterService({
      email: "user1@example.com",
      password: "password",
      first_name: "First",
      last_name: "User",
      role: "CUSTOMER",
    });
    expect(user).not.toBeNull();
    expect(user!.userPoints).toBe(0);
  });

  it("should register user with valid referral code and both get points", async () => {
    const referrer = await RegisterService({
      email: "referrer@example.com",
      password: "password",
      first_name: "Ref",
      last_name: "User",
      role: "CUSTOMER",
    });
    expect(referrer).not.toBeNull();
    // Register new user with referral code
    const newUser = await RegisterService({
      email: "user2@example.com",
      password: "password",
      first_name: "Second",
      last_name: "User",
      role: "CUSTOMER",
      referralCode: referrer!.referralCode || undefined,
    });
    expect(newUser).not.toBeNull();
    expect(newUser!.userPoints).toBe(10000);
    const updatedReferrer = await prisma.user.findUnique({
      where: { id: referrer!.id },
    });
    expect(updatedReferrer).not.toBeNull();
    expect(updatedReferrer!.userPoints).toBe(10000);
  });

  it("should throw error for invalid referral code", async () => {
    await expect(
      RegisterService({
        email: "user3@example.com",
        password: "password",
        first_name: "Third",
        last_name: "User",
        role: "CUSTOMER",
        referralCode: "INVALIDCODE",
      })
    ).rejects.toThrow("Invalid referral code");
  });

  it("should not allow duplicate email registration", async () => {
    await RegisterService({
      email: "user4@example.com",
      password: "password",
      first_name: "Fourth",
      last_name: "User",
      role: "CUSTOMER",
    });
    await expect(
      RegisterService({
        email: "user4@example.com",
        password: "password",
        first_name: "Fourth",
        last_name: "User",
        role: "CUSTOMER",
      })
    ).rejects.toThrow("Email already registered");
  });
});
