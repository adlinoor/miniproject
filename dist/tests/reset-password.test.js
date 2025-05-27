"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const prisma_1 = __importDefault(require("../../src/lib/prisma"));
let resetToken = "";
(0, vitest_1.describe)("Forgot & Reset Password Flow", () => {
    const testEmail = "forgot@example.com";
    (0, vitest_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Buat user dummy
        yield prisma_1.default.user.upsert({
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
    }));
    (0, vitest_1.it)("should send reset link", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post("/api/auth/forgot-password")
            .send({ email: testEmail });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.message).toContain("Reset link");
        // Ambil token dari database
        const user = yield prisma_1.default.user.findUnique({
            where: { email: testEmail },
        });
        (0, vitest_1.expect)(user === null || user === void 0 ? void 0 : user.resetToken).toBeTruthy();
        resetToken = user === null || user === void 0 ? void 0 : user.resetToken;
    }));
    (0, vitest_1.it)("should reset password with valid token", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post(`/api/auth/reset-password/${resetToken}`)
            .send({ password: "newpassword123" });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.message).toBe("Password updated successfully");
        // Pastikan token terhapus
        const updated = yield prisma_1.default.user.findUnique({
            where: { email: testEmail },
        });
        (0, vitest_1.expect)(updated === null || updated === void 0 ? void 0 : updated.resetToken).toBeNull();
        (0, vitest_1.expect)(updated === null || updated === void 0 ? void 0 : updated.resetTokenExp).toBeNull();
    }));
    (0, vitest_1.it)("should fail with invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post(`/api/auth/reset-password/invalidtoken123`)
            .send({ password: "anything" });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.error).toMatch(/Invalid|expired/i);
    }));
});
