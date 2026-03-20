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
  const { type, area, city, minPrice, maxPrice, isAvailable } = filters;

  const listings = await prisma.listing.findMany({
    where: {
      status: ListingStatus.APPROVED,
      isDeleted: false,
      ...(type && { type }),
      ...(area && { area: { contains: area, mode: 'insensitive' } }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(minPrice && { price: { gte: minPrice } }),
      ...(maxPrice && { price: { lte: maxPrice } }),
      ...(isAvailable !== undefined && { isAvailable }),
    },
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