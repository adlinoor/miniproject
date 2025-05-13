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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const mockData_1 = require("./mockData");
require("../setup");
describe("🔐 Auth Endpoints", () => {
    it("should register a new user", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default).post("/auth/register").send(mockData_1.mockUser);
        expect(res.statusCode).toBe(201);
        expect(res.body.user).toHaveProperty("email", mockData_1.mockUser.email);
        expect(res.body).toHaveProperty("token");
    }));
    it("should reject duplicate email", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app_1.default).post("/auth/register").send(mockData_1.mockUser);
        const res = yield (0, supertest_1.default)(app_1.default).post("/auth/register").send(mockData_1.mockUser);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already registered/i);
    }));
    it("should login with correct credentials", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app_1.default).post("/auth/register").send(mockData_1.mockUser);
        const res = yield (0, supertest_1.default)(app_1.default).post("/auth/login").send({
            email: mockData_1.mockUser.email,
            password: mockData_1.mockUser.password,
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
    }));
    it("should fail login with wrong password", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app_1.default).post("/auth/register").send(mockData_1.mockUser);
        const res = yield (0, supertest_1.default)(app_1.default).post("/auth/login").send({
            email: mockData_1.mockUser.email,
            password: "wrongpass",
        });
        expect(res.statusCode).toBe(401);
    }));
});
