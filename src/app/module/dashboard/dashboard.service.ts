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
    totalTenants,
    totalListings,
    totalBookings,
    totalPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { isDeleted: false, ...createdAtFilter } }),
    prisma.user.count({ where: { role: 'STUDENT', isDeleted: false, ...createdAtFilter } }),
    prisma.user.count({ where: { role: 'OWNER', isDeleted: false, ...createdAtFilter } }),
     prisma.user.count({ where: { role: 'TENANT', isDeleted: false, ...createdAtFilter } }),
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

  
// ─── Payment & Commission Stats (Full + Half-Monthly Installments) ────────
const [fullPaidPayments, paidInstallments] = await Promise.all([
  prisma.payment.findMany({
    where: { status: 'PAID', booking: { paymentPlan: 'FULL' }, ...paidAtFilter },
    select: { amount: true, commission: true },
  }),
  prisma.paymentInstallment.findMany({
    where: {
      status: 'PAID',
      payment: { booking: { paymentPlan: 'HALF_MONTHLY' } },
      ...(Object.keys(dateFilter).length ? { paidAt: dateFilter } : {}),
    },
    select: { amount: true, commission: true },
  }),
]);

const totalRevenue =
  fullPaidPayments.reduce((sum, p) => sum + p.amount, 0) +
  paidInstallments.reduce((sum, i) => sum + i.amount, 0);

const totalCommission =
  fullPaidPayments.reduce((sum, p) => sum + p.commission, 0) +
  paidInstallments.reduce((sum, i) => sum + i.commission, 0);

const totalPaidCount = fullPaidPayments.length + paidInstallments.length;

// ─── Commission Per Student/Tenant (Full + Installment) ───────────────────
const fullCommissionDetails = await prisma.payment.findMany({
  where: { status: 'PAID', booking: { paymentPlan: 'FULL' }, ...paidAtFilter },
  include: {
    student: { select: { id: true, name: true, email: true } },
    booking: { include: { listing: { select: { title: true, area: true, city: true } } } },
  },
  orderBy: { paidAt: 'desc' },
});

const installmentCommissionDetails = await prisma.paymentInstallment.findMany({
  where: {
    status: 'PAID',
    payment: { booking: { paymentPlan: 'HALF_MONTHLY' } },
    ...(Object.keys(dateFilter).length ? { paidAt: dateFilter } : {}),
  },
  include: {
    payment: {
      include: {
        student: { select: { id: true, name: true, email: true } },
        booking: { include: { listing: { select: { title: true, area: true, city: true } } } },
      },
    },
  },
  orderBy: { paidAt: 'desc' },
});

const commissionList = [
  ...fullCommissionDetails.map((p) => ({
    studentName: p.student.name,
    studentEmail: p.student.email,
    listingTitle: p.booking.listing.title,
    area: p.booking.listing.area,
    city: p.booking.listing.city,
    amount: p.amount,
    commission: p.commission,
    paidAt: p.paidAt,
    isInstallment: false,
  })),
  ...installmentCommissionDetails.map((i) => ({
    studentName: i.payment.student.name,
    studentEmail: i.payment.student.email,
    listingTitle: i.payment.booking.listing.title,
    area: i.payment.booking.listing.area,
    city: i.payment.booking.listing.city,
    amount: i.amount,
    commission: i.commission,
    paidAt: i.paidAt,
    isInstallment: true,
    installmentNo: i.installmentNo,
  })),
].sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime());

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
      totalTenants,
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





