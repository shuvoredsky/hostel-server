import status from 'http-status';
// import SSLCommerzPayment from 'sslcommerz-lts';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { IRequestUser } from '../../interface/requestUser.interface';
import { envVars } from '../../../config/env';
const SSLCommerzPayment = require('sslcommerz-lts');


// ─── Initiate Payment ─────────────────────────────────────────────────────────
const initiatePayment = async (bookingId: string, user: IRequestUser) => {
  const payment = await prisma.payment.findFirst({
    where: {
      bookingId,
      studentId: user.userId,
    },
    include: {
      booking: {
        include: {
          listing: true,
          student: {
            select: { id: true, name: true, email: true },
          },
        },
      },
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

  const transactionId = `TXN-${Date.now()}-${user.userId.slice(0, 6)}`;

  const sslData = {
    total_amount: payment.amount,
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

  const sslResponse = await sslcz.init(sslData);

  if (!sslResponse?.GatewayPageURL) {
    throw new AppError(status.BAD_REQUEST, 'Failed to initiate payment');
  }

  // Transaction ID save করো
  await prisma.payment.update({
    where: { id: payment.id },
    data: { transactionId, sslSessionKey: sslResponse.sessionkey },
  });

  return { paymentUrl: sslResponse.GatewayPageURL, transactionId };
};

// ─── Payment Success ───────────────────────────────────────────────────────────
const paymentSuccess = async (transactionId: string) => {
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
  });

  return { message: 'Payment successful' };
};

// ─── Payment Fail ──────────────────────────────────────────────────────────────
const paymentFail = async (transactionId: string) => {
  const payment = await prisma.payment.findFirst({
    where: { transactionId },
  });

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
  const payment = await prisma.payment.findFirst({
    where: { transactionId },
  });

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
            select: { id: true, title: true, area: true, price: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
};


const getOwnerPayments = async (user: IRequestUser) => {
  const payments = await prisma.payment.findMany({
    where: {
      booking: { ownerId: user.userId },
      status: 'PAID',
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      booking: {
        include: {
          listing: { select: { id: true, title: true, area: true } },
        },
      },
    },
    orderBy: { paidAt: 'desc' },
  });

  return payments;
};

// ─── Get All Payments (Admin) ──────────────────────────────────────────────────
const getAllPayments = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          listing: {
            select: { id: true, title: true, area: true },
          },
          student: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Total commission calculate করো
  const totalCommission = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.commission, 0);

  return { payments, totalCommission };
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