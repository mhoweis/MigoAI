import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.enum(['MUSIC', 'SPORTS', 'ARTS', 'FOOD', 'TECH', 'BUSINESS', 'EDUCATION', 'OTHER']),
  date: z.string().datetime(),
  location: z.string().min(3, 'Location is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  price: z.number().min(0, 'Price cannot be negative'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  image: z.string().url('Invalid image URL').optional(),
});

export const bookingSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  tickets: z.array(z.object({
    ticketId: z.string(),
    quantity: z.number().min(1),
  })).min(1, 'At least one ticket is required'),
});