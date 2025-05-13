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

// ==============================
// 🔒 Protected Routes (ORGANIZER)
// ==============================

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
