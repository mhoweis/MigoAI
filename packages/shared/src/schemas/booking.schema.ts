/**
 * Booking validation schemas
 * Created for booking-related operations
 */
import { z } from 'zod';

// Create booking schema
export const createBookingSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    ticketCount: z.number().min(1, 'At least one ticket is required').max(50, 'Maximum 50 tickets per booking'),
    attendeeInfo: z
      .object({
        name: z.string().min(1, 'Attendee name is required'),
        email: z.string().email('Invalid email address'),
        phone: z.string().optional(),
      })
      .optional(),
    paymentMethod: z.enum(['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL']).optional(),
  }),
});

// Update booking schema
export const updateBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED']).optional(),
    checkInAt: z.string().datetime().optional(),
  }),
});

// Cancel booking schema
export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
  body: z.object({
    reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
  }),
});

// Booking ID schema
export const bookingIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});

// Type exports
export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>['body'];
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>['body'];
