import status from 'http-status';
import { ListingStatus } from '../../../generated';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { IRequestUser } from '../../interface/requestUser.interface';
import {
  ICreateListingPayload,
  IListingFilterPayload,
  IUpdateListingPayload,
} from './listing.interface';

// ─── Create Listing (Owner) ───────────────────────────────────────────────────
const createListing = async (
  payload: ICreateListingPayload,
  images: string[],
  user: IRequestUser,
) => {
  const listing = await prisma.listing.create({
    data: {
      ...payload,
      ownerId: user.userId,
      images: {
        create: images.map((url) => ({ url })),
      },
    },
    include: {
      images: true,
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return listing;
};

// ─── Get All Approved Listings (Public) ───────────────────────────────────────
const getAllListings = async (filters: IListingFilterPayload) => {
  const {
    type,
    area,
    city,
    minPrice,
    maxPrice,
    isAvailable,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
  } = filters;

  const pageNumber = page || 1;
  const pageSize = limit || 10;
  const skip = (pageNumber - 1) * pageSize;

  const where: any = {
    status: 'APPROVED',
    isDeleted: false,
    ...(type && { type }),
    ...(area && { area: { contains: area, mode: 'insensitive' } }),
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
    ...(minPrice && { price: { gte: minPrice } }),
    ...(maxPrice && { price: { lte: maxPrice } }),
    ...(isAvailable !== undefined && { isAvailable }),
    // Search by title or description or address
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const orderBy: any = sortBy
    ? { [sortBy]: sortOrder || 'asc' }
    : { createdAt: 'desc' };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        images: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.listing.count({ where }),
  ]);

  // Average rating calculate করো
  const listingsWithRating = listings.map((listing) => {
    const ratings = listing.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : 0;

    return {
      ...listing,
      avgRating,
      totalReviews: ratings.length,
      reviews: undefined,
    };
  });

  return {
    listings: listingsWithRating,
    meta: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

// ─── Get Single Listing ───────────────────────────────────────────────────────
const getSingleListing = async (id: string) => {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      images: true,
      owner: {
        select: { id: true, name: true, email: true },
      },
      reviews: {
        include: {
          student: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  return listing;
};

// ─── Get Owner's Own Listings ─────────────────────────────────────────────────
const getMyListings = async (user: IRequestUser) => {
  const listings = await prisma.listing.findMany({
    where: {
      ownerId: user.userId,
      isDeleted: false,
    },
    include: {
      images: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return listings;
};

// ─── Update Listing (Owner) ───────────────────────────────────────────────────
const updateListing = async (
  id: string,
  payload: IUpdateListingPayload,
  user: IRequestUser,
) => {
  const listing = await prisma.listing.findFirst({
    where: { id, isDeleted: false },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  if (listing.ownerId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'You are not authorized to update this listing');
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: payload,
    include: { images: true },
  });

  return updated;
};

// ─── Delete Listing (Owner/Admin) ─────────────────────────────────────────────
const deleteListing = async (id: string, user: IRequestUser) => {
  const listing = await prisma.listing.findFirst({
    where: { id, isDeleted: false },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  if (listing.ownerId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'You are not authorized to delete this listing');
  }

  const deleted = await prisma.listing.update({
    where: { id },
    data: { isDeleted: true },
  });

  return deleted;
};

// ─── Approve Listing (Admin) ──────────────────────────────────────────────────
const approveListing = async (id: string) => {
  const listing = await prisma.listing.findFirst({
    where: { id, isDeleted: false },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  if (listing.status === ListingStatus.APPROVED) {
    throw new AppError(status.BAD_REQUEST, 'Listing is already approved');
  }

  const approved = await prisma.listing.update({
    where: { id },
    data: { status: ListingStatus.APPROVED },
  });

  return approved;
};

// ─── Reject Listing (Admin) ───────────────────────────────────────────────────
const rejectListing = async (id: string) => {
  const listing = await prisma.listing.findFirst({
    where: { id, isDeleted: false },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  const rejected = await prisma.listing.update({
    where: { id },
    data: { status: ListingStatus.REJECTED },
  });

  return rejected;
};

// ─── Get All Listings for Admin ───────────────────────────────────────────────
const getAllListingsForAdmin = async () => {
  const listings = await prisma.listing.findMany({
    where: { isDeleted: false },
    include: {
      images: true,
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return listings;
};

export const ListingService = {
  createListing,
  getAllListings,
  getSingleListing,
  getMyListings,
  updateListing,
  deleteListing,
  approveListing,
  rejectListing,
  getAllListingsForAdmin,
};