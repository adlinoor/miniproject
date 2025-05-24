import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import {
  createReview,
  getEventReviews,
} from "../controllers/review.controller";
import { Role } from "@prisma/client";

const router = Router();

// POST /api/reviews - Create a new review
router.post("/", authenticate, authorizeRoles(Role.CUSTOMER), createReview);

// GET /api/reviews/event/:eventId - Get reviews for an event
router.get("/event/:eventId", getEventReviews);

export default router;
