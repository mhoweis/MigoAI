// src/api/bookings/routes.ts
import { Router } from "express";
import { bookingsController } from "./controller";
import { validate } from "../../middlewares/validation.middleware";
import { createBookingSchema, cancelBookingSchema } from "@migo/shared";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

// Create new booking
router.post(
  "/",
  validate(createBookingSchema),
  bookingsController.createBooking
);

// Get user's bookings
router.get("/", bookingsController.getUserBookings);

// Get booking by ID
router.get("/:id", bookingsController.getBookingById);

// Cancel booking
router.put(
  "/:id/cancel",
  validate(cancelBookingSchema),
  bookingsController.cancelBooking
);

// Download tickets (PDF/QR)
router.get("/:id/tickets", bookingsController.downloadTickets);

// Send tickets via email
router.post("/:id/send-tickets", bookingsController.sendTicketsByEmail);

// Booking analytics
router.get("/analytics/overview", bookingsController.getBookingAnalytics);

export default router;
