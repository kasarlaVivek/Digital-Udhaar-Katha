import express from 'express';
import { createCustomer, getCustomers, updateDebt, deleteCustomer, updateStripeKeys, sendReminder } from '../controllers/owner.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here are protected and restricted to owners
router.use(protect);
router.use(authorize('owner'));

router.route('/customers')
  .post(createCustomer)
  .get(getCustomers);

router.route('/customers/:id/debt')
  .put(updateDebt);

router.route('/customers/:id')
  .delete(deleteCustomer);

router.route('/customers/:id/remind')
  .post(sendReminder);

router.put('/stripe-keys', updateStripeKeys);

export default router;
