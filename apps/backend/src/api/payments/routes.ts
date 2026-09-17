// src/api/payments/routes.ts
import { Router } from 'express';
import { paymentsController } from './controller';
import { validate } from '../../middlewares/validation.middleware';
import { createPaymentIntentSchema, confirmPaymentSchema } from '@migo/shared';

const router = Router();

// Create payment intent
router.post('/create-intent', validate(createPaymentIntentSchema), paymentsController.createPaymentIntent);

// Confirm payment
router.post('/confirm', validate(confirmPaymentSchema), paymentsController.confirmPayment);

// Get payment history
router.get('/history', paymentsController.getPaymentHistory);

// Get payment by ID
router.get('/:paymentId', paymentsController.getPaymentById);

// Request refund
router.post('/:paymentId/refund', paymentsController.requestRefund);

// Webhook handler (for Stripe/Firebase)
router.post('/webhook/stripe', paymentsController.handleStripeWebhook);
router.post('/webhook/firebase', paymentsController.handleFirebaseWebhook);

export default router;