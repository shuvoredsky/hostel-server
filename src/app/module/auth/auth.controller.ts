import { Request, Response } from 'express';
import status from 'http-status';
import { envVars } from '../../../config/env';
import AppError from '../../errorHelpers/AppError';
import { auth } from '../../lib/auth';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { CookieUtils } from '../../utils/cookie';
import { tokenUtils } from '../../utils/token';
import { AuthService } from './auth.service';

// ─── Register Student ─────────────────────────────────────────────────────────
const registerStudent = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerStudent(req.body);
  const { accessToken, refreshToken, token, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Student registered successfully',
    data: { token, accessToken, refreshToken, ...rest },
  });
});

// ─── Register Owner ───────────────────────────────────────────────────────────
const registerOwner = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerOwner(req.body);
  const { accessToken, refreshToken, token, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Owner registered successfully',
    data: { token, accessToken, refreshToken, ...rest },
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);
  const { accessToken, refreshToken, token, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User logged in successfully',
    data: { token, accessToken, refreshToken, ...rest },
  });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = catchAsync(async (req: Request, res: Response) => {
const result = await AuthService.getMe((req as any).user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User profile fetched successfully',
    data: result,
  });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
const getNewToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const betterAuthSessionToken = req.cookies['better-auth.session_token'];

  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, 'Refresh token is missing');
  }

  const result = await AuthService.getNewToken(refreshToken, betterAuthSessionToken);
  const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Tokens refreshed successfully',
    data: { accessToken, refreshToken: newRefreshToken, sessionToken },
  });
});

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const betterAuthSessionToken = req.cookies['better-auth.session_token'];
  const result = await AuthService.changePassword(req.body, betterAuthSessionToken);
  const { accessToken, refreshToken, token } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const betterAuthSessionToken = req.cookies['better-auth.session_token'];
  const result = await AuthService.logoutUser(betterAuthSessionToken);

  const cookieOptions = { httpOnly: true, secure: true, sameSite: 'none' as const };
  CookieUtils.clearCookie(res, 'accessToken', cookieOptions);
  CookieUtils.clearCookie(res, 'refreshToken', cookieOptions);
  CookieUtils.clearCookie(res, 'better-auth.session_token', cookieOptions);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Logged out successfully',
    data: result,
  });
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await AuthService.verifyEmail(email, otp);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Email verified successfully',
  });
});

// ─── Forget Password ──────────────────────────────────────────────────────────
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgetPassword(req.body.email);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'OTP sent to email successfully',
  });
});

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  await AuthService.resetPassword(email, otp, newPassword);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Password reset successfully',
  });
});

// ─── Google Login ─────────────────────────────────────────────────────────────
const googleLogin = catchAsync((req: Request, res: Response) => {
  const redirectPath = req.query.redirect || '/dashboard';
  const encodedRedirectPath = encodeURIComponent(redirectPath as string);
  const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;

  res.render('googleRedirect', {
    callbackURL,
    betterAuthUrl: envVars.BETTER_AUTH_URL,
  });
});

// ─── Google Login Success ─────────────────────────────────────────────────────
const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirect as string) || '/dashboard';
  const sessionToken = req.cookies['better-auth.session_token'];

  if (!sessionToken) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
  }

  const session = await auth.api.getSession({
    headers: { Cookie: `better-auth.session_token=${sessionToken}` },
  });

  if (!session) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_session_found`);
  }

  if (!session.user) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_user_found`);
  }

  const result = await AuthService.googleLoginSuccess(session);
  const { accessToken, refreshToken } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);

  const isValidRedirectPath = redirectPath.startsWith('/') && !redirectPath.startsWith('//');
  const finalRedirectPath = isValidRedirectPath ? redirectPath : '/dashboard';

  res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
});

// ─── OAuth Error ──────────────────────────────────────────────────────────────
const handleOAuthError = catchAsync((req: Request, res: Response) => {
  const error = (req.query.error as string) || 'oauth_failed';
  res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
});

export const AuthController = {
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
  googleLogin,
  googleLoginSuccess,
  handleOAuthError,
};