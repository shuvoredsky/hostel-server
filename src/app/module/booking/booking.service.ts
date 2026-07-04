import status from 'http-status';
import { BookingStatus } from '../../../generated';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { IRequestUser } from '../../interface/requestUser.interface';
import { ICreateBookingPayload } from './booking.interface';
import { calculatePricing, isGenderAllowed } from '../../utils/pricing';

// ─── Create Booking (Student) ─────────────────────────────────────────────────
const createBooking = async (payload: ICreateBookingPayload, user: IRequestUser) => {
  const { listingId, message, moveInDate, paymentPlan } = payload; // paymentPlan নতুন

  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      isDeleted: false,
      status: 'APPROVED',
      isAvailable: true,
    },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found or not available');
  }

  if (listing.ownerId === user.userId) {
    throw new AppError(status.FORBIDDEN, 'You cannot book your own listing');
  }

  // ─── Gender Preference Check ─────────────────────────────────────────────
  const requester = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!isGenderAllowed(listing.genderPreference, requester?.gender)) {
    throw new AppError(
      status.FORBIDDEN,
      `এই listing শুধুমাত্র ${listing.genderPreference === 'BOYS' ? 'ছেলেদের' : 'মেয়েদের'} জন্য`,
    );
  }

  // ─── Half Monthly চাইলে listing allow করে কিনা check ─────────────────────
  if (paymentPlan === 'HALF_MONTHLY' && !listing.allowHalfMonthlyPay) {
    throw new AppError(status.BAD_REQUEST, 'এই listing এ Half Monthly payment option নেই');
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      listingId,
      studentId: user.userId,
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
    },
  });

  if (existingBooking) {
    throw new AppError(status.BAD_REQUEST, 'You already have an active booking for this listing');
  }

  const alreadyConfirmed = await prisma.booking.findFirst({
  where: {
    listingId,
    status: BookingStatus.CONFIRMED,
  },
});

if (alreadyConfirmed) {
  throw new AppError(status.BAD_REQUEST, 'এই listing টি ইতিমধ্যে বুক হয়ে গেছে এবং আর available নেই');
}

  const booking = await prisma.booking.create({
    data: {
      listingId,
      studentId: user.userId,
      ownerId: listing.ownerId,
      message,
      moveInDate: moveInDate ? new Date(moveInDate) : null,
      paymentPlan: paymentPlan || 'FULL',
    },
    include: {
      listing: { include: { images: true } },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return booking;
};



const addExtraCharge = async (
  bookingId: string,
  payload: { title: string; amount: number; description?: string },
  user: IRequestUser,
) => {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, ownerId: user.userId },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, 'Booking not found');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new AppError(status.BAD_REQUEST, 'Can only add charges to confirmed bookings');
  }

  const charge = await prisma.extraCharge.create({
    data: {
      bookingId,
      title: payload.title,
      amount: payload.amount,
      description: payload.description,
    },
  });

  return charge;
};



// ─── Get My Bookings (Student) ────────────────────────────────────────────────
const getMyBookings = async (user: IRequestUser) => {
  const bookings = await prisma.booking.findMany({
    where: { studentId: user.userId },
    include: {
      listing: {
        include: { images: true },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings;
};

// ─── Get Booking Requests (Owner) ─────────────────────────────────────────────
const getBookingRequests = async (user: IRequestUser) => {
  const bookings = await prisma.booking.findMany({
    where: { ownerId: user.userId },
    include: {
      listing: {
        select: { id: true, title: true, price: true, area: true },
      },
      student: {
        select: { id: true, name: true, email: true, image: true },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings;
};

// ─── Accept or Reject Booking (Owner) ─────────────────────────────────────────
const updateBookingStatus = async (
  bookingId: string,
  newStatus: 'ACCEPTED' | 'REJECTED',
  user: IRequestUser,
) => {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    include: { listing: true },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, 'Booking not found');
  }

  if (booking.ownerId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'You are not authorized to update this booking');
  }

  if (booking.status !== BookingStatus.PENDING) {
    throw new AppError(status.BAD_REQUEST, `Booking is already ${booking.status}`);
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
    include: {
      listing: {
        select: { id: true, title: true, price: true },
      },
      student: {
        select: { id: true, name: true, email: true },
      },
    },
  });

 // ACCEPTED হলে Payment record তৈরি করো
  if (newStatus === BookingStatus.ACCEPTED) {
    const pricing = calculatePricing(booking.listing.price, booking.listing.studentDiscountPercent || 0);

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        studentId: booking.studentId,
        amount: pricing.payableAmount,
        commission: pricing.commission,
        originalAmount: pricing.originalAmount,
        discountPercent: pricing.discountPercent,
        discountAmount: pricing.discountAmount,
      },
    });
  }

  return updated;
};

// ─── Cancel Booking (Student) ─────────────────────────────────────────────────
const cancelBooking = async (bookingId: string, user: IRequestUser) => {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, 'Booking not found');
  }

  if (booking.studentId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'You are not authorized to cancel this booking');
  }

  if (booking.status === BookingStatus.CONFIRMED) {
    throw new AppError(status.BAD_REQUEST, 'Cannot cancel a confirmed booking');
  }

  const cancelled = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  return cancelled;
};

// ─── Get Single Booking ───────────────────────────────────────────────────────
const getSingleBooking = async (bookingId: string, user: IRequestUser) => {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    include: {
      listing: {
        include: { images: true },
      },
      student: {
        select: { id: true, name: true, email: true },
      },
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, 'Booking not found');
  }

  // শুধু student বা owner দেখতে পারবে
  if (booking.studentId !== user.userId && booking.ownerId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'You are not authorized to view this booking');
  }

  return booking;
};

// ─── Get All Bookings (Admin) ─────────────────────────────────────────────────
const getAllBookings = async () => {
  const bookings = await prisma.booking.findMany({
    include: {
      listing: {
        select: { id: true, title: true, price: true, area: true },
      },
      student: {
        select: { id: true, name: true, email: true },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings;
};

export const BookingService = {
  createBooking,
  getMyBookings,
  getBookingRequests,
  updateBookingStatus,
  cancelBooking,
  getSingleBooking,
  getAllBookings,
  addExtraCharge
};