"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const review_controller_1 = require("../controllers/review.controller");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// POST /api/reviews - Create a new review
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.CUSTOMER), review_controller_1.createReview);
// GET /api/reviews/event/:eventId - Get reviews for an event
router.get("/event/:eventId", review_controller_1.getEventReviews);
exports.default = router;
