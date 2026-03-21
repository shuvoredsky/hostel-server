import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { WishlistService } from './wishlist.service';

const toggleWishlist = catchAsync(async (req: Request, res: Response) => {
  const listingId = req.params.listingId as string;
  const user = (req as any).user;
  const result = await WishlistService.toggleWishlist(listingId, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyWishlist = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WishlistService.getMyWishlist(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Wishlist fetched successfully',
    data: result,
  });
});

const checkWishlistStatus = catchAsync(async (req: Request, res: Response) => {
  const listingId = req.params.listingId as string;
  const user = (req as any).user;
  const result = await WishlistService.checkWishlistStatus(listingId, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Wishlist status fetched',
    data: result,
  });
});

const getListingWishlistCount = catchAsync(async (req: Request, res: Response) => {
  const listingId = req.params.listingId as string;
  const result = await WishlistService.getListingWishlistCount(listingId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Wishlist count fetched',
    data: result,
  });
});

export const WishlistController = {
  toggleWishlist,
  getMyWishlist,
  checkWishlistStatus,
  getListingWishlistCount,
};