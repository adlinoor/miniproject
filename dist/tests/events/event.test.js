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
const app_1 = __importDefault(require("../../app"));
const authHelper_1 = require("../helpers/authHelper");
describe("Feature 1.1 - Event Creation and Listing", () => {
    it("Organizer should create an event successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        const { token } = yield (0, authHelper_1.mockUserAndToken)("ORGANIZER");
        const res = yield (0, supertest_1.default)(app_1.default)
            .post("/events")
            .set("Authorization", `Bearer ${token}`)
            .send({
            name: "Mock Event",
            price: 50000,
            startDate: new Date(),
            endDate: new Date(),
            availableSeats: 100,
            description: "Mocked test event",
        });
        expect(res.status).toBe(201);
    }));
    it("Customer should not be allowed to create an event", () => __awaiter(void 0, void 0, void 0, function* () {
        const { token } = yield (0, authHelper_1.mockUserAndToken)("CUSTOMER");
        const res = yield (0, supertest_1.default)(app_1.default)
            .post("/events")
            .set("Authorization", `Bearer ${token}`)
            .send({
            name: "Invalid Event",
            price: 30000,
            startDate: new Date(),
            endDate: new Date(),
            availableSeats: 10,
            description: "Should fail",
        });
        expect(res.status).toBe(403);
    }));
});
