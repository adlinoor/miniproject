"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const validator_middleware_1 = require("../middleware/validator.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public routes
router.get("/", event_controller_1.getEvents);
router.get("/:id", event_controller_1.getEventById);
// Protected routes - Only organizers can create/update/delete events
router.post("/", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)([client_1.Role.organizer]), (0, validator_middleware_1.validateRequest)(event_controller_1.createEventSchema), (0, validator_middleware_1.validateDates)("startDate", "endDate"), event_controller_1.createEvent);
router.put("/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)([client_1.Role.organizer]), (0, validator_middleware_1.validateRequest)(event_controller_1.updateEventSchema), (0, validator_middleware_1.validateDates)("startDate", "endDate"), event_controller_1.updateEvent);
router.delete("/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)([client_1.Role.organizer]), event_controller_1.deleteEvent);
exports.default = router;
