"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statistic_controller_1 = require("../controllers/statistic.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// 📊 Statistik semua event milik organizer
router.get("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("ORGANIZER"), statistic_controller_1.getEventStatistics);
// 📊 Statistik spesifik untuk satu event
router.get("/:eventId", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("ORGANIZER"), statistic_controller_1.getEventStatistics);
exports.default = router;
