import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  createEventSchema,
  updateEventSchema,
} from "../controllers/event.controller";
import {
  validateRequest,
  validateDates,
} from "../middleware/validator.middleware";
import { authMiddleware, requireRole } from "../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Public routes
router.get("/", getEvents);
router.get("/:id", getEventById);

// Protected routes - Only organizers can create/update/delete events
router.post(
  "/",
  authMiddleware,
  requireRole([Role.ORGANIZER]),
  validateRequest(createEventSchema),
  validateDates("startDate", "endDate"),
  createEvent
);

router.put(
  "/:id",
  authMiddleware,
  requireRole([Role.ORGANIZER]),
  validateRequest(updateEventSchema),
  validateDates("startDate", "endDate"),
  updateEvent
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole([Role.ORGANIZER]),
  deleteEvent
);

export default router;
