import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller";
import { validateRequest } from "../middleware/validator.middleware";
import {
  createEventSchema,
  updateEventSchema,
} from "../controllers/event.controller";

const router = express.Router();

// Public routes
router.get("/", getEvents); // Fetch all events
router.get("/:id", getEventById); // Fetch a specific event by ID

// Organizer-only routes
router.post(
  "/",
  authenticate,
  authorizeRoles("organizer"),
  validateRequest(createEventSchema),
  createEvent
); // Create a new event

router.put(
  "/:id",
  authenticate,
  authorizeRoles("organizer"),
  validateRequest(updateEventSchema),
  updateEvent
); // Update an existing event

router.delete("/:id", authenticate, authorizeRoles("organizer"), deleteEvent); // Delete an event

export default router;
