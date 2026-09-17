// src/routes/admin.routes.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Admin endpoint - coming soon' });
});

export { router as adminRouter };