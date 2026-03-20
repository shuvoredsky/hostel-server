import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { BookingService } from './booking.service';

// ─── Create Booking ───────────────────────────────────────────────────────────
const createBooking = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await BookingService.createBooking(req.body, user);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Booking request sent successfully',
    data: result,
  });
});

// ─── Get My Bookings (Student) ────────────────────────────────────────────────
const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await BookingService.getMyBookings(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'My bookings fetched successfully',
    data: result,
  });
});

// ─── Get Booking Requests (Owner) ─────────────────────────────────────────────
const getBookingRequests = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await BookingService.getBookingRequests(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Booking requests fetched successfully',
    data: result,
  });
});

// ─── Accept or Reject Booking (Owner) ─────────────────────────────────────────
const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id as string;
  const user = (req as any).user;
  const { status: newStatus } = req.body;

  const result = await BookingService.updateBookingStatus(bookingId, newStatus, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: `Booking ${newStatus.toLowerCase()} successfully`,
    data: result,
  });
});

// ─── Cancel Booking (Student) ─────────────────────────────────────────────────
const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id as string;
  const user = (req as any).user;
  const result = await BookingService.cancelBooking(bookingId, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Booking cancelled successfully',
    data: result,
  });
});

// ─── Get Single Booking ───────────────────────────────────────────────────────
const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id as string;
  const user = (req as any).user;
  const result = await BookingService.getSingleBooking(bookingId, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Booking fetched successfully',
    data: result,
  });
});

// ─── Get All Bookings (Admin) ─────────────────────────────────────────────────
const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.getAllBookings();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'All bookings fetched successfully',
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getMyBookings,
  getBookingRequests,
  updateBookingStatus,
  cancelBooking,
  getSingleBooking,
  getAllBookings,
};