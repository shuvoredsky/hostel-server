import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { PaymentController } from './payment.controller';
import { InvoiceController } from './invoice.controller';

const router = Router();

// Student — payment initiate করবে
router.post(
  '/initiate/:bookingId',
  checkAuth(Role.STUDENT),
  PaymentController.initiatePayment,
);

// Student — নিজের payments দেখবে
router.get(
  '/my-payments',
  checkAuth(Role.STUDENT),
  PaymentController.getMyPayments,
);


router.get(
  '/invoice/:paymentId',
  checkAuth(Role.OWNER),
  InvoiceController.downloadInvoice,
);

// Owner — নিজের listing এর payments দেখবে
router.get(
  '/owner/all',
  checkAuth(Role.OWNER),
  PaymentController.getOwnerPayments,
);

// Admin — সব payments দেখবে + commission
router.get(
  '/admin/all',
  checkAuth(Role.ADMIN),
  PaymentController.getAllPayments,
);

// SSLCommerz callbacks — public (SSLCommerz থেকে আসবে)
router.post('/success/:transactionId', PaymentController.paymentSuccess);
router.post('/fail/:transactionId', PaymentController.paymentFail);
router.post('/cancel/:transactionId', PaymentController.paymentCancel);
router.post('/ipn', (req, res) => res.status(200).send('IPN received'));

export const PaymentRoutes = router;