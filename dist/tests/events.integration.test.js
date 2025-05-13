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
const setup_1 = require("./setup");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mockData_1 = require("./mockData");
describe("Event API", () => {
    const mockToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken";
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock JWT verify
        jsonwebtoken_1.default.verify.mockImplementation(() => ({
            id: mockData_1.mockUser.id,
            role: mockData_1.mockUser.role,
            email: mockData_1.mockUser.email,
            first_name: mockData_1.mockUser.first_name,
            last_name: mockData_1.mockUser.last_name,
        }));
        // Mock Prisma user create
        setup_1.prismaMock.user.create.mockResolvedValue(mockData_1.mockUser);
        // Mock event creation
        setup_1.prismaMock.event.create.mockResolvedValue(mockData_1.mockEvent);
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
            console.log(response.body); // Log the response body to inspect the error
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(setup_1.prismaMock.event.create).toHaveBeenCalledWith({
                data: Object.assign(Object.assign({}, eventData), { startDate: expect.any(Date), endDate: expect.any(Date), organizerId: mockData_1.mockUser.id }),
            });
        }));
        it("should reject unauthorized access", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock token verification failure
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new Error("Invalid token");
            });
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", "Bearer invalid-token")
                .send({});
            // Assert unauthorized error response
            expect(response.status).toBe(401);
            expect(setup_1.prismaMock.event.create).not.toHaveBeenCalled();
        }));
        it("should reject non-organizer users", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock regular user role
            jsonwebtoken_1.default.verify.mockImplementation(() => ({
                id: 2,
                role: "customer",
                email: "customer@example.com",
                first_name: "Test",
                last_name: "Customer",
            }));
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
            // Assert forbidden error response
            expect(response.status).toBe(403);
            expect(setup_1.prismaMock.event.create).not.toHaveBeenCalled();
        }));
        it("should validate required fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send({});
            // Assert bad request response due to missing required fields
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("issues");
            expect(setup_1.prismaMock.event.create).not.toHaveBeenCalled();
        }));
        it("should validate data types", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidEventData = {
                title: "Test Event",
                description: "Test Description",
                startDate: "invalid-date",
                endDate: "2025-01-02",
                location: "Test Location",
                category: "Test",
                price: "10000", // String instead of number
                availableSeats: "100", // String instead of number
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send(invalidEventData);
            // Assert bad request response due to incorrect data types
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("issues");
            expect(setup_1.prismaMock.event.create).not.toHaveBeenCalled();
        }));
        it("should validate date order", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidEventData = {
                title: "Test Event",
                description: "Test Description",
                startDate: "2025-01-02T00:00:00.000Z", // Later date
                endDate: "2025-01-01T00:00:00.000Z", // Earlier date
                location: "Test Location",
                category: "Test",
                price: 10000,
                availableSeats: 100,
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post("/api/events")
                .set("Authorization", mockToken)
                .send(invalidEventData);
            // Assert bad request response due to invalid date range
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("issues");
            expect(setup_1.prismaMock.event.create).not.toHaveBeenCalled();
        }));
    });
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cleanup if needed (not mandatory in this case)
    }));
});
