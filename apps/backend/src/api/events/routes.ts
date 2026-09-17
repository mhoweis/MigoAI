// src/api/events/routes.ts - UPDATED imports
import { Router } from "express";
import { eventController } from "./controller";
import { validate } from "../../middlewares/validation.middleware";
import {
  createEventSchema,
  updateEventSchema,
  eventQuerySchema,
  eventIdSchema,
} from "@migo/shared";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware"; // Changed from authorize to requireRoles

const router = Router();

// Public routes (no authentication required)
router.get("/", validate(eventQuerySchema), eventController.getEvents);
router.get("/search", eventController.searchEvents);
router.get("/featured", eventController.getFeaturedEvents);
router.get("/upcoming", eventController.getUpcomingEvents);
router.get("/categories", eventController.getEventCategories);
router.get("/:id", validate(eventIdSchema), eventController.getEventById);
router.get(
  "/:id/reviews",
  validate(eventIdSchema),
  eventController.getEventReviews
);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  requireRoles(["ORGANIZER", "ADMIN"]), // Changed from authorize
  validate(createEventSchema),
  eventController.createEvent
);
router.put(
  "/:id",
  authenticate,
  requireRoles(["ORGANIZER", "ADMIN"]), // Changed from authorize
  validate(updateEventSchema),
  eventController.updateEvent
);
router.patch(
  "/:id/status",
  authenticate,
  requireRoles(["ORGANIZER", "ADMIN"]), // Changed from authorize
  eventController.toggleEventStatus
);
router.delete(
  "/:id",
  authenticate,
  requireRoles(["ORGANIZER", "ADMIN"]), // Changed from authorize
  eventController.deleteEvent
);
router.post(
  "/:id/images",
  authenticate,
  requireRoles(["ORGANIZER", "ADMIN"]), // Changed from authorize
  eventController.uploadEventImages
);

// User interactions (require authentication)
router.post("/:id/bookmark", authenticate, eventController.bookmarkEvent);
router.delete("/:id/bookmark", authenticate, eventController.removeBookmark);
router.post(
  "/:id/review",
  authenticate,
  validate(createEventSchema),
  eventController.createReview
);
router.get("/user/bookmarks", authenticate, eventController.getUserBookmarks);
router.get("/user/hosted", authenticate, eventController.getUserHostedEvents);

// Admin routes
router.get(
  "/admin/pending",
  authenticate,
  requireRoles(["ADMIN"]), // Changed from authorize
  eventController.getPendingEvents
);
router.post(
  "/admin/:id/approve",
  authenticate,
  requireRoles(["ADMIN"]), // Changed from authorize
  eventController.approveEvent
);
router.post(
  "/admin/:id/reject",
  authenticate,
  requireRoles(["ADMIN"]), // Changed from authorize
  eventController.rejectEvent
);

export default router;