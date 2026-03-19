import { NextFunction, Request, Response } from 'express';
import { Role, UserStatus } from '../../generated';
import { CookieUtils } from '../utils/cookie';
import AppError from '../errorHelpers/AppError';
import status from 'http-status';
import { prisma } from '../lib/prisma';
import { jwtUtils } from '../utils/jwt';
import { envVars } from '../../config/env';

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionToken = CookieUtils.getCookie(req, 'better-auth.session_token');

      if (!sessionToken) {
        throw new AppError(status.UNAUTHORIZED, 'Unauthorized! No session token provided');
      }

      const sessionExists = await prisma.session.findFirst({
        where: {
          token: sessionToken,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!sessionExists) {
        throw new AppError(status.UNAUTHORIZED, 'Session expired or invalid');
      }

      const user = sessionExists.user;

      // Session expiry warning header
      const now = new Date();
      const timeRemaining = sessionExists.expiresAt.getTime() - now.getTime();
      const totalLifetime = sessionExists.expiresAt.getTime() - sessionExists.createdAt.getTime();
      const percentRemaining = Math.round((timeRemaining / totalLifetime) * 100);
      if (percentRemaining < 20) {
        res.setHeader('X-Session-Refresh', 'true');
        res.setHeader('X-Session-Expires-At', sessionExists.expiresAt.toISOString());
      }

      if (user.status === UserStatus.BLOCKED || user.status === UserStatus.DELETED) {
        throw new AppError(status.FORBIDDEN, 'Your account is blocked or deleted');
      }

      if (user.isDeleted) {
        throw new AppError(status.FORBIDDEN, 'Your account has been deleted');
      }

      if (authRoles.length > 0 && !authRoles.includes(user.role)) {
        throw new AppError(status.FORBIDDEN, 'You are not authorized to access this resource');
      }

      // Access token verify
      const accessToken = CookieUtils.getCookie(req, 'accessToken');
      if (!accessToken) {
        throw new AppError(status.UNAUTHORIZED, 'Access token not found');
      }

      const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
      if (!verifiedToken.success) {
        throw new AppError(status.UNAUTHORIZED, 'Access token is invalid or expired');
      }

      (req as any).user = {
  userId: user.id,
  role: user.role,
  email: user.email,
};

      next();
    } catch (error) {
      next(error);
    }
  };