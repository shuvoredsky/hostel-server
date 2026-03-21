import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../app/lib/auth';
import { AuthRoutes } from '../app/module/auth/auth.route';
import { ListingRoutes } from '../app/module/listing/listing.route';
import { BookingRoutes } from '../app/module/booking/booking.route';
import { PaymentRoutes } from '../app/module/payment/payment.route';
import { DashboardRoutes } from '../app/module/dashboard/dashboard.route';


const router = Router();



router.use('/bookings', BookingRoutes);

router.all('/auth/better/{*path}', toNodeHandler(auth));
router.use('/auth', AuthRoutes);
router.use('/listings', ListingRoutes);
router.use('/bookings', BookingRoutes);
console.log('Booking routes registered');
router.use('/payments', PaymentRoutes);
router.use('/dashboard', DashboardRoutes);

export default router;