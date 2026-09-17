// src/api/organizers/routes.ts
import { Router } from "express";
import { organizersController } from "./controller";
import {
  authenticate,
  requireOrganizer,
} from "../../middlewares/auth.middleware"; // Fixed import

const router = Router();

// Apply organizer middleware to all routes
router.use(authenticate, requireOrganizer);

// Dashboard overview
router.get("/dashboard", organizersController.getDashboard);

// Event management
router.get("/events", organizersController.getOrganizerEvents);
router.get("/events/:id/attendees", organizersController.getEventAttendees);
router.post("/events/:id/check-in", organizersController.checkInAttendee);

// Revenue & analytics
router.get("/revenue", organizersController.getRevenue);
router.get("/analytics", organizersController.getAnalytics);

// Export data
router.get("/export/attendees", organizersController.exportAttendees);
router.get("/export/revenue", organizersController.exportRevenue);

// Organizer settings
router.get("/settings", organizersController.getSettings);
router.put("/settings", organizersController.updateSettings);

export default router;
