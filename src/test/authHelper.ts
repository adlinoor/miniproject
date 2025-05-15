import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const prisma = new PrismaClient();

export const mockUserAndToken = async (role: "CUSTOMER" | "ORGANIZER") => {
  const user = await prisma.user.create({
    data: {
      first_name: `Test ${role}`,
      last_name: `User ${role}`,
      email: `${role}-${Date.now()}@mail.com`,
      password: bcrypt.hashSync("password123", 10),
      role: "CUSTOMER",
    },
  });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "secret"
  );
  return { user, token };
};
