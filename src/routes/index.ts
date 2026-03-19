import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../app/lib/auth';
import { AuthRoutes } from '../app/module/auth/auth.route';
import { ListingRoutes } from '../app/module/listing/listing.route';

const router = Router();


router.all('/auth/better/{*path}', toNodeHandler(auth));
router.use('/auth', AuthRoutes);
router.use('/listings', ListingRoutes);

export default router;