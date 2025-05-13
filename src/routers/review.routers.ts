import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createReview,
  getEventReviews,
} from "../controllers/review.controller";

const router = Router();

// POST /api/reviews - Create a new review
router.post("/", authenticate, createReview);

// GET /api/reviews/event/:eventId - Get reviews for an event
router.get("/event/:eventId", getEventReviews);

export default router;
