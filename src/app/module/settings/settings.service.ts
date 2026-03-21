import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import status from 'http-status';

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
  title?: string;
  order?: number;
}) => {
  const banner = await prisma.siteBanner.create({
    data: {
      imageUrl: payload.imageUrl,
      title: payload.title,
      order: payload.order || 0,
    },
  });

  return banner;
};

// ─── Update Banner ────────────────────────────────────────────────────────────
const updateBanner = async (
  bannerId: string,
  payload: { title?: string; isActive?: boolean; order?: number },
) => {
  const banner = await prisma.siteBanner.findFirst({
    where: { id: bannerId },
  });

  if (!banner) {
    throw new AppError(status.NOT_FOUND, 'Banner not found');
  }

  return await prisma.siteBanner.update({
    where: { id: bannerId },
    data: payload,
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