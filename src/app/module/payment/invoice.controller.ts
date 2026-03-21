import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { InvoiceService } from './invoice.service';

const downloadInvoice = catchAsync(async (req: Request, res: Response) => {
  const paymentId = req.params.paymentId as string;
  const user = (req as any).user;

  await InvoiceService.generateInvoicePDF(paymentId, user.userId, res);
});

export const InvoiceController = {
  downloadInvoice,
};