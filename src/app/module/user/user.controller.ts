import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { UserService } from './user.service';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    role: req.query.role as string,
    status: req.query.status as string,
    search: req.query.search as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };

  const result = await UserService.getAllUsers(filters);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Users fetched successfully',
    data: result.users,
    meta: result.meta,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const result = await UserService.getSingleUser(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User fetched successfully',
    data: result,
  });
});

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const result = await UserService.blockUser(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User blocked successfully',
    data: result,
  });
});

const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const result = await UserService.unblockUser(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User unblocked successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const result = await UserService.deleteUser(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const blockListing = catchAsync(async (req: Request, res: Response) => {
  const listingId = req.params.id as string;
  const result = await UserService.blockListing(listingId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Listing blocked successfully',
    data: result,
  });
});

export const UserController = {
  getAllUsers,
  getSingleUser,
  blockUser,
  unblockUser,
  deleteUser,
  blockListing,
};