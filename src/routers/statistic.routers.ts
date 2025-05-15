import { Router } from "express";
import { getEventStatistics } from "../controllers/statistic.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// 📊 Statistik semua event milik organizer
router.get("/", authenticate, authorizeRoles("ORGANIZER"), getEventStatistics);

// 📊 Statistik spesifik untuk satu event
router.get(
  "/:eventId",
  authenticate,
  authorizeRoles("ORGANIZER"),
  getEventStatistics
);

export default router;
