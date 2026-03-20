import { Router } from 'express';
import { Role } from '../../../generated';
import { checkAuth } from '../../middleware/checkAuth';
import { BookingController } from './booking.controller';

const router = Router();

// Admin
router.get('/admin/all', checkAuth(Role.ADMIN), BookingController.getAllBookings);

// Owner
router.get('/owner/requests', checkAuth(Role.OWNER), BookingController.getBookingRequests);
router.patch('/owner/:id/status', checkAuth(Role.OWNER), BookingController.updateBookingStatus);

// Student
router.post('/', checkAuth(Role.STUDENT), BookingController.createBooking);
router.get('/my-bookings', checkAuth(Role.STUDENT), BookingController.getMyBookings);
router.patch('/cancel/:id', checkAuth(Role.STUDENT), BookingController.cancelBooking);

// Common (Student + Owner)
router.get('/:id', checkAuth(Role.STUDENT, Role.OWNER, Role.ADMIN), BookingController.getSingleBooking);

export const BookingRoutes = router;