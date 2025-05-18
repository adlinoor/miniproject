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
Object.defineProperty(exports, "__esModule", { value: true });
describe("💳 Transaction Service", () => {
    describe("createTransaction", () => {
        it("should create a transaction successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            // TODO: implement test
        }));
    });
    describe("updateTransactionStatus", () => {
        it("should update transaction to accepted", () => __awaiter(void 0, void 0, void 0, function* () {
            // TODO: implement test
        }));
        it("should update transaction to rejected", () => __awaiter(void 0, void 0, void 0, function* () {
            // TODO: implement test
        }));
        it("should return points and restore seats on rejection", () => __awaiter(void 0, void 0, void 0, function* () {
            // TODO: implement test
        }));
    });
});
