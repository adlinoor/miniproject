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
exports.updateTransaction = exports.getTransactionDetails = exports.createEventTransaction = void 0;
const transaction_service_1 = require("../services/transaction.service");
const createEventTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { eventId, quantity } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const transaction = yield (0, transaction_service_1.createTransaction)(userId, eventId, quantity);
        res.status(201).json(transaction);
    }
    catch (error) {
        console.error("Error creating transaction:", error);
        res.status(error.message.includes("not found") ? 404 : 400).json({
            message: error.message || "Error creating transaction",
        });
    }
});
exports.createEventTransaction = createEventTransaction;
const getTransactionDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const transaction = yield (0, transaction_service_1.getTransaction)(parseInt(id, 10));
        res.json(transaction);
    }
    catch (error) {
        console.error("Error getting transaction:", error);
        res.status(error.message.includes("not found") ? 404 : 500).json({
            message: error.message || "Error getting transaction details",
        });
    }
});
exports.getTransactionDetails = getTransactionDetails;
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, paymentProof } = req.body;
        const transaction = yield (0, transaction_service_1.updateTransactionStatus)(parseInt(id, 10), status, paymentProof);
        res.json(transaction);
    }
    catch (error) {
        console.error("Error updating transaction:", error);
        res.status(error.message.includes("not found") ? 404 : 500).json({
            message: error.message || "Error updating transaction",
        });
    }
});
exports.updateTransaction = updateTransaction;
