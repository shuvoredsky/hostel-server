import status from 'http-status';
import { Role, StudentVerificationStatus } from '../../../generated';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import {
  IReviewVerificationPayload,
  ISubmitStudentVerificationPayload,
} from './verification.interface';

// ─── Submit Verification (Student) ────────────────────────────────────────────
const submitVerification = async (
  userId: string,
  payload: ISubmitStudentVerificationPayload,
  studentIdCardUrl: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  if (user.role !== Role.STUDENT) {
    throw new AppError(status.FORBIDDEN, 'শুধু Student role এর ব্যবহারকারীরা verification দিতে পারবেন');
  }

  const existing = await prisma.studentVerification.findUnique({ where: { userId } });

  if (existing && existing.status === StudentVerificationStatus.VERIFIED) {
    throw new AppError(status.BAD_REQUEST, 'আপনি ইতিমধ্যে verified');
  }

  if (existing && existing.status === StudentVerificationStatus.PENDING) {
    throw new AppError(status.BAD_REQUEST, 'আপনার verification request ইতিমধ্যে pending আছে');
  }

  // আগে REJECTED থাকলে upsert করে নতুন করে PENDING করবো
  const result = await prisma.studentVerification.upsert({
    where: { userId },
    create: {
      userId,
      studentIdCardUrl,
      universityName: payload.universityName,
      department: payload.department,
      session: payload.session,
      status: StudentVerificationStatus.PENDING,
    },
    update: {
      studentIdCardUrl,
      universityName: payload.universityName,
      department: payload.department,
      session: payload.session,
      status: StudentVerificationStatus.PENDING,
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
    },
  });

  return result;
};

// ─── Get My Verification Status (Student) ─────────────────────────────────────
const getMyVerification = async (userId: string) => {
  const result = await prisma.studentVerification.findUnique({ where: { userId } });
  return result;
};

// ─── Get All Pending Verifications (Admin) ─────────────────────────────────────
const getAllVerifications = async (statusFilter?: StudentVerificationStatus) => {
  const result = await prisma.studentVerification.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return result;
};

// ─── Approve Verification (Admin) ──────────────────────────────────────────────
const approveVerification = async (verificationId: string, adminId: string) => {
  const verification = await prisma.studentVerification.findUnique({
    where: { id: verificationId },
  });

  if (!verification) {
    throw new AppError(status.NOT_FOUND, 'Verification request পাওয়া যায়নি');
  }

  const result = await prisma.studentVerification.update({
    where: { id: verificationId },
    data: {
      status: StudentVerificationStatus.VERIFIED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  return result;
};

// ─── Reject Verification (Admin) ───────────────────────────────────────────────
const rejectVerification = async (
  verificationId: string,
  adminId: string,
  payload: IReviewVerificationPayload,
) => {
  const verification = await prisma.studentVerification.findUnique({
    where: { id: verificationId },
  });

  if (!verification) {
    throw new AppError(status.NOT_FOUND, 'Verification request পাওয়া যায়নি');
  }

  const result = await prisma.studentVerification.update({
    where: { id: verificationId },
    data: {
      status: StudentVerificationStatus.REJECTED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      rejectionReason: payload.rejectionReason || 'কোনো কারণ উল্লেখ করা হয়নি',
    },
  });

  return result;
};

export const VerificationService = {
  submitVerification,
  getMyVerification,
  getAllVerifications,
  approveVerification,
  rejectVerification,
};