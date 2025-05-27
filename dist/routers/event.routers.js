"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const event_controller_1 = require("../controllers/event.controller");
const validator_middleware_1 = require("../middleware/validator.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = __importDefault(require("../middleware/upload"));
const uploadImageAndAttachUrl_1 = require("../middleware/uploadImageAndAttachUrl");
const router = (0, express_1.Router)();
// ====================
// 📂 Public Routes
// ====================
router.get("/", event_controller_1.getEvents);
router.get("/:id", (0, validator_middleware_1.validateIdParam)("id"), event_controller_1.getEventById);
// ==============================
// 🔒 Protected Routes (ORGANIZER)
// ==============================
router.get("/organizer/my-events", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), event_controller_1.getEventsByOrganizer);
router.get("/:id/attendees", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("id"), event_controller_1.getEventAttendees);
// Buat event baru (multi image)
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), upload_1.default.array("images"), // 💾 multi-image memory storage
uploadImageAndAttachUrl_1.uploadImageAndAttachUrl, // ☁️ Cloudinary (inject req.body.imageUrls)
event_controller_1.createEvent);
// Update event
router.put("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("id"), upload_1.default.array("images"), // multi-image
uploadImageAndAttachUrl_1.uploadImageAndAttachUrl, event_controller_1.updateEvent);
// Hapus event
router.delete("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("id"), event_controller_1.deleteEvent);
// 🎟 Voucher Management by Organizer
router.post("/:eventId/vouchers", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("eventId"), event_controller_1.createVoucher);
router.get("/:eventId/vouchers", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.ORGANIZER), (0, validator_middleware_1.validateIdParam)("eventId"), event_controller_1.getVouchersByEvent);
exports.default = router;
