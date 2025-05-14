// src/tests/setup.ts
import { mockDeep } from "jest-mock-extended";
import prisma from "../lib/prisma";

export const prismaMock = mockDeep<typeof prisma>();

jest.mock("../lib/prisma", () => ({
  prisma: prismaMock,
}));
