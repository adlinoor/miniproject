import { Router } from "express";
import { getEventStatistics } from "../controllers/statistic.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, authorizeRoles("ORGANIZER"), getEventStatistics);
router.get(
  "/:eventId",
  authenticate,
  authorizeRoles("ORGANIZER"),
  getEventStatistics
);

export default router;
