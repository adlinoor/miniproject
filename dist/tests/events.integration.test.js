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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
// ==========================
// 🔧 MOCK DATA & BEHAVIOR
// ==========================
const mockUser = {
    id: 1,
    email: "organizer@example.com",
    first_name: "Event",
    last_name: "Organizer",
    role: client_1.Role.ORGANIZER,
};
const mockEvent = {
    id: 101,
    title: "Test Event",
    description: "Test Description",
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    endDate: new Date("2025-01-02T00:00:00.000Z"),
    location: "Test Location",
    category: "Test",
    price: 10000,
    availableSeats: 100,
    organizerId: mockUser.id,
};
const mockToken = "Bearer mock.token.here";
// Mock prisma
const prismaMock = {
    user: {
        findUnique: jest.fn(),
    },
    event: {
        create: jest.fn(),
    },
};
// Override module
jest.mock("../lib/prisma", () => prismaMock);
// Mock JWT
jest.mock("jsonwebtoken");
describe("Event API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Simulasi payload token valid
        jsonwebtoken_1.default.verify.mockImplementation(() => ({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
            first_name: mockUser.first_name,
            last_name: mockUser.last_name,
        }));
        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.event.create.mockResolvedValue(mockEvent);
    });
    describe("POST /api/events", () => {
        it("should create a new event", () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                title: "Test Event",
                description: "Test Description",
                startDate: "2025-01-01T00:00:00.000Z",
                endDate: "2025-01-02T00:00:00.000Z",
                location: "Test Location",
                category: "Test",
                price: 10000,
                availableSeats: 100,
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send(eventData);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(prismaMock.event.create).toHaveBeenCalledWith({
                data: Object.assign(Object.assign({}, eventData), { startDate: expect.any(Date), endDate: expect.any(Date), organizerId: mockUser.id }),
            });
        }));
        it("should return 401 if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default).post("/api/events").send({});
            expect(response.status).toBe(401);
        }));
        it("should return 403 if token is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new Error("Invalid token");
            });
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", "Bearer invalid-token")
                .send({});
            expect(response.status).toBe(403);
        }));
        it("should reject non-organizer users", () => __awaiter(void 0, void 0, void 0, function* () {
            jsonwebtoken_1.default.verify.mockImplementation(() => ({
                id: 2,
                email: "customer@example.com",
                role: client_1.Role.CUSTOMER,
                first_name: "Test",
                last_name: "Customer",
            }));
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send({
                title: "Test Event",
                description: "Test",
                startDate: "2025-01-01T00:00:00.000Z",
                endDate: "2025-01-02T00:00:00.000Z",
                location: "Here",
                category: "General",
                price: 10000,
                availableSeats: 10,
            });
            expect(response.status).toBe(403);
            expect(prismaMock.event.create).not.toHaveBeenCalled();
        }));
        it("should validate required fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send({});
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("issues");
            expect(prismaMock.event.create).not.toHaveBeenCalled();
        }));
        it("should validate incorrect types", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send({
                title: "Wrong",
                description: "Type",
                startDate: "invalid-date",
                endDate: "2025-01-02",
                location: "Place",
                category: "Cat",
                price: "abc", // invalid
                availableSeats: "many", // invalid
            });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("issues");
            expect(prismaMock.event.create).not.toHaveBeenCalled();
        }));
        it("should validate date order", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send({
                title: "Wrong Date",
                description: "Start after end",
                startDate: "2025-02-01T00:00:00.000Z",
                endDate: "2025-01-01T00:00:00.000Z",
                location: "Wrong",
                category: "Invalid",
                price: 10000,
                availableSeats: 100,
            });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("issues");
            expect(prismaMock.event.create).not.toHaveBeenCalled();
        }));
        it("should return 500 if event creation fails", () => __awaiter(void 0, void 0, void 0, function* () {
            prismaMock.event.create.mockRejectedValue(new Error("Database error"));
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send({
                title: "Crash Test",
                description: "To trigger 500",
                startDate: "2025-01-01T00:00:00.000Z",
                endDate: "2025-01-02T00:00:00.000Z",
                location: "CrashLand",
                category: "Crash",
                price: 50000,
                availableSeats: 5,
            });
            expect(response.status).toBe(500);
        }));
    });
});
