import express from 'express';
import { createPaymentIntent, paymentSuccess } from '../controllers/payment.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/create-intent', authorize('customer'), createPaymentIntent);
router.post('/success', authorize('customer'), paymentSuccess);

export default router;
