import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../app/lib/auth';
import { AuthRoutes } from '../app/module/auth/auth.route';
import { ListingRoutes } from '../app/module/listing/listing.route';
import { BookingRoutes } from '../app/module/booking/booking.route';
import { PaymentRoutes } from '../app/module/payment/payment.route';
import { DashboardRoutes } from '../app/module/dashboard/dashboard.route';
import { ReviewRoutes } from '../app/module/review/review.route';
import { UserRoutes } from '../app/module/user/user.route';
import { WishlistRoutes } from '../app/module/wishlist/wishlist.route';
import { SettingsRoutes } from '../app/module/settings/settings.route';

const router = Router();





router.all('/auth/better/{*path}', toNodeHandler(auth));
router.use('/auth', AuthRoutes);
router.use('/listings', ListingRoutes);
router.use('/bookings', BookingRoutes);
router.use('/payments', PaymentRoutes);
router.use('/dashboard', DashboardRoutes);
router.use('/reviews', ReviewRoutes);
router.use('/users', UserRoutes);
router.use('/wishlist', WishlistRoutes);
router.use('/settings', SettingsRoutes);

export default router;