import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { IRequestUser } from '../../interface/requestUser.interface';

// ─── Toggle Wishlist ──────────────────────────────────────────────────────────
const toggleWishlist = async (listingId: string, user: IRequestUser) => {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, isDeleted: false, status: 'APPROVED' },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  // আগে wishlist এ আছে কিনা check
  const existing = await prisma.wishlist.findUnique({
    where: {
      studentId_listingId: {
        studentId: user.userId,
        listingId,
      },
    },
  });

  if (existing) {
    // থাকলে remove করো
    await prisma.wishlist.delete({
      where: {
        studentId_listingId: {
          studentId: user.userId,
          listingId,
        },
      },
    });

    return { wishlisted: false, message: 'Removed from wishlist' };
  } else {
    // না থাকলে add করো
    await prisma.wishlist.create({
      data: {
        studentId: user.userId,
        listingId,
      },
    });

    return { wishlisted: true, message: 'Added to wishlist' };
  }
};

// ─── Get My Wishlist ──────────────────────────────────────────────────────────
const getMyWishlist = async (user: IRequestUser) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { studentId: user.userId },
    include: {
      listing: {
        include: {
          images: { take: 1 },
          owner: {
            select: { id: true, name: true, email: true },
          },
          reviews: {
            select: { rating: true },
          },
          wishlists: {
            where: { studentId: user.userId },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Average rating calculate করো
  const wishlistWithRating = wishlist.map((w) => {
    const ratings = w.listing.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : 0;

    return {
      wishlistId: w.id,
      addedAt: w.createdAt,
      listing: {
        ...w.listing,
        avgRating,
        totalReviews: ratings.length,
        isWishlisted: true,
        reviews: undefined,
        wishlists: undefined,
      },
    };
  });

  return wishlistWithRating;
};

// ─── Check Wishlist Status ────────────────────────────────────────────────────
const checkWishlistStatus = async (listingId: string, user: IRequestUser) => {
  const existing = await prisma.wishlist.findUnique({
    where: {
      studentId_listingId: {
        studentId: user.userId,
        listingId,
      },
    },
  });

  return { isWishlisted: !!existing };
};

// ─── Get Wishlist Count for Listing (Owner/Admin) ─────────────────────────────
const getListingWishlistCount = async (listingId: string) => {
  const count = await prisma.wishlist.count({
    where: { listingId },
  });

  return { listingId, wishlistCount: count };
};

export const WishlistService = {
  toggleWishlist,
  getMyWishlist,
  checkWishlistStatus,
  getListingWishlistCount,
};