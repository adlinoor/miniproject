"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaMock = void 0;
require("jest");
const jest_mock_extended_1 = require("jest-mock-extended"); // Memudahkan untuk mock Prisma
const prismaMock = (0, jest_mock_extended_1.mockDeep)();
exports.prismaMock = prismaMock;
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
