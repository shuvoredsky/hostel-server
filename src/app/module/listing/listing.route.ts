import { Router } from 'express';
import { Role } from '../../../generated/prisma';
import { checkAuth } from '../../middleware/checkAuth';
import { ListingController } from './listing.controller';

const router = Router();


router.get('/', ListingController.getAllListings);
router.get('/:id', ListingController.getSingleListing);

// Owner
router.post('/', checkAuth(Role.OWNER), ListingController.createListing);
router.get('/owner/my-listings', checkAuth(Role.OWNER), ListingController.getMyListings);
router.patch('/:id', checkAuth(Role.OWNER), ListingController.updateListing);
router.delete('/:id', checkAuth(Role.OWNER, Role.ADMIN), ListingController.deleteListing);

// Admin
router.get('/admin/all', checkAuth(Role.ADMIN), ListingController.getAllListingsForAdmin);
router.patch('/:id/approve', checkAuth(Role.ADMIN), ListingController.approveListing);
router.patch('/:id/reject', checkAuth(Role.ADMIN), ListingController.rejectListing);

export const ListingRoutes = router;