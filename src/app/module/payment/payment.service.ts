import status from 'http-status';
// import SSLCommerzPayment from 'sslcommerz-lts';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { IRequestUser } from '../../interface/requestUser.interface';
import { envVars } from '../../../config/env';
const SSLCommerzPayment = require('sslcommerz-lts');
import { calculateInstallments } from '../../utils/pricing';


const initiatePayment = async (bookingId: string, user: IRequestUser) => {
  const payment = await prisma.payment.findFirst({
    where: { bookingId, studentId: user.userId },
    include: {
      booking: {
        include: {
          listing: true,
          student: { select: { id: true, name: true, email: true } },
        },
      },
      installments: true,
    },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, 'Payment not found');
  }

  if (payment.status === 'PAID') {
    throw new AppError(status.BAD_REQUEST, 'Payment already completed');
  }

  if (payment.booking.status !== 'ACCEPTED') {
    throw new AppError(status.BAD_REQUEST, 'Booking is not accepted yet');
  }

  // ─── Half Monthly হলে: প্রথমবার installments create করো (না থাকলে) ────────
  if (payment.booking.paymentPlan === 'HALF_MONTHLY') {
    if (payment.installments.length === 0) {
      const parts = calculateInstallments(payment.amount, payment.commission);
      await prisma.paymentInstallment.createMany({
        data: parts.map((p) => ({
          paymentId: payment.id,
          installmentNo: p.installmentNo,
          amount: p.amount,
          commission: p.commission,
          dueDate: p.dueDate,
        })),
      });
    }

    // প্রথম যেই installment এখনো PENDING সেটার জন্য payment session বানাও
    const nextInstallment = await prisma.paymentInstallment.findFirst({
      where: { paymentId: payment.id, status: 'PENDING' },
      orderBy: { installmentNo: 'asc' },
    });

    if (!nextInstallment) {
      throw new AppError(status.BAD_REQUEST, 'সব installment পরিশোধ হয়ে গেছে');
    }

    return await initiateSslSession(
      payment,
      nextInstallment.amount,
      `INST-${nextInstallment.installmentNo}`,
      nextInstallment.id,
    );
  }

  // ─── Full Payment (আগের মতোই) ──────────────────────────────────────────────
  return await initiateSslSession(payment, payment.amount, 'FULL', null);
};

// ─── SSL Session বানানোর shared logic (Full আর Installment দুইটার জন্যই) ──────
const initiateSslSession = async (
  payment: any,
  amount: number,
  tag: string,
  installmentId: string | null,
) => {
  const transactionId = `TXN-${Date.now()}-${payment.studentId.slice(0, 6)}-${tag}`;

  const sslData = {
    total_amount: amount,
    currency: 'BDT',
    tran_id: transactionId,
    success_url: `${envVars.BETTER_AUTH_URL}/api/v1/payments/success/${transactionId}`,
    fail_url: `${envVars.BETTER_AUTH_URL}/api/v1/payments/fail/${transactionId}`,
    cancel_url: `${envVars.BETTER_AUTH_URL}/api/v1/payments/cancel/${transactionId}`,
    ipn_url: `${envVars.BETTER_AUTH_URL}/api/v1/payments/ipn`,
    product_name: payment.booking.listing.title,
    product_category: 'Housing',
    product_profile: 'general',
    cus_name: payment.booking.student.name,
    cus_email: payment.booking.student.email,
    cus_add1: payment.booking.listing.address,
    cus_city: payment.booking.listing.city,
    cus_country: 'Bangladesh',
    cus_phone: '01700000000',
    ship_name: payment.booking.student.name,
    ship_add1: payment.booking.listing.address,
    ship_city: payment.booking.listing.city,
    ship_country: 'Bangladesh',
    shipping_method: 'NO',
  };

  const sslcz = new SSLCommerzPayment(
    envVars.SSLCOMMERZ_STORE_ID,
    envVars.SSLCOMMERZ_STORE_PASSWORD,
    envVars.SSLCOMMERZ_IS_LIVE,
  );

  console.log('[Payment] initiateSslSession start:', { paymentId: payment.id, installmentId, transactionId });

  // Add a timeout wrapper around the gateway init to avoid hanging indefinitely
  const sslInitPromise = sslcz.init(sslData);
  const timeoutMs = 15000;
  const sslResponse = await Promise.race([
    sslInitPromise,
    new Promise((_, reject) => setTimeout(() => reject(new AppError(status.GATEWAY_TIMEOUT, 'Payment gateway timeout')), timeoutMs)),
  ]);

  console.log('[Payment] initiateSslSession response received:', { paymentId: payment.id, gatewayUrl: sslResponse?.GatewayPageURL });

  if (!sslResponse?.GatewayPageURL) {
    throw new AppError(status.BAD_REQUEST, 'Failed to initiate payment');
  }

  if (installmentId) {
    await prisma.paymentInstallment.update({
      where: { id: installmentId },
      data: { transactionId },
    });
    console.log('[Payment] stored transactionId on installment:', { installmentId, transactionId });
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { transactionId, sslSessionKey: sslResponse.sessionkey },
    });
    console.log('[Payment] stored transactionId on payment:', { paymentId: payment.id, transactionId, sessionKey: sslResponse.sessionkey });
  }

  return { paymentUrl: sslResponse.GatewayPageURL, transactionId };
};

