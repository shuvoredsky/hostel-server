import status from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { Role, UserStatus } from '../../../generated';
import { envVars } from '../../../config/env';
import AppError from '../../errorHelpers/AppError';
import { IRequestUser } from '../../interface/requestUser.interface';
import { auth } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { jwtUtils } from '../../utils/jwt';
import { tokenUtils } from '../../utils/token';
import {
  IChangePasswordPayload,
  ILoginUserPayload,
  IRegisterOwnerPayload,
  IRegisterStudentPayload,
} from './auth.interface';

// ─── Register Student ─────────────────────────────────────────────────────────
const registerStudent = async (payload: IRegisterStudentPayload) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!data.user) {
    throw new AppError(status.BAD_REQUEST, 'Failed to register student');
  }

  try {
    const accessToken = tokenUtils.getAccessToken({
      userId: data.user.id,
      role: data.user.role,
      name: data.user.name,
      email: data.user.email,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });

    const refreshToken = tokenUtils.getRefreshToken({
      userId: data.user.id,
      role: data.user.role,
      name: data.user.name,
      email: data.user.email,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });

    return { ...data, accessToken, refreshToken };
  } catch (error) {
    await prisma.user.delete({ where: { id: data.user.id } });
    throw error;
  }
};

// ─── Register Owner ───────────────────────────────────────────────────────────
const registerOwner = async (payload: IRegisterOwnerPayload) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!data.user) {
    throw new AppError(status.BAD_REQUEST, 'Failed to register owner');
  }

  try {
    // Owner এর role update করো
    await prisma.user.update({
      where: { id: data.user.id },
      data: { role: Role.OWNER },
    });

    const accessToken = tokenUtils.getAccessToken({
      userId: data.user.id,
      role: Role.OWNER,
      name: data.user.name,
      email: data.user.email,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });

    const refreshToken = tokenUtils.getRefreshToken({
      userId: data.user.id,
      role: Role.OWNER,
      name: data.user.name,
      email: data.user.email,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });

    return { ...data, accessToken, refreshToken };
  } catch (error) {
    await prisma.user.delete({ where: { id: data.user.id } });
    throw error;
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  const data = await auth.api.signInEmail({
    body: { email, password },
  });

  if (data.user.status === UserStatus.BLOCKED) {
    throw new AppError(status.FORBIDDEN, 'Your account is blocked. Please contact support.');
  }

  if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, 'Your account has been deleted.');
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });

  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });

  return { ...data, accessToken, refreshToken };
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  return isUserExists;
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
const getNewToken = async (refreshToken: string, sessionToken: string) => {
  const isSessionExists = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!isSessionExists) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid session token');
  }

  const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET);

  if (!verifiedRefreshToken.success) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid refresh token');
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const { token } = await prisma.session.update({
    where: { token: sessionToken },
    data: {
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
      updatedAt: new Date(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  };
};

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (payload: IChangePasswordPayload, sessionToken: string) => {
  const session = await auth.api.getSession({
    headers: new Headers({ Authorization: `Bearer ${sessionToken}` }),
  });

  if (!session) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid session token');
  }

  const { currentPassword, newPassword } = payload;

  const result = await auth.api.changePassword({
    body: { currentPassword, newPassword, revokeOtherSessions: true },
    headers: new Headers({ Authorization: `Bearer ${sessionToken}` }),
  });

  if (session.user.needPasswordChange) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { needPasswordChange: false },
    });
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  return { ...result, accessToken, refreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutUser = async (sessionToken: string) => {
  return await auth.api.signOut({
    headers: new Headers({ Authorization: `Bearer ${sessionToken}` }),
  });
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = async (email: string, otp: string) => {
  const result = await auth.api.verifyEmailOTP({ body: { email, otp } });

  if (result.status && !result.user.emailVerified) {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });
  }
};

// ─── Forget Password ──────────────────────────────────────────────────────────
const forgetPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(status.NOT_FOUND, 'User not found');
  if (!user.emailVerified) throw new AppError(status.BAD_REQUEST, 'Email not verified');
  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  await auth.api.requestPasswordResetEmailOTP({ body: { email } });
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(status.NOT_FOUND, 'User not found');
  if (!user.emailVerified) throw new AppError(status.BAD_REQUEST, 'Email not verified');
  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  await auth.api.resetPasswordEmailOTP({ body: { email, otp, password: newPassword } });

  if (user.needPasswordChange) {
    await prisma.user.update({
      where: { id: user.id },
      data: { needPasswordChange: false },
    });
  }

  await prisma.session.deleteMany({ where: { userId: user.id } });
};

// ─── Google Login Success ─────────────────────────────────────────────────────
const googleLoginSuccess = async (session: Record<string, any>) => {
  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
  });

  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
  });

  return { accessToken, refreshToken };
};

export const AuthService = {
  registerStudent,
  registerOwner,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logoutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLoginSuccess,
};