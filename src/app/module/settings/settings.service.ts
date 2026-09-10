import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import status from 'http-status';
import { BannerMediaType } from '../../../generated';

// ─── Get Site Settings ────────────────────────────────────────────────────────
const getSiteSettings = async () => {
  const [settings, banners] = await Promise.all([
    prisma.siteSettings.findFirst(),
    prisma.siteBanner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ]);

  return { settings, banners };
};

// ─── Update Logo ──────────────────────────────────────────────────────────────
const updateLogo = async (logoUrl: string) => {
  const existing = await prisma.siteSettings.findFirst();

  if (existing) {
    return await prisma.siteSettings.update({
      where: { id: existing.id },
      data: { logoUrl },
    });
  }

  return await prisma.siteSettings.create({
    data: { logoUrl },
  });
};

// ─── Add Banner ───────────────────────────────────────────────────────────────
const addBanner = async (payload: {
  imageUrl: string;
  videoUrl?: string | null;
  mediaType?: BannerMediaType;
  title?: string;
  order?: number;
}) => {
  const mediaType = payload.mediaType || BannerMediaType.IMAGE;
  if (mediaType === BannerMediaType.VIDEO && !payload.videoUrl) {
    throw new AppError(status.BAD_REQUEST, 'Video file or URL is required for video banners');
  }

  const banner = await prisma.siteBanner.create({
    data: {
      imageUrl: payload.imageUrl,
      videoUrl: mediaType === BannerMediaType.VIDEO ? payload.videoUrl : null,
      mediaType,
      title: payload.title,
      order: payload.order || 0,
    },
  });

  return banner;
};

// ─── Update Banner ────────────────────────────────────────────────────────────
const updateBanner = async (
  bannerId: string,
  payload: {
    title?: string;
    isActive?: boolean;
    order?: number;
    mediaType?: BannerMediaType;
    imageUrl?: string;
    videoUrl?: string | null;
  },
) => {
  const banner = await prisma.siteBanner.findFirst({
    where: { id: bannerId },
  });

  if (!banner) {
    throw new AppError(status.NOT_FOUND, 'Banner not found');
  }

  const mediaType = payload.mediaType ?? banner.mediaType;
  const videoUrl = payload.videoUrl !== undefined ? payload.videoUrl : banner.videoUrl;

  if (mediaType === BannerMediaType.VIDEO && !videoUrl) {
    throw new AppError(status.BAD_REQUEST, 'Video URL is required for video banners');
  }

  return await prisma.siteBanner.update({
    where: { id: bannerId },
    data: {
      ...payload,
      videoUrl: mediaType === BannerMediaType.VIDEO ? videoUrl : null,
      mediaType,
    },
  });
};

// ─── Delete Banner ────────────────────────────────────────────────────────────
const deleteBanner = async (bannerId: string) => {
  const banner = await prisma.siteBanner.findFirst({
    where: { id: bannerId },
  });

  if (!banner) {
    throw new AppError(status.NOT_FOUND, 'Banner not found');
  }

  await prisma.siteBanner.delete({ where: { id: bannerId } });

  return { message: 'Banner deleted successfully' };
};

// ─── Reorder Banners ──────────────────────────────────────────────────────────
const reorderBanners = async (bannerOrders: { id: string; order: number }[]) => {
  await Promise.all(
    bannerOrders.map((item) =>
      prisma.siteBanner.update({
        where: { id: item.id },
        data: { order: item.order },
      }),
    ),
  );

  return { message: 'Banners reordered successfully' };
};

export const SettingsService = {
  getSiteSettings,
  updateLogo,
  addBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
};