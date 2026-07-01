import { Request, Response } from 'express';
import status from 'http-status';
import { StudentVerificationStatus } from '../../../generated';
import AppError from '../../errorHelpers/AppError';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { VerificationService } from './verification.service';

const submitVerification = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const file = req.file as Express.Multer.File;

  if (!file) {
    throw new AppError(status.BAD_REQUEST, 'Student ID card image আপলোড করা আবশ্যক');
  }

  const result = await VerificationService.submitVerification(
    user.userId,
    req.body,
    file.path, // cloudinary url multer-storage-cloudinary দিয়ে file.path তে আসে
  );

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Verification request পাঠানো হয়েছে, Admin review করার পর জানানো হবে',
    data: result,
  });
});

const getMyVerification = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await VerificationService.getMyVerification(user.userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Verification status fetched successfully',
    data: result,
  });
});

const getAllVerifications = catchAsync(async (req: Request, res: Response) => {
  const statusFilter = req.query.status as StudentVerificationStatus | undefined;
  const result = await VerificationService.getAllVerifications(statusFilter);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Verifications fetched successfully',
    data: result,
  });
});

const approveVerification = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const verificationId = req.params.id as string;
  const result = await VerificationService.approveVerification(verificationId, user.userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Student verified হয়েছে',
    data: result,
  });
});

const rejectVerification = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const verificationId = req.params.id as string;
  const result = await VerificationService.rejectVerification(verificationId, user.userId, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Verification reject করা হয়েছে',
    data: result,
  });
});

export const VerificationController = {
  submitVerification,
  getMyVerification,
  getAllVerifications,
  approveVerification,
  rejectVerification,
};