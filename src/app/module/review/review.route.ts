import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { ReviewController } from './review.controller';

const router = Router();

// Public
router.get('/listing/:listingId', ReviewController.getReviewsByListing);

// Student / Tenant
router.post('/', checkAuth(Role.STUDENT, Role.TENANT), ReviewController.createReview);
router.get('/my-reviews', checkAuth(Role.STUDENT, Role.TENANT), ReviewController.getMyReviews);
router.patch('/:id', checkAuth(Role.STUDENT, Role.TENANT), ReviewController.updateReview);
// Allow ADMIN as well for delete
router.delete('/:id', checkAuth(Role.STUDENT, Role.TENANT, Role.ADMIN), ReviewController.deleteReview);

export const ReviewRoutes = router;