// src/routes/wishlists.routes.ts
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/database';

const router = Router();

router.use(authenticate);

// GET /api/wishlists — return saved events for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { wishlists: wishlists.map((w) => w.event) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch saved events' });
  }
});

// POST /api/wishlists/:eventId — save an event
router.post('/:eventId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { eventId } = req.params;
    const wishlist = await prisma.wishlist.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId },
      update: {},
    });
    res.json({ success: true, data: { wishlist } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save event' });
  }
});

// DELETE /api/wishlists/:eventId — remove saved event
router.delete('/:eventId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { eventId } = req.params;
    await prisma.wishlist.deleteMany({ where: { userId, eventId } });
    res.json({ success: true, data: { message: 'Removed from saved events' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove saved event' });
  }
});

export default router;
