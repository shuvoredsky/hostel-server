import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { ICreateListingPayload, IUpdateListingPayload } from './listing.interface';
import { ListingService } from './listing.service';

const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
};

const parseOptionalBoolean = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true';
};

const parseOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const parseAmenities = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;

  const normalizeArray = (items: unknown[]) =>
    items
      .flatMap((item) => parseAmenities(item) || [])
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  if (Array.isArray(value)) return normalizeArray(value);

  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return normalizeArray(parsed);
  } catch {
    // Fall back to comma-separated or single form field values.
  }

  return trimmed.includes(',')
    ? trimmed.split(',').map((item) => item.trim()).filter(Boolean)
    : [trimmed];
};

const normalizeListingPayload = (body: Record<string, unknown>) => ({
  ...body,
  title: body.title as string,
  description: body.description as string,
  type: body.type as string,
  address: body.address as string,
  area: body.area as string,
  price: parseOptionalNumber(body.price),
  totalRooms: parseOptionalNumber(body.totalRooms),
  totalSeats: parseOptionalNumber(body.totalSeats),
  studentDiscountPercent: parseOptionalNumber(body.studentDiscountPercent),
  allowHalfMonthlyPay: parseOptionalBoolean(body.allowHalfMonthlyPay),
  isAvailable: parseOptionalBoolean(body.isAvailable),
  amenities: parseAmenities(body.amenities),
  gasType: parseOptionalString(body.gasType),
  nearbyType: parseOptionalString(body.nearbyType),
  nearbyName: parseOptionalString(body.nearbyName),
  googleMapsLink: parseOptionalString(body.googleMapsLink),
});

// ─── Create Listing ───────────────────────────────────────────────────────────
const createListing = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const images = (req.files as Express.Multer.File[])?.map((file) => file.path) || [];
  const user = (req as any).user;

const payload = normalizeListingPayload(body) as ICreateListingPayload;

  const result = await ListingService.createListing(payload, images, user);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Listing created successfully. Waiting for admin approval.',
    data: result,
  });
});

// ─── Get All Listings (Public) ────────────────────────────────────────────────
const getAllListings = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const filters = {
    type: req.query.type as any,
    area: req.query.area as string,
    city: req.query.city as string,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    isAvailable: req.query.isAvailable ? req.query.isAvailable === 'true' : undefined,
    search: req.query.search as string,
    sortBy: req.query.sortBy as any,
    sortOrder: req.query.sortOrder as any,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    studentId: user?.userId,
    genderPreference: req.query.genderPreference as any,
  hasDiscount: req.query.hasDiscount === 'true',             
  };

  const result = await ListingService.getAllListings(filters);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Listings fetched successfully',
    data: result.listings,
    meta: result.meta,
  });
});

// ─── Get Single Listing ───────────────────────────────────────────────────────
const getSingleListing = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ListingService.getSingleListing(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Listing fetched successfully',
    data: result,
  });
});

// ─── Get My Listings (Owner) ──────────────────────────────────────────────────
const getMyListings = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ListingService.getMyListings(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'My listings fetched successfully',
    data: result,
  });
});

// ─── Update Listing ───────────────────────────────────────────────────────────
const updateListing = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = (req as any).user;
  const payload = normalizeListingPayload(req.body) as IUpdateListingPayload;
  const result = await ListingService.updateListing(id, payload, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Listing updated successfully',
    data: result,
  });
});

// ─── Delete Listing ───────────────────────────────────────────────────────────
const deleteListing = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = (req as any).user;
  const result = await ListingService.deleteListing(id, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Listing deleted successfully',
    data: result,
  });
});

// ─── Approve Listing (Admin) ──────────────────────────────────────────────────
const approveListing = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ListingService.approveListing(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Listing approved successfully',
    data: result,
  });
});

// ─── Reject Listing (Admin) ───────────────────────────────────────────────────
const rejectListing = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ListingService.rejectListing(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Listing rejected successfully',
    data: result,
  });
});

// ─── Get All Listings for Admin ───────────────────────────────────────────────
const getAllListingsForAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await ListingService.getAllListingsForAdmin();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'All listings fetched successfully',
    data: result,
  });
});

export const ListingController = {
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
