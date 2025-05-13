import "jest";
import prisma from "../lib/prisma";
import { mockDeep } from "jest-mock-extended"; // Memudahkan untuk mock Prisma

const prismaMock = mockDeep<typeof prisma>();
jest.mock("../lib/prisma", () => ({
  user: {
    findUnique: jest.fn(), // Menambahkan findUnique
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  point: {
    create: jest.fn(),
  },
  coupon: {
    create: jest.fn(),
  },
}));

export { prismaMock };
