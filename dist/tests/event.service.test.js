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
const prisma_1 = __importDefault(require("../lib/prisma"));
const event_service_1 = require("../services/event.service");
const client_1 = require("@prisma/client");
const mockData_1 = require("./mockData");
require("../setup"); // <-- pastikan ini paling atas
describe("🎪 Event Service", () => {
    let organizerId;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield prisma_1.default.user.create({
            data: {
                first_name: "Organizer",
                last_name: "One",
                email: "organizer@example.com",
                password: "hashedpass",
                role: client_1.Role.ORGANIZER,
            },
        });
        organizerId = user.id;
    }));
    it("should create a new event", () => __awaiter(void 0, void 0, void 0, function* () {
        const event = yield (0, event_service_1.createEvent)(Object.assign(Object.assign({}, mockData_1.mockEvent), { organizerId }));
        expect(event).toHaveProperty("id");
        expect(event.organizerId).toBe(organizerId);
        expect(event.title).toBe(mockData_1.mockEvent.title);
    }));
});
