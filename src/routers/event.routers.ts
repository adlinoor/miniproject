import express from "express";
import { upload } from "../app";
import { authenticate, authorizeRoles } from "../middleware/auth";
import { Role } from "@prisma/client";
import {
  createEvent,
  getEvents,
  getEventById,
  createEventSchema,
} from "../services/event.service";
import { validateRequest } from "../middleware/validateRequest";

const router = express.Router();

// Public routes
router.get("/", async (req, res, next) => {
  try {
    const events = await getEvents(req.query);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const event = await getEventById(req.params.id);
    res.json(event);
  } catch (error) {
    next(error);
  }
});

// Organizer-only routes
router.post(
  "/",
  authenticate,
  authorizeRoles([Role.ORGANIZER]),
  upload.array("images", 5),
  validateRequest(createEventSchema),
  async (req, res, next) => {
    try {
      const event = await createEvent(
        req.body,
        req.user.id,
        req.files as Express.Multer.File[]
      );
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
