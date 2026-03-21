import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { DashboardService } from './dashboard.service';

const getAdminDashboard = catchAsync(async (req: Request, res: Response) => {
  const range = (req.query.range as string) || 'all';

  const validRanges = ['daily', 'weekly', 'monthly', 'yearly', 'all'];
  const selectedRange = validRanges.includes(range) ? range : 'all';

  const result = await DashboardService.getAdminDashboard(selectedRange as any);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Admin dashboard fetched successfully',
    data: result,
  });
});

export const DashboardController = {
  getAdminDashboard,
};
