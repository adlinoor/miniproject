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
const app_1 = __importDefault(require("../../src/app"));
const authHelper_1 = require("../helpers/authHelper");
describe('Feature 1.3 - Review after event attendance', () => {
    it('User cannot review without attending event', () => __awaiter(void 0, void 0, void 0, function* () {
        const { token } = yield (0, authHelper_1.mockUserAndToken)('customer');
        const res = yield (0, supertest_1.default)(app_1.default)
            .post('/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({
            eventId: 1,
            rating: 4,
            comment: 'Trying to review without attending',
        });
        expect([403, 400]).toContain(res.status);
    }));
});
