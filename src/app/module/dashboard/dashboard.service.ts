import { prisma } from '../../lib/prisma';

type DateRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

const getDateRange = (range: DateRange) => {
  const now = new Date();
  const start = new Date();

  switch (range) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
    default:
      return {};
  }

  return { gte: start, lte: now };
};

const getAdminDashboard = async (range: DateRange = 'all') => {
  const dateFilter = getDateRange(range);
  const createdAtFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
  const paidAtFilter = Object.keys(dateFilter).length ? { paidAt: dateFilter } : {};

  // ─── Overview Stats ───────────────────────────────────────────────────────
  const [
    totalUsers,
    totalStudents,
    totalOwners,
    totalListings,
    totalBookings,
    totalPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { isDeleted: false, ...createdAtFilter } }),
    prisma.user.count({ where: { role: 'STUDENT', isDeleted: false, ...createdAtFilter } }),
    prisma.user.count({ where: { role: 'OWNER', isDeleted: false, ...createdAtFilter } }),
    prisma.listing.count({ where: { isDeleted: false, ...createdAtFilter } }),
    prisma.booking.count({ where: { ...createdAtFilter } }),
    prisma.payment.count({ where: { ...createdAtFilter } }),
  ]);

  // ─── Listing Stats ────────────────────────────────────────────────────────
  const [pendingListings, approvedListings, rejectedListings] = await Promise.all([
    prisma.listing.count({ where: { status: 'PENDING', isDeleted: false, ...createdAtFilter } }),
    prisma.listing.count({ where: { status: 'APPROVED', isDeleted: false, ...createdAtFilter } }),
    prisma.listing.count({ where: { status: 'REJECTED', isDeleted: false, ...createdAtFilter } }),
  ]);

  const [roomCount, seatCount, bashaCount] = await Promise.all([
    prisma.listing.count({ where: { type: 'ROOM', isDeleted: false, ...createdAtFilter } }),
    prisma.listing.count({ where: { type: 'SEAT', isDeleted: false, ...createdAtFilter } }),
    prisma.listing.count({ where: { type: 'BASHA', isDeleted: false, ...createdAtFilter } }),
  ]);

  // ─── Booking Stats ────────────────────────────────────────────────────────
  const [
    pendingBookings,
    acceptedBookings,
    confirmedBookings,
    rejectedBookings,
    cancelledBookings,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: 'PENDING', ...createdAtFilter } }),
    prisma.booking.count({ where: { status: 'ACCEPTED', ...createdAtFilter } }),
    prisma.booking.count({ where: { status: 'CONFIRMED', ...createdAtFilter } }),
    prisma.booking.count({ where: { status: 'REJECTED', ...createdAtFilter } }),
    prisma.booking.count({ where: { status: 'CANCELLED', ...createdAtFilter } }),
  ]);

  // ─── Bookings By Area ─────────────────────────────────────────────────────
  const bookingsByArea = await prisma.booking.findMany({
    where: { ...createdAtFilter },
    include: {
      listing: { select: { area: true, city: true } },
    },
  });

  const areaStats: Record<string, number> = {};
  bookingsByArea.forEach((booking) => {
    const area = booking.listing.area;
    areaStats[area] = (areaStats[area] || 0) + 1;
  });

  const bookingsByAreaList = Object.entries(areaStats)
    .map(([area, count]) => ({ area, totalBookings: count }))
    .sort((a, b) => b.totalBookings - a.totalBookings);

  // ─── Payment & Commission Stats ───────────────────────────────────────────
  const paidPayments = await prisma.payment.findMany({
    where: { status: 'PAID', ...paidAtFilter },
    select: { amount: true, commission: true },
  });

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = paidPayments.reduce((sum, p) => sum + p.commission, 0);
  const totalPaidCount = paidPayments.length;

  // ─── Commission Per Student ───────────────────────────────────────────────
  const commissionDetails = await prisma.payment.findMany({
    where: { status: 'PAID', ...paidAtFilter },
    include: {
      student: { select: { id: true, name: true, email: true } },
      booking: {
        include: {
          listing: { select: { title: true, area: true, city: true } },
        },
      },
    },
    orderBy: { paidAt: 'desc' },
  });

  const commissionList = commissionDetails.map((p) => ({
    studentName: p.student.name,
    studentEmail: p.student.email,
    listingTitle: p.booking.listing.title,
    area: p.booking.listing.area,
    city: p.booking.listing.city,
    amount: p.amount,
    commission: p.commission,
    paidAt: p.paidAt,
  }));

  // ─── Recent Bookings ──────────────────────────────────────────────────────
  const recentBookings = await prisma.booking.findMany({
    take: 10,
    where: { ...createdAtFilter },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { title: true, area: true, price: true } },
      student: { select: { name: true, email: true } },
      payment: { select: { status: true, amount: true, commission: true } },
    },
  });

  // ─── Recent Payments ──────────────────────────────────────────────────────
  const recentPayments = await prisma.payment.findMany({
    take: 10,
    where: { status: 'PAID', ...paidAtFilter },
    orderBy: { paidAt: 'desc' },
    include: {
      student: { select: { name: true, email: true } },
      booking: {
        include: {
          listing: { select: { title: true, area: true } },
        },
      },
    },
  });

  // ─── Top Owners ───────────────────────────────────────────────────────────
  const topOwners = await prisma.user.findMany({
    where: { role: 'OWNER', isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      ownerBookings: {
        where: { ...createdAtFilter },
        select: { id: true, status: true },
      },
      listings: {
        where: { isDeleted: false, ...createdAtFilter },
        select: { id: true, status: true },
      },
    },
  });

  const topOwnersList = topOwners
    .map((owner) => ({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      totalListings: owner.listings.length,
      approvedListings: owner.listings.filter((l) => l.status === 'APPROVED').length,
      totalBookings: owner.ownerBookings.length,
      confirmedBookings: owner.ownerBookings.filter((b) => b.status === 'CONFIRMED').length,
    }))
    .sort((a, b) => b.totalBookings - a.totalBookings)
    .slice(0, 10);

  return {
    range,
    overview: {
      totalUsers,
      totalStudents,
      totalOwners,
      totalListings,
      totalBookings,
      totalPayments,
    },
    listings: {
      pending: pendingListings,
      approved: approvedListings,
      rejected: rejectedListings,
      byType: {
        room: roomCount,
        seat: seatCount,
        basha: bashaCount,
      },
    },
    bookings: {
      pending: pendingBookings,
      accepted: acceptedBookings,
      confirmed: confirmedBookings,
      rejected: rejectedBookings,
      cancelled: cancelledBookings,
      byArea: bookingsByAreaList,
    },
    payments: {
      totalRevenue,
      totalCommission,
      totalPaidCount,
      commissionDetails: commissionList,
      recentPayments,
    },
    recentBookings,
    topOwners: topOwnersList,
  };
};

export const DashboardService = {
  getAdminDashboard,
};