import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { ListingService } from './listing.service';

// ─── Create Listing ───────────────────────────────────────────────────────────
const createListing = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const images = (req.files as Express.Multer.File[])?.map((file) => file.path) || [];
  const user = (req as any).user;

  const payload = {
    ...body,
    price: Number(body.price),
    totalRooms: body.totalRooms ? Number(body.totalRooms) : undefined,
    totalSeats: body.totalSeats ? Number(body.totalSeats) : undefined,
  };

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
  const result = await ListingService.updateListing(id, req.body, user);

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