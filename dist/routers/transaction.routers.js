"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_2 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Routes for transactions
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_2.authorizeRoles)("CUSTOMER"), transaction_controller_1.createEventTransaction);
router.get("/:id", auth_middleware_1.authenticate, transaction_controller_1.getTransactionDetails);
router.get("/transactions/check", auth_middleware_1.authenticate, transaction_controller_1.checkUserJoined);
router.get("/myevents", auth_middleware_1.authenticate, (0, auth_middleware_2.authorizeRoles)(client_1.Role.CUSTOMER), transaction_controller_1.getMyEvents);
router.get("/organizer", auth_middleware_1.authenticate, (0, auth_middleware_2.authorizeRoles)(client_1.Role.ORGANIZER), transaction_controller_1.getOrganizerTransactions);
router.put("/:id/status", auth_middleware_1.authenticate, (0, auth_middleware_2.authorizeRoles)(client_1.Role.ORGANIZER), transaction_controller_1.updateTransaction);
router.put("/:id", auth_middleware_1.authenticate, transaction_controller_1.updateTransaction);
exports.default = router;
