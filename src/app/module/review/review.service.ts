import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { IRequestUser } from '../../interface/requestUser.interface';
import { ICreateReviewPayload } from './review.interface';

// ─── Create Review (Student) ──────────────────────────────────────────────────
const createReview = async (payload: ICreateReviewPayload, user: IRequestUser) => {
  const { listingId, rating, comment } = payload;

  // Listing আছে কিনা check
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, isDeleted: false, status: 'APPROVED' },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  // Student এই listing এ confirmed booking আছে কিনা check
  const confirmedBooking = await prisma.booking.findFirst({
    where: {
      listingId,
      studentId: user.userId,
      status: 'CONFIRMED',
    },
  });

  if (!confirmedBooking) {
    throw new AppError(
      status.FORBIDDEN,
      'You can only review listings you have confirmed bookings for',
    );
  }

  // আগে review দিয়েছে কিনা check
  const existingReview = await prisma.review.findFirst({
    where: { listingId, studentId: user.userId },
  });

  if (existingReview) {
    throw new AppError(status.BAD_REQUEST, 'You have already reviewed this listing');
  }

  const review = await prisma.review.create({
    data: {
      listingId,
      studentId: user.userId,
      rating,
      comment,
    },
    include: {
      student: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return review;
};

// ─── Update Review (Student) ──────────────────────────────────────────────────
const updateReview = async (
  reviewId: string,
  payload: { rating?: number; comment?: string },
  user: IRequestUser,
) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError(status.NOT_FOUND, 'Review not found');
  }

  if (review.studentId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'You can only update your own review');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: payload,
    include: {
      student: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return updated;
};

// ─── Delete Review (Student/Admin) ────────────────────────────────────────────
const deleteReview = async (reviewId: string, user: IRequestUser) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError(status.NOT_FOUND, 'Review not found');
  }

  if (review.studentId !== user.userId && user.role !== 'ADMIN') {
    throw new AppError(status.FORBIDDEN, 'You are not authorized to delete this review');
  }

  await prisma.review.delete({ where: { id: reviewId } });

  return { message: 'Review deleted successfully' };
};

// ─── Get Reviews By Listing ───────────────────────────────────────────────────
const getReviewsByListing = async (listingId: string) => {
  const reviews = await prisma.review.findMany({
    where: { listingId },
    include: {
      student: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const ratings = reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : 0;

  return {
    reviews,
    avgRating,
    totalReviews: reviews.length,
    ratingBreakdown: {
      5: ratings.filter((r) => r === 5).length,
      4: ratings.filter((r) => r === 4).length,
      3: ratings.filter((r) => r === 3).length,
      2: ratings.filter((r) => r === 2).length,
      1: ratings.filter((r) => r === 1).length,
    },
  };
};

// ─── Get My Reviews (Student) ─────────────────────────────────────────────────
const getMyReviews = async (user: IRequestUser) => {
  const reviews = await prisma.review.findMany({
    where: { studentId: user.userId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          area: true,
          images: { take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reviews;
};

export const ReviewService = {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByListing,
  getMyReviews,
};