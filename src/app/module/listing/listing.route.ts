import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { listingUpload } from '../../config/multer.config';
import { ListingController } from './listing.controller';

const router = Router();

// Admin routes — specific routes আগে
router.get('/admin/all', checkAuth(Role.ADMIN), ListingController.getAllListingsForAdmin);
router.patch('/admin/:id/approve', checkAuth(Role.ADMIN), ListingController.approveListing);
router.patch('/admin/:id/reject', checkAuth(Role.ADMIN), ListingController.rejectListing);

// Owner routes
router.post(
  '/',
  checkAuth(Role.OWNER),
  listingUpload.array('images', 5),
  ListingController.createListing,
);
router.get('/owner/my-listings', checkAuth(Role.OWNER), ListingController.getMyListings);
router.patch(
  '/owner/:id',
  checkAuth(Role.OWNER),
  listingUpload.array('images', 5),
  ListingController.updateListing,
);
router.delete('/owner/:id', checkAuth(Role.OWNER, Role.ADMIN), ListingController.deleteListing);

// Public routes — dynamic routes সবার শেষে
router.get('/', ListingController.getAllListings);
router.get('/:id', ListingController.getSingleListing);

export const ListingRoutes = router;