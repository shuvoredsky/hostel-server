import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../app/lib/auth';
import { AuthRoutes } from '../app/module/auth/auth.route';
import { ListingRoutes } from '../app/module/listing/listing.route';
import { BookingRoutes } from '../app/module/booking/booking.route';

const router = Router();


router.all('/auth/better/{*path}', toNodeHandler(auth));
router.use('/auth', AuthRoutes);
router.use('/listings', ListingRoutes);
router.use('/bookings', BookingRoutes);

export default router;