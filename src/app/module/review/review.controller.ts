import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { ReviewService } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ReviewService.createReview(req.body, user);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Review submitted successfully',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const reviewId = req.params.id as string;
  const user = (req as any).user;
  const result = await ReviewService.updateReview(reviewId, req.body, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const reviewId = req.params.id as string;
  const user = (req as any).user;
  const result = await ReviewService.deleteReview(reviewId, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

const getReviewsByListing = catchAsync(async (req: Request, res: Response) => {
  const listingId = req.params.listingId as string;
  const result = await ReviewService.getReviewsByListing(listingId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Reviews fetched successfully',
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ReviewService.getMyReviews(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'My reviews fetched successfully',
    data: result,
  });
});

export const ReviewController = {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByListing,
  getMyReviews,
};