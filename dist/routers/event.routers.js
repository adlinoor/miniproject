"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const event_controller_1 = require("../controllers/event.controller");
const validator_middleware_1 = require("../middleware/validator.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const cloudinary_service_1 = require("../services/cloudinary.service");
const uploadImageAndAttachUrl_1 = require("../middleware/uploadImageAndAttachUrl");
const router = (0, express_1.Router)();
//
// ====================
// 📂 Public Routes
// ====================
//
router.get("/", event_controller_1.getEvents);
router.get("/:id", (0, validator_middleware_1.validateIdParam)("id"), event_controller_1.getEventById);
//
// ==============================
// 🔒 Protected Routes (ORGANIZER)
// ==============================
//
// Lihat semua event milik organizer
router.get("/organizer/my-events", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), event_controller_1.getEventsByOrganizer);
// Lihat daftar peserta event tertentu (khusus organizer pemilik)
router.get("/:id/attendees", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("id"), event_controller_1.getEventAttendees);
// Buat event baru (upload image via multer)
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), cloudinary_service_1.upload.single("image"), // 💾 multer memory storage
uploadImageAndAttachUrl_1.uploadImageAndAttachUrl, // ☁️ Cloudinary => inject req.body.imageUrl
(0, validator_middleware_1.validateRequest)(event_controller_1.createEventSchema), (0, validator_middleware_1.validateDates)("startDate", "endDate"), event_controller_1.createEvent);
// Update event
router.put("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("id"), (0, validator_middleware_1.validateRequest)(event_controller_1.updateEventSchema), (0, validator_middleware_1.validateDates)("startDate", "endDate"), event_controller_1.updateEvent);
// Hapus event
router.delete("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("id"), event_controller_1.deleteEvent);
//
// 🎟 Voucher Management by Organizer
//
// Buat voucher untuk event
router.post("/:eventId/vouchers", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("eventId"), 
// validateRequest(createVoucherSchema), // aktifkan jika pakai validasi Zod
event_controller_1.createVoucher);
// Ambil semua voucher dari event
router.get("/:eventId/vouchers", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("eventId"), event_controller_1.getVouchersByEvent);
exports.default = router;
