import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { SettingsService } from './settings.service';

const getSiteSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.getSiteSettings();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Site settings fetched successfully',
    data: result,
  });
});

const updateLogo = catchAsync(async (req: Request, res: Response) => {
  const logoUrl = (req.file as any)?.path;

  if (!logoUrl) {
    return sendResponse(res, {
      httpStatusCode: status.BAD_REQUEST,
      success: false,
      message: 'Logo image is required',
    });
  }

  const result = await SettingsService.updateLogo(logoUrl);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Logo updated successfully',
    data: result,
  });
});

const addBanner = catchAsync(async (req: Request, res: Response) => {
  const imageUrl = (req.file as any)?.path || req.body.imageUrl;

  if (!imageUrl) {
    return sendResponse(res, {
      httpStatusCode: status.BAD_REQUEST,
      success: false,
      message: 'Banner image is required',
    });
  }

  const mediaType = req.body.mediaType || 'IMAGE';
  const videoUrl = req.body.videoUrl || null;

  const result = await SettingsService.addBanner({
    imageUrl,
    videoUrl,
    mediaType,
    title: req.body.title,
    order: req.body.order ? Number(req.body.order) : undefined,
  });

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Banner added successfully',
    data: result,
  });
});

const addVideoBanner = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const bannerFile = files?.['banner']?.[0];
  const videoFile = files?.['video']?.[0];

  const imageUrl = bannerFile?.path || (req.file as any)?.path || req.body.imageUrl;
  const videoUrl = videoFile?.path || req.body.videoUrl;

  if (!imageUrl) {
    return sendResponse(res, {
      httpStatusCode: status.BAD_REQUEST,
      success: false,
      message: 'Poster/thumbnail image is required for video banner',
    });
  }

  if (!videoUrl) {
    return sendResponse(res, {
      httpStatusCode: status.BAD_REQUEST,
      success: false,
      message: 'Video file is required for video banner',
    });
  }

  const result = await SettingsService.addBanner({
    imageUrl,
    videoUrl,
    mediaType: 'VIDEO' as any,
    title: req.body.title,
    order: req.body.order ? Number(req.body.order) : undefined,
  });

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Video banner added successfully',
    data: result,
  });
});

const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const bannerId = req.params.id as string;
  const result = await SettingsService.updateBanner(bannerId, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Banner updated successfully',
    data: result,
  });
});

const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  const bannerId = req.params.id as string;
  const result = await SettingsService.deleteBanner(bannerId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Banner deleted successfully',
    data: result,
  });
});

const reorderBanners = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.reorderBanners(req.body.banners);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Banners reordered successfully',
    data: result,
  });
});

export const SettingsController = {
  getSiteSettings,
  updateLogo,
  addBanner,
  addVideoBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
};