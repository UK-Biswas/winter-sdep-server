import { Router } from "express";

import {
  createEvent,
  deleteEvent,
  getEvent,
  joinEvent,
  leaveEvent,
  listEvents,
  listJoinedEvents,
  listMyEvents,
  updateEvent,
} from "../controllers/events.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, listEvents);
router.get("/mine", requireAuth, listMyEvents);
router.get("/joined", requireAuth, listJoinedEvents);

router.post("/", requireAuth, createEvent);

router.get("/:id", optionalAuth, getEvent);
router.put("/:id", requireAuth, updateEvent);
router.delete("/:id", requireAuth, deleteEvent);

router.post("/:id/join", requireAuth, joinEvent);
router.delete("/:id/join", requireAuth, leaveEvent);

export default router;
