import express from "express";
import {
  createReview,
  getEventReviews,
} from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

// POST /api/reviews - Create a new review
router.post("/", authenticate, createReview);

// GET /api/reviews/event/:eventId - Get reviews for an event
router.get("/event/:eventId", getEventReviews);

export default router;
