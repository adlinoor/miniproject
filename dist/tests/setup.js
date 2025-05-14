"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaMock = void 0;
// src/tests/setup.ts
const jest_mock_extended_1 = require("jest-mock-extended");
exports.prismaMock = (0, jest_mock_extended_1.mockDeep)();
jest.mock("../lib/prisma", () => ({
    prisma: exports.prismaMock,
}));
