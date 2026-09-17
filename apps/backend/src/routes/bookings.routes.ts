import { Router, Request, Response } from 'express';
import prisma from '../database/prisma';

const router = Router();

// Get all bookings
router.get('/', async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        event: {
          select: { id: true, title: true, date: true }
        }
      },
      orderBy: {
        bookingDate: 'desc'
      }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create booking
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, eventId, ticketCount, totalAmount } = req.body;

    const booking = await prisma.booking.create({
      data: {
        userId,
        eventId,
        ticketCount,
        totalAmount,
        status: 'confirmed'
      },
      include: {
        user: true,
        event: true
      }
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update booking status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: 'Booking status updated',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

export { router as bookingsRouter };