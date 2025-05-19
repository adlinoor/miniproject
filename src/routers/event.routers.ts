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
  createEventSchema,
  updateEventSchema,
  // createVoucherSchema, // jika pakai validasi Zod untuk voucher
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

//
// ====================
// 📂 Public Routes
// ====================
//

router.get("/", getEvents);

router.get("/:id", validateIdParam("id"), getEventById);

//
// ==============================
// 🔒 Protected Routes (ORGANIZER)
// ==============================
//

// Lihat semua event milik organizer
router.get(
  "/organizer/my-events",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  getEventsByOrganizer
);

// Lihat daftar peserta event tertentu (khusus organizer pemilik)
router.get(
  "/:id/attendees",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("id"),
  getEventAttendees
);

// Buat event baru (upload image via multer)
router.post(
  "/",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  upload.single("image"), // 💾 multer memory storage
  uploadImageAndAttachUrl, // ☁️ Cloudinary => inject req.body.imageUrl
  validateRequest(createEventSchema),
  validateDates("startDate", "endDate"),
  createEvent
);

// Update event
router.put(
  "/:id",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("id"),
  validateRequest(updateEventSchema),
  validateDates("startDate", "endDate"),
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

//
// 🎟 Voucher Management by Organizer
//

// Buat voucher untuk event
router.post(
  "/:eventId/vouchers",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("eventId"),
  // validateRequest(createVoucherSchema), // aktifkan jika pakai validasi Zod
  createVoucher
);

// Ambil semua voucher dari event
router.get(
  "/:eventId/vouchers",
  authenticate,
  authorizeRoles(Role.ORGANIZER),
  validateIdParam("eventId"),
  getVouchersByEvent
);

export default router;