// ─── Payment Success ───────────────────────────────────────────────────────────
const paymentSuccess = async (transactionId: string) => {
  // First, check if the transaction belongs to a payment installment
  const installment = await prisma.paymentInstallment.findFirst({
    where: { transactionId },
    include: { payment: { include: { booking: true } } },
  });

if (installment) {
  await prisma.$transaction(async (tx) => {
    await tx.paymentInstallment.update({
      where: { id: installment.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    const pending = await tx.paymentInstallment.findFirst({
      where: { paymentId: installment.paymentId, status: 'PENDING' },
    });

    if (!pending) {
      await tx.payment.update({
        where: { id: installment.paymentId },
        data: { status: 'PAID', paidAt: new Date() },
      });

      await tx.booking.update({
        where: { id: installment.payment.bookingId },
        data: { status: 'CONFIRMED' },
      });

      await tx.listing.update({
        where: { id: installment.payment.booking.listingId },  // ← ফিক্স
        data: { isAvailable: false },
      });
    }
  });

  return { message: 'Installment payment successful' };
}

  // Otherwise treat as a full payment transaction
  const payment = await prisma.payment.findFirst({
    where: { transactionId },
    include: { booking: true },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, 'Payment not found');
  }

  // Payment ও Booking update করো
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' },
    });

    await tx.listing.update({
    where: { id: payment.booking.listingId },
    data: { isAvailable: false },
  });

  });

  return { message: 'Payment successful' };
};

// ─── Payment Fail ──────────────────────────────────────────────────────────────
const paymentFail = async (transactionId: string) => {
  const installment = await prisma.paymentInstallment.findFirst({
    where: { transactionId },
  });

  if (installment) {
    await prisma.paymentInstallment.update({
      where: { id: installment.id },
      data: { status: 'OVERDUE' },
    });
    return { message: 'Installment payment failed' };
  }

  const payment = await prisma.payment.findFirst({ where: { transactionId } });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, 'Payment not found');
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED' },
  });

  return { message: 'Payment failed' };
};

// ─── Payment Cancel ────────────────────────────────────────────────────────────
const paymentCancel = async (transactionId: string) => {
  const installment = await prisma.paymentInstallment.findFirst({
    where: { transactionId },
  });

  if (installment) {
    await prisma.paymentInstallment.update({
      where: { id: installment.id },
      data: { status: 'PENDING', transactionId: null }, // আবার try করতে পারবে
    });
    return { message: 'Installment payment cancelled' };
  }

  const payment = await prisma.payment.findFirst({ where: { transactionId } });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, 'Payment not found');
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED' },
  });

  return { message: 'Payment cancelled' };
};

// ─── Get My Payments (Student) ─────────────────────────────────────────────────
const getMyPayments = async (user: IRequestUser) => {
  const payments = await prisma.payment.findMany({
    where: { studentId: user.userId },
    include: {
      booking: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              area: true,
              city: true,
              price: true,
              images: { select: { id: true, url: true } },
            },
          },
        },
      },
      installments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
};


const getOwnerPayments = async (user: IRequestUser) => {
  // Full payment (paid) + Half-monthly এর paid installments — দুইটাই আনো
  const [fullPayments, installmentPayments] = await Promise.all([
    prisma.payment.findMany({
      where: {
        booking: { ownerId: user.userId, paymentPlan: 'FULL' },
        status: 'PAID',
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        booking: { include: { listing: { select: { id: true, title: true, area: true } } } },
      },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.paymentInstallment.findMany({
      where: {
        status: 'PAID',
        payment: { booking: { ownerId: user.userId, paymentPlan: 'HALF_MONTHLY' } },
      },
      include: {
        payment: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            booking: { include: { listing: { select: { id: true, title: true, area: true } } } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    }),
  ]);

  // দুইটাকে একই shape এ normalize করে merge করো, যাতে frontend একই structure পায়
  const normalizedInstallments = installmentPayments.map((i) => ({
    id: i.id,
    amount: i.amount,
    commission: i.commission,
    status: i.status,
    paidAt: i.paidAt,
    isInstallment: true,
    installmentNo: i.installmentNo,
    student: i.payment.student,
    booking: i.payment.booking,
  }));

  const normalizedFull = fullPayments.map((p) => ({
    id: p.id,
    amount: p.amount,
    commission: p.commission,
    status: p.status,
    paidAt: p.paidAt,
    isInstallment: false,
    student: p.student,
    booking: p.booking,
  }));

  return [...normalizedFull, ...normalizedInstallments].sort(
    (a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime(),
  );
};

// ─── Get All Payments (Admin) ──────────────────────────────────────────────────
const getAllPayments = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      student: { select: { id: true, name: true, email: true } },
      booking: {
        include: {
          listing: { select: { id: true, title: true, area: true } },
          student: { select: { id: true, name: true, email: true } },
        },
      },
      installments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const fullPaymentCommission = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.commission, 0);
  const installmentCommission = payments
    .flatMap((p) => p.installments)
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.commission, 0);
  const totalCommission = fullPaymentCommission + installmentCommission;

  // নতুন — revenue আর paid count ও ঠিক করো
  const fullPaymentRevenue = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);
  const installmentRevenue = payments
    .flatMap((p) => p.installments)
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalRevenue = fullPaymentRevenue + installmentRevenue;

  const totalPaidCount =
    payments.filter((p) => p.status === 'PAID').length +
    payments.flatMap((p) => p.installments).filter((i) => i.status === 'PAID').length;

  return { payments, totalCommission, totalRevenue, totalPaidCount };
};

export const PaymentService = {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getMyPayments,
  getAllPayments,
  getOwnerPayments,
};