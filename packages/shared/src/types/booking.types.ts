/**
 * Booking types
 */
import { BookingStatus, PaymentMethod } from '../constants';
import { EventSummary } from './event.types';
import { UserProfile } from './user.types';

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  ticketCount: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;

  // Payment
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  paidAt?: string;

  // Attendee info
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;

  // Check-in
  checkInAt?: string;
  checkInCode?: string;

  // Relations
  user?: UserProfile;
  event?: EventSummary;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
}

export interface BookingSummary {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  ticketCount: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingFilters {
  userId?: string;
  eventId?: string;
  status?: BookingStatus;
  dateFrom?: string;
  dateTo?: string;
}
