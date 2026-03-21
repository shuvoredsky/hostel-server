import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { WishlistController } from './wishlist.controller';

const router = Router();

// Student
router.post(
  '/toggle/:listingId',
  checkAuth(Role.STUDENT),
  WishlistController.toggleWishlist,
);
router.get(
  '/my-wishlist',
  checkAuth(Role.STUDENT),
  WishlistController.getMyWishlist,
);
router.get(
  '/status/:listingId',
  checkAuth(Role.STUDENT),
  WishlistController.checkWishlistStatus,
);

// Public — listing এ কতজন wishlist এ রেখেছে
router.get(
  '/count/:listingId',
  WishlistController.getListingWishlistCount,
);

export const WishlistRoutes = router;