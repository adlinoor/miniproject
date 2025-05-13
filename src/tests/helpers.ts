import prisma from "../lib/prisma";

export const createTestUser = async (data = {}) =>
  await prisma.user.create({
    data: {
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      password: "hashedpassword",
      role: "CUSTOMER",
      ...data,
    },
  });
