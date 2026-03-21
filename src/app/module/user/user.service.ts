import status from 'http-status';
import { UserStatus } from '../../../generated';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
const getAllUsers = async (filters: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { role, status: userStatus, search, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
    ...(role && { role }),
    ...(userStatus && { status: userStatus }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        image: true,
        isDeleted: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            studentBookings: true,
            ownerBookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Get Single User (Admin) ──────────────────────────────────────────────────
const getSingleUser = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      listings: {
        where: { isDeleted: false },
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          area: true,
          price: true,
          createdAt: true,
        },
      },
      studentBookings: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          listing: {
            select: { title: true, area: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  return user;
};

// ─── Block User (Admin) ───────────────────────────────────────────────────────
const blockUser = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(status.FORBIDDEN, 'Cannot block an admin user');
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(status.BAD_REQUEST, 'User is already blocked');
  }

  // User block করো
  const blocked = await prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.BLOCKED },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  // Owner block হলে তার সব listing hide করো
  if (user.role === 'OWNER') {
    await prisma.listing.updateMany({
      where: { ownerId: userId, isDeleted: false },
      data: { isAvailable: false },
    });
  }

  // সব active session delete করো
  await prisma.session.deleteMany({
    where: { userId },
  });

  return blocked;
};

// ─── Unblock User (Admin) ─────────────────────────────────────────────────────
const unblockUser = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  if (user.status !== UserStatus.BLOCKED) {
    throw new AppError(status.BAD_REQUEST, 'User is not blocked');
  }

  const unblocked = await prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.ACTIVE },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  // Owner unblock হলে তার approved listings আবার available করো
  if (user.role === 'OWNER') {
    await prisma.listing.updateMany({
      where: { ownerId: userId, status: 'APPROVED', isDeleted: false },
      data: { isAvailable: true },
    });
  }

  return unblocked;
};

// ─── Delete User (Admin) ──────────────────────────────────────────────────────
const deleteUser = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(status.FORBIDDEN, 'Cannot delete an admin user');
  }

  // Soft delete
  const deleted = await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: UserStatus.DELETED,
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  // Owner delete হলে তার সব listing hide করো
  if (user.role === 'OWNER') {
    await prisma.listing.updateMany({
      where: { ownerId: userId },
      data: { isDeleted: true },
    });
  }

  // সব active session delete করো
  await prisma.session.deleteMany({
    where: { userId },
  });

  return deleted;
};

// ─── Block Listing (Admin) ────────────────────────────────────────────────────
const blockListing = async (listingId: string) => {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, isDeleted: false },
  });

  if (!listing) {
    throw new AppError(status.NOT_FOUND, 'Listing not found');
  }

  const blocked = await prisma.listing.update({
    where: { id: listingId },
    data: {
      status: 'REJECTED',
      isAvailable: false,
    },
    select: {
      id: true,
      title: true,
      status: true,
      owner: { select: { name: true, email: true } },
    },
  });

  return blocked;
};

export const UserService = {
  getAllUsers,
  getSingleUser,
  blockUser,
  unblockUser,
  deleteUser,
  blockListing,
};