import { Router } from "express";
import { Role } from "@prisma/client";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventAttendees,
  getEventsByOrganizer,
  getVouchersByEvent,
  createVoucher,
} from "../controllers/event.controller";
import {
  validateRequest,
  validateDates,
  validateIdParam,
} from "../middleware/validator.middleware";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import upload from "../middleware/upload";
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
router.get(
  "/organizer/my-events",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  getEventsByOrganizer
);
router.get(
  "/:id/attendees",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("id"),
  getEventAttendees
);

// Buat event baru (multi image)
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  upload.array("images"), // 💾 multi-image memory storage
  uploadImageAndAttachUrl, // ☁️ Cloudinary (inject req.body.imageUrls)
  createEvent
);

// Update event
router.put(
  "/:id",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("id"),
  upload.array("images"), // multi-image
  uploadImageAndAttachUrl,
  updateEvent
);

// Hapus event
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("id"),
  deleteEvent
);

// 🎟 Voucher Management by Organizer
router.post(
  "/:eventId/vouchers",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("eventId"),
  createVoucher
);
router.get(
  "/:eventId/vouchers",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("eventId"),
  getVouchersByEvent
);

export default router;