const getOwnerDashboard = async (ownerId: string, range: DateRange = 'all') => {
  const dateFilter = getDateRange(range);
  const createdAtFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
  const paidAtFilter = Object.keys(dateFilter).length ? { paidAt: dateFilter } : {};

  // ─── Overview Stats ───────────────────────────────────────────────────────
  const [
    totalListings,
    approvedListings,
    pendingListings,
    rejectedListings,
    totalBookings,
  ] = await Promise.all([
    prisma.listing.count({ where: { ownerId, isDeleted: false } }),
    prisma.listing.count({ where: { ownerId, isDeleted: false, status: 'APPROVED' } }),
    prisma.listing.count({ where: { ownerId, isDeleted: false, status: 'PENDING' } }),
    prisma.listing.count({ where: { ownerId, isDeleted: false, status: 'REJECTED' } }),
    prisma.booking.count({ where: { ownerId, ...createdAtFilter } }),
  ]);

  // ─── Booking Stats ────────────────────────────────────────────────────────
  const [
    pendingBookings,
    acceptedBookings,
    confirmedBookings,
    rejectedBookings,
    cancelledBookings,
  ] = await Promise.all([
    prisma.booking.count({ where: { ownerId, status: 'PENDING', ...createdAtFilter } }),
    prisma.booking.count({ where: { ownerId, status: 'ACCEPTED', ...createdAtFilter } }),
    prisma.booking.count({ where: { ownerId, status: 'CONFIRMED', ...createdAtFilter } }),
    prisma.booking.count({ where: { ownerId, status: 'REJECTED', ...createdAtFilter } }),
    prisma.booking.count({ where: { ownerId, status: 'CANCELLED', ...createdAtFilter } }),
  ]);

  // ─── Listings With Booking Count ──────────────────────────────────────────
  const listingsWithBookings = await prisma.listing.findMany({
    where: { ownerId, isDeleted: false },
    include: {
      images: { take: 1 },
      bookings: {
        where: { ...createdAtFilter },
        include: {
          student: { select: { id: true, name: true, email: true } },
          payment: {
            select: {
              status: true,
              amount: true,
              commission: true,
              paidAt: true,
              installments: {                     
              select: { amount: true, status: true, paidAt: true, commission: true },
            },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // প্রতিটা listing এর জন্য stats
 const listingStats = listingsWithBookings.map((listing) => {
  const bookings = listing.bookings;

  // প্রতিটা booking এর actual paid amount বের করো (Full অথবা Installment থেকে)
  const getPaidAmount = (b: (typeof bookings)[number]) => {
    if (!b.payment) return 0;
    if (b.payment.status === 'PAID') return b.payment.amount;
    // Half-monthly হলে যতটুকু installment paid হয়েছে ততটুকু
    return b.payment.installments
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);
  };


  const getNetEarning = (b: (typeof bookings)[number]) => {
  if (!b.payment) return 0;
  if (b.payment.status === 'PAID') return b.payment.amount - b.payment.commission;
  return b.payment.installments
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + (i.amount - i.commission), 0);
};

  const paidBookings = bookings.filter((b) => getPaidAmount(b) > 0);
  const unpaidBookings = bookings.filter(
    (b) => b.status === 'ACCEPTED' && getPaidAmount(b) === 0,
  );

  return {
    listingId: listing.id,
    title: listing.title,
    type: listing.type,
    area: listing.area,
    city: listing.city,
    price: listing.price,
    status: listing.status,
    isAvailable: listing.isAvailable,
    image: listing.images[0]?.url || null,
    stats: {
      totalApplicants: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      accepted: bookings.filter((b) => b.status === 'ACCEPTED').length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      rejected: bookings.filter((b) => b.status === 'REJECTED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
      paidCount: paidBookings.length,
      unpaidCount: unpaidBookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + getNetEarning(b), 0),
        grossAmount: bookings.reduce((sum, b) => sum + getPaidAmount(b), 0),

    },
    applicants: bookings.map((b) => ({
      bookingId: b.id,
      studentName: b.student.name,
      studentEmail: b.student.email,
      bookingStatus: b.status,
      moveInDate: b.moveInDate,
      paymentStatus: b.payment?.status || 'N/A',
      amount: getPaidAmount(b),   // fix — actual paid দেখাবে, partial হলেও
      paidAt: b.payment?.paidAt || null,
      bookedAt: b.createdAt,
    })),
  };
});

  // ─── Payment Stats ────────────────────────────────────────────────────────
// ─── Payment Stats (Full + Half-Monthly Installments) ─────────────────────
  const allPayments = await prisma.payment.findMany({
    where: {
      booking: { ownerId },
      ...paidAtFilter,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      booking: {
        include: {
          listing: { select: { id: true, title: true, area: true } },
        },
      },
      installments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const fullPaidPayments = allPayments.filter(
    (p) => p.status === 'PAID' && p.booking.paymentPlan === 'FULL',
  );
  const paidInstallmentsFlat = allPayments
    .filter((p) => p.booking.paymentPlan === 'HALF_MONTHLY')
    .flatMap((p) => p.installments.filter((i) => i.status === 'PAID'));

  const unpaidPayments = allPayments.filter(
    (p) => p.status === 'UNPAID' && p.booking.paymentPlan === 'FULL',
  );
  const failedPayments = allPayments.filter((p) => p.status === 'FAILED');

// Owner এর net earning = amount - commission (প্রতিটা transaction থেকে)
const grossRevenue =
  fullPaidPayments.reduce((sum, p) => sum + p.amount, 0) +
  paidInstallmentsFlat.reduce((sum, i) => sum + i.amount, 0);

const totalCommissionDeducted =
  fullPaidPayments.reduce((sum, p) => sum + p.commission, 0) +
  paidInstallmentsFlat.reduce((sum, i) => sum + i.commission, 0);

const totalRevenue = grossRevenue - totalCommissionDeducted; // Owner এর net revenue

  const totalPaidCount = fullPaidPayments.length + paidInstallmentsFlat.length;


  // ─── Unpaid/Pending Payments (payment baki) ───────────────────────────────
  const pendingPaymentsList = unpaidPayments.map((p) => ({
    paymentId: p.id,
    studentName: p.student.name,
    studentEmail: p.student.email,
    listingTitle: p.booking.listing.title,
    area: p.booking.listing.area,
    amount: p.amount,
    bookingDate: p.booking.createdAt,
    daysWaiting: Math.floor(
      (new Date().getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

 // ─── Monthly Payment Breakdown ────────────────────────────────────────────
  const monthlyPayments: Record<string, { paid: number; revenue: number; count: number }> = {};

  const addToMonthly = (paidAt: Date | null, amount: number) => {
    if (!paidAt) return;
    const monthKey = new Date(paidAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!monthlyPayments[monthKey]) {
      monthlyPayments[monthKey] = { paid: 0, revenue: 0, count: 0 };
    }
    monthlyPayments[monthKey].paid += 1;
    monthlyPayments[monthKey].revenue += amount;
    monthlyPayments[monthKey].count += 1;
  };

  fullPaidPayments.forEach((p) => addToMonthly(p.paidAt, p.amount));
  paidInstallmentsFlat.forEach((i) => addToMonthly(i.paidAt, i.amount));

  const monthlyBreakdown = Object.entries(monthlyPayments).map(([month, data]) => ({
    month,
    ...data,
  }));

  // ─── Recent Bookings ──────────────────────────────────────────────────────
  const recentBookings = await prisma.booking.findMany({
    take: 10,
    where: { ownerId, ...createdAtFilter },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { title: true, area: true, price: true } },
      student: { select: { name: true, email: true } },
      payment: { select: { status: true, amount: true, paidAt: true } },
    },
  });

  return {
    range,
    overview: {
      totalListings,
      approvedListings,
      pendingListings,
      rejectedListings,
      totalBookings,
      totalRevenue,
      grossRevenue,
      totalCommissionDeducted,
      totalPaidCount,
      totalUnpaidCount: unpaidPayments.length,
    },
    bookings: {
      pending: pendingBookings,
      accepted: acceptedBookings,
      confirmed: confirmedBookings,
      rejected: rejectedBookings,
      cancelled: cancelledBookings,
    },
    listingStats,
    payments: {
      totalRevenue,
      paidCount: totalPaidCount,
      unpaidCount: unpaidPayments.length,
      failedCount: failedPayments.length,
      pendingPayments: pendingPaymentsList,
      monthlyBreakdown,
    },
    recentBookings,
  };
};




const getStudentDashboard = async (studentId: string, range: DateRange = 'all') => {
  const dateFilter = getDateRange(range);
  const createdAtFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
  const paidAtFilter = Object.keys(dateFilter).length ? { paidAt: dateFilter } : {};

  // ─── Overview Stats ───────────────────────────────────────────────────────
  const [
    totalBookings,
    pendingBookings,
    acceptedBookings,
    confirmedBookings,
    rejectedBookings,
    cancelledBookings,
  ] = await Promise.all([
    prisma.booking.count({ where: { studentId, ...createdAtFilter } }),
    prisma.booking.count({ where: { studentId, status: 'PENDING', ...createdAtFilter } }),
    prisma.booking.count({ where: { studentId, status: 'ACCEPTED', ...createdAtFilter } }),
    prisma.booking.count({ where: { studentId, status: 'CONFIRMED', ...createdAtFilter } }),
    prisma.booking.count({ where: { studentId, status: 'REJECTED', ...createdAtFilter } }),
    prisma.booking.count({ where: { studentId, status: 'CANCELLED', ...createdAtFilter } }),
  ]);

// ─── Payment Stats (Full + Half-Monthly Installments) ─────────────────────
  const allPayments = await prisma.payment.findMany({
    where: { studentId, ...createdAtFilter },
    include: {
      booking: {
        include: {
          listing: { select: { id: true, title: true, area: true, city: true, price: true } },
          extraCharges: true,
        },
      },
      installments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const fullPaidPayments = allPayments.filter(
    (p) => p.status === 'PAID' && p.booking.paymentPlan === 'FULL',
  );
  const fullUnpaidPayments = allPayments.filter(
    (p) => p.status === 'UNPAID' && p.booking.paymentPlan === 'FULL',
  );

  const halfMonthlyPayments = allPayments.filter((p) => p.booking.paymentPlan === 'HALF_MONTHLY');
  const paidInstallmentsFlat = halfMonthlyPayments.flatMap((p) =>
    p.installments.filter((i) => i.status === 'PAID').map((i) => ({ ...i, payment: p })),
  );
  const pendingInstallmentsFlat = halfMonthlyPayments.flatMap((p) =>
    p.installments.filter((i) => i.status === 'PENDING').map((i) => ({ ...i, payment: p })),
  );

  const totalPaid =
    fullPaidPayments.reduce((sum, p) => sum + p.amount, 0) +
    paidInstallmentsFlat.reduce((sum, i) => sum + i.amount, 0);

  const totalUnpaid =
    fullUnpaidPayments.reduce((sum, p) => sum + p.amount, 0) +
    pendingInstallmentsFlat.reduce((sum, i) => sum + i.amount, 0);



  // ─── Monthly Payment Breakdown ────────────────────────────────────────────
const monthlyPayments: Record<string, { paid: number; unpaid: number; paidCount: number; unpaidCount: number }> = {};

  const bump = (date: Date | null, field: 'paid' | 'unpaid', amount: number) => {
    const monthKey = new Date(date || new Date()).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!monthlyPayments[monthKey]) {
      monthlyPayments[monthKey] = { paid: 0, unpaid: 0, paidCount: 0, unpaidCount: 0 };
    }
    monthlyPayments[monthKey][field] += amount;
    monthlyPayments[monthKey][`${field}Count`] += 1;
  };

  fullPaidPayments.forEach((p) => bump(p.paidAt, 'paid', p.amount));
  fullUnpaidPayments.forEach((p) => bump(p.createdAt, 'unpaid', p.amount));
  paidInstallmentsFlat.forEach((i) => bump(i.paidAt, 'paid', i.amount));
  pendingInstallmentsFlat.forEach((i) => bump(i.dueDate, 'unpaid', i.amount));

  const monthlyBreakdown = Object.entries(monthlyPayments).map(([month, data]) => ({
    month,
    ...data,
  }));

  // ─── Paid Payment Details ─────────────────────────────────────────────────
const paidPaymentDetails = [
    ...fullPaidPayments.map((p) => {
      const extraTotal = p.booking.extraCharges.reduce((sum, e) => sum + e.amount, 0);
      return {
        paymentId: p.id,
        transactionId: p.transactionId,
        listingTitle: p.booking.listing.title,
        area: p.booking.listing.area,
        city: p.booking.listing.city,
        baseAmount: p.amount,
        extraCharges: p.booking.extraCharges.map((e) => ({ title: e.title, amount: e.amount, description: e.description })),
        extraTotal,
        totalAmount: p.amount + extraTotal,
        paidAt: p.paidAt,
        isInstallment: false,
      };
    }),
    ...paidInstallmentsFlat.map((i) => ({
      paymentId: i.paymentId,
      transactionId: i.transactionId,
      listingTitle: i.payment.booking.listing.title,
      area: i.payment.booking.listing.area,
      city: i.payment.booking.listing.city,
      baseAmount: i.amount,
      extraCharges: [],
      extraTotal: 0,
      totalAmount: i.amount,
      paidAt: i.paidAt,
      isInstallment: true,
      installmentNo: i.installmentNo,
    })),
  ];

  // ─── Unpaid Payment Details ───────────────────────────────────────────────
const unpaidPaymentDetails = [
    ...fullUnpaidPayments.map((p) => {
      const extraTotal = p.booking.extraCharges.reduce((sum, e) => sum + e.amount, 0);
      const daysWaiting = Math.floor((new Date().getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return {
        paymentId: p.id,
        bookingId: p.bookingId,
        listingTitle: p.booking.listing.title,
        area: p.booking.listing.area,
        city: p.booking.listing.city,
        baseAmount: p.amount,
        extraCharges: p.booking.extraCharges.map((e) => ({ title: e.title, amount: e.amount, description: e.description })),
        extraTotal,
        totalDue: p.amount + extraTotal,
        daysWaiting,
        acceptedAt: p.createdAt,
        isInstallment: false,
      };
    }),
    ...pendingInstallmentsFlat.map((i) => ({
      paymentId: i.paymentId,
      bookingId: i.payment.bookingId,
      listingTitle: i.payment.booking.listing.title,
      area: i.payment.booking.listing.area,
      city: i.payment.booking.listing.city,
      baseAmount: i.amount,
      extraCharges: [],
      extraTotal: 0,
      totalDue: i.amount,
      daysWaiting: i.dueDate
        ? Math.floor((new Date().getTime() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      acceptedAt: i.payment.createdAt,
      isInstallment: true,
      installmentNo: i.installmentNo,
      dueDate: i.dueDate,
    })),
  ];

  // ─── Active Bookings (Confirmed) ──────────────────────────────────────────
  const activeBookings = await prisma.booking.findMany({
    where: { studentId, status: 'CONFIRMED' },
    include: {
      listing: {
        include: { images: { take: 1 } },
      },
      payment: {
        select: { status: true, amount: true, paidAt: true },
      },
      extraCharges: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const activeBookingDetails = activeBookings.map((b) => {
    const extraTotal = b.extraCharges.reduce((sum, e) => sum + e.amount, 0);
    return {
      bookingId: b.id,
      listingTitle: b.listing.title,
      listingType: b.listing.type,
      area: b.listing.area,
      city: b.listing.city,
      address: b.listing.address,
      image: b.listing.images[0]?.url || null,
      monthlyRent: b.listing.price,
      moveInDate: b.moveInDate,
      paymentStatus: b.payment?.status || 'N/A',
      extraCharges: b.extraCharges.map((e) => ({
        title: e.title,
        amount: e.amount,
        description: e.description,
      })),
      extraTotal,
      totalMonthlyDue: b.listing.price + extraTotal,
      confirmedAt: b.createdAt,
    };
  });

  // ─── All Bookings History ─────────────────────────────────────────────────
  const bookingHistory = await prisma.booking.findMany({
    where: { studentId, ...createdAtFilter },
    include: {
      listing: {
        select: {
          title: true,
          type: true,
          area: true,
          price: true,
          images: { take: 1 },
        },
      },
      payment: {
        select: { status: true, amount: true, paidAt: true },
      },
      extraCharges: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    range,
    overview: {
      totalBookings,
      pendingBookings,
      acceptedBookings,
      confirmedBookings,
      rejectedBookings,
      cancelledBookings,
      totalPaid,
      totalUnpaid,
      totalPaidCount: fullPaidPayments.length + paidInstallmentsFlat.length,
      totalUnpaidCount: fullUnpaidPayments.length + pendingInstallmentsFlat.length,
    },
    activeBookings: activeBookingDetails,
    payments: {
      totalPaid,
      totalUnpaid,
      monthlyBreakdown,
      paidDetails: paidPaymentDetails,
      unpaidDetails: unpaidPaymentDetails,
    },
    bookingHistory: bookingHistory.map((b) => ({
      bookingId: b.id,
      listingTitle: b.listing.title,
      listingType: b.listing.type,
      area: b.listing.area,
      monthlyRent: b.listing.price,
      image: b.listing.images[0]?.url || null,
      status: b.status,
      paymentStatus: b.payment?.status || 'N/A',
      paidAt: b.payment?.paidAt || null,
      extraCharges: b.extraCharges,
      moveInDate: b.moveInDate,
      bookedAt: b.createdAt,
    })),
  };
};

export const DashboardService = {
  getAdminDashboard,
  getOwnerDashboard,
  getStudentDashboard,
};



