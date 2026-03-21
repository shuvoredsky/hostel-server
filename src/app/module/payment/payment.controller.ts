import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { PaymentService } from './payment.service';
import { envVars } from '../../../config/env';

// ─── Initiate Payment ─────────────────────────────────────────────────────────
const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;
  const user = (req as any).user;

  const result = await PaymentService.initiatePayment(bookingId, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Payment initiated successfully',
    data: result,
  });
});

// ─── Payment Success ───────────────────────────────────────────────────────────
const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const transactionId = req.params.transactionId as string;
  await PaymentService.paymentSuccess(transactionId);

  // Frontend এ redirect করো
  res.redirect(`${envVars.FRONTEND_URL}/payment/success?transactionId=${transactionId}`);
});

// ─── Payment Fail ──────────────────────────────────────────────────────────────
const paymentFail = catchAsync(async (req: Request, res: Response) => {
  const transactionId = req.params.transactionId as string;
  await PaymentService.paymentFail(transactionId);

  res.redirect(`${envVars.FRONTEND_URL}/payment/fail?transactionId=${transactionId}`);
});

// ─── Payment Cancel ────────────────────────────────────────────────────────────
const paymentCancel = catchAsync(async (req: Request, res: Response) => {
  const transactionId = req.params.transactionId as string;
  await PaymentService.paymentCancel(transactionId);

  res.redirect(`${envVars.FRONTEND_URL}/payment/cancel?transactionId=${transactionId}`);
});

// ─── Get My Payments (Student) ─────────────────────────────────────────────────
const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await PaymentService.getMyPayments(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'My payments fetched successfully',
    data: result,
  });
});



const getOwnerPayments = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await PaymentService.getOwnerPayments(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Owner payments fetched successfully',
    data: result,
  });
});

// ─── Get All Payments (Admin) ──────────────────────────────────────────────────
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAllPayments();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'All payments fetched successfully',
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getMyPayments,
  getAllPayments,
  getOwnerPayments,
};