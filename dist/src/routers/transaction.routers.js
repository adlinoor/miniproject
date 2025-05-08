"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const transaction_controller_1 = require("../controllers/transaction.controller");
const router = (0, express_1.Router)();
// Routes for transactions
router.post("/", auth_middleware_1.authMiddleware, transaction_controller_1.createEventTransaction);
router.get("/:id", auth_middleware_1.authMiddleware, transaction_controller_1.getTransactionDetails);
router.put("/:id", auth_middleware_1.authMiddleware, transaction_controller_1.updateTransaction);
exports.default = router;
