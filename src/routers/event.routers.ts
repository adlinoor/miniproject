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
import { upload } from "../services/cloudinary.service";
import { uploadImageAndAttachUrl } from "../middleware/uploadImageAndAttachUrl";

const router = Router();

// ====================
// 📂 Public Routes
// ====================

router.get("/", getEvents);

router.get("/:id", validateIdParam("id"), getEventById);

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

// Get specific event total attendees owned by organizer
router.get(
  "/:id/attendees",
  authenticate,
  authorizeRoles("ORGANIZER"),
  getEventAttendees
);

router.post(
  "/",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateRequest(createEventSchema),
  validateDates("startDate", "endDate"),
  createEvent
);

router.post(
  "/",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  upload.single("image"), // 💾 multer memory storage
  uploadImageAndAttachUrl, // ☁️ attach Cloudinary URL to req.body.imageUrl
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
