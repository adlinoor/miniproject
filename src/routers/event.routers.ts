import express from "express";
import { upload } from "../";
import { authorizeRoles } from "../middleware/auth.middleware";
import { Role } from "@prisma/client";
import {
  createEvent,
  getEvents,
  getEventById,
  createEventSchema,
} from "../services/event.service";
import ReqValidator from "../middleware/validator.middleware";

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
  authorizeRoles([Role.organizer]),
  upload.array("images", 5),
  ReqValidator(createEventSchema),
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
