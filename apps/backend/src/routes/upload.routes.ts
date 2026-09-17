// src/routes/upload.routes.ts
import { Router } from 'express';
const router = Router();

router.post('/', (req, res) => {
  res.json({ message: 'Upload endpoint - coming soon' });
});

export { router as uploadRouter };