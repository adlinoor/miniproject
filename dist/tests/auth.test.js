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
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)("Auth Routes", () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`; // unik setiap run
    (0, vitest_1.it)("should register a new user", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send({
            first_name: "John",
            last_name: "Doe",
            email: uniqueEmail,
            password: "password123",
            role: "CUSTOMER",
        });
        console.log("REGISTER RESPONSE:", res.statusCode, res.body);
        (0, vitest_1.expect)(res.statusCode).toBe(201);
        (0, vitest_1.expect)(res.body).toHaveProperty("user");
        (0, vitest_1.expect)(res.body.user).toHaveProperty("email", uniqueEmail);
    }));
    (0, vitest_1.it)("should login an existing user", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({
            email: uniqueEmail,
            password: "password123",
        });
        console.log("LOGIN RESPONSE:", res.statusCode, res.body);
        (0, vitest_1.expect)(res.statusCode).toBe(200);
        (0, vitest_1.expect)(res.body).toHaveProperty("user");
        (0, vitest_1.expect)(res.body.user).toHaveProperty("email", uniqueEmail);
    }));
});
