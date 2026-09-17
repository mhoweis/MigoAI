// src/routes/payments.routes.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Payments endpoint - coming soon' });
});

export { router as paymentsRouter };