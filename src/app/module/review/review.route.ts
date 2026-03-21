import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { ReviewController } from './review.controller';

const router = Router();

// Public
router.get('/listing/:listingId', ReviewController.getReviewsByListing);

// Student
router.post('/', checkAuth(Role.STUDENT), ReviewController.createReview);
router.get('/my-reviews', checkAuth(Role.STUDENT), ReviewController.getMyReviews);
router.patch('/:id', checkAuth(Role.STUDENT), ReviewController.updateReview);
router.delete('/:id', checkAuth(Role.STUDENT, Role.ADMIN), ReviewController.deleteReview);

export const ReviewRoutes = router;