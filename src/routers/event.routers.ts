import { Router } from "express";
import { Role } from "@prisma/client";

import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  createEventSchema,
  updateEventSchema,
  getEventAttendees,
  getEventsByOrganizer,
} from "../controllers/event.controller";

import {
  validateRequest,
  validateDates,
  validateIdParam,
} from "../middleware/validator.middleware";

import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// ====================
// 📂 Public Routes
// ====================

router.get("/", getEvents);

router.get("/:id", validateIdParam("id"), getEventById);
router.get(
  "/:id/attendees",
  authenticate,
  authorizeRoles("ORGANIZER"),
  getEventAttendees
);

// ==============================
// 🔒 Protected Routes (ORGANIZER)
// ==============================

// Get events owned by organizer
router.get(
  "/organizer/my-events",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  getEventsByOrganizer
);

router.post(
  "/",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateRequest(createEventSchema),
  validateDates("startDate", "endDate"),
  createEvent
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("id"),
  validateRequest(updateEventSchema),
  validateDates("startDate", "endDate"),
  updateEvent
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("id"),
  deleteEvent
);

export default router;
