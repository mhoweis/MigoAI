x// src/routes/notifications.routes.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Notifications endpoint - coming soon' });
});

export { router as notificationsRouter };