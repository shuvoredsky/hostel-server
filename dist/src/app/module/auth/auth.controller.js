"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const env_1 = require("../../../config/env");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const auth_1 = require("../../lib/auth");
const catchAsync_1 = require("../../shared/catchAsync");
const sendResponse_1 = require("../../shared/sendResponse");
const cookie_1 = require("../../utils/cookie");
const token_1 = require("../../utils/token");
const auth_service_1 = require("./auth.service");
// ─── Register Student ─────────────────────────────────────────────────────────
const registerStudent = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await auth_service_1.AuthService.registerStudent(req.body);
    const { accessToken, refreshToken, token, ...rest } = result;
    token_1.tokenUtils.setAccessTokenCookie(res, accessToken);
    token_1.tokenUtils.setRefreshTokenCookie(res, refreshToken);
    token_1.tokenUtils.setBetterAuthSessionCookie(res, token);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Student registered successfully',
        data: { token, accessToken, refreshToken, ...rest },
    });
});
// ─── Register Owner ───────────────────────────────────────────────────────────
const registerOwner = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await auth_service_1.AuthService.registerOwner(req.body);
    const { accessToken, refreshToken, token, ...rest } = result;
    token_1.tokenUtils.setAccessTokenCookie(res, accessToken);
    token_1.tokenUtils.setRefreshTokenCookie(res, refreshToken);
    token_1.tokenUtils.setBetterAuthSessionCookie(res, token);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Owner registered successfully',
        data: { token, accessToken, refreshToken, ...rest },
    });
});
// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await auth_service_1.AuthService.loginUser(req.body);
    const { accessToken, refreshToken, token, ...rest } = result;
    token_1.tokenUtils.setAccessTokenCookie(res, accessToken);
    token_1.tokenUtils.setRefreshTokenCookie(res, refreshToken);
    token_1.tokenUtils.setBetterAuthSessionCookie(res, token);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.OK,
        success: true,
        message: 'User logged in successfully',
        data: { token, accessToken, refreshToken, ...rest },
    });
});
// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await auth_service_1.AuthService.getMe(req.user);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.OK,
        success: true,
        message: 'User profile fetched successfully',
        data: result,
    });
});
// ─── Refresh Token ────────────────────────────────────────────────────────────
const getNewToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const betterAuthSessionToken = req.cookies['better-auth.session_token'];
    if (!refreshToken) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Refresh token is missing');
    }
    const result = await auth_service_1.AuthService.getNewToken(refreshToken, betterAuthSessionToken);
    const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;
    token_1.tokenUtils.setAccessTokenCookie(res, accessToken);
    token_1.tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
    token_1.tokenUtils.setBetterAuthSessionCookie(res, sessionToken);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.OK,
        success: true,
        message: 'Tokens refreshed successfully',
        data: { accessToken, refreshToken: newRefreshToken, sessionToken },
    });
});
// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const betterAuthSessionToken = req.cookies['better-auth.session_token'];
    const result = await auth_service_1.AuthService.changePassword(req.body, betterAuthSessionToken);
    const { accessToken, refreshToken, token } = result;
    token_1.tokenUtils.setAccessTokenCookie(res, accessToken);
    token_1.tokenUtils.setRefreshTokenCookie(res, refreshToken);
    token_1.tokenUtils.setBetterAuthSessionCookie(res, token);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.OK,
        success: true,
        message: 'Password changed successfully',
        data: result,
    });
});
// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const betterAuthSessionToken = req.cookies['better-auth.session_token'];
    const result = await auth_service_1.AuthService.logoutUser(betterAuthSessionToken);
    const cookieOptions = { httpOnly: true, secure: true, sameSite: 'none' };
    cookie_1.CookieUtils.clearCookie(res, 'accessToken', cookieOptions);
    cookie_1.CookieUtils.clearCookie(res, 'refreshToken', cookieOptions);
    cookie_1.CookieUtils.clearCookie(res, 'better-auth.session_token', cookieOptions);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.OK,
        success: true,
        message: 'Logged out successfully',
        data: result,
    });
});
// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, otp } = req.body;
    await auth_service_1.AuthService.verifyEmail(email, otp);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.OK,
        success: true,
        message: 'Email verified successfully',
    });
});
// ─── Forget Password ──────────────────────────────────────────────────────────
const forgetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await auth_service_1.AuthService.forgetPassword(req.body.email);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.OK,
        success: true,
        message: 'OTP sent to email successfully',
    });
});
// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    await auth_service_1.AuthService.resetPassword(email, otp, newPassword);
    (0, sendResponse_1.sendResponse)(res, {
        httpStatusCode: http_status_1.default.OK,
        success: true,
        message: 'Password reset successfully',
    });
});
// ─── Google Login ─────────────────────────────────────────────────────────────
const googleLogin = (0, catchAsync_1.catchAsync)((req, res) => {
    const redirectPath = req.query.redirect || '/dashboard';
    const encodedRedirectPath = encodeURIComponent(redirectPath);
    const callbackURL = `${env_1.envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;
    res.render('googleRedirect', {
        callbackURL,
        betterAuthUrl: env_1.envVars.BETTER_AUTH_URL,
    });
});
// ─── Google Login Success ─────────────────────────────────────────────────────
const googleLoginSuccess = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const redirectPath = req.query.redirect || '/dashboard';
    const sessionToken = req.cookies['better-auth.session_token'];
    if (!sessionToken) {
        return res.redirect(`${env_1.envVars.FRONTEND_URL}/login?error=oauth_failed`);
    }
    const session = await auth_1.auth.api.getSession({
        headers: { Cookie: `better-auth.session_token=${sessionToken}` },
    });
    if (!session) {
        return res.redirect(`${env_1.envVars.FRONTEND_URL}/login?error=no_session_found`);
    }
    if (!session.user) {
        return res.redirect(`${env_1.envVars.FRONTEND_URL}/login?error=no_user_found`);
    }
    const result = await auth_service_1.AuthService.googleLoginSuccess(session);
    const { accessToken, refreshToken } = result;
    token_1.tokenUtils.setAccessTokenCookie(res, accessToken);
    token_1.tokenUtils.setRefreshTokenCookie(res, refreshToken);
    const isValidRedirectPath = redirectPath.startsWith('/') && !redirectPath.startsWith('//');
    const finalRedirectPath = isValidRedirectPath ? redirectPath : '/dashboard';
    res.redirect(`${env_1.envVars.FRONTEND_URL}${finalRedirectPath}`);
});
// ─── OAuth Error ──────────────────────────────────────────────────────────────
const handleOAuthError = (0, catchAsync_1.catchAsync)((req, res) => {
    const error = req.query.error || 'oauth_failed';
    res.redirect(`${env_1.envVars.FRONTEND_URL}/login?error=${error}`);
});
exports.AuthController = {
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
