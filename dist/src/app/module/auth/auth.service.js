"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const generated_1 = require("../../generated");
const env_1 = require("../../../config/env");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const auth_1 = require("../../lib/auth");
const prisma_1 = require("../../lib/prisma");
const jwt_1 = require("../../utils/jwt");
const token_1 = require("../../utils/token");
// ─── Register Student ─────────────────────────────────────────────────────────
const registerStudent = async (payload) => {
    const { name, email, password } = payload;
    const data = await auth_1.auth.api.signUpEmail({
        body: { name, email, password },
    });
    if (!data.user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to register student');
    }
    try {
        const accessToken = token_1.tokenUtils.getAccessToken({
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });
        const refreshToken = token_1.tokenUtils.getRefreshToken({
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });
        return { ...data, accessToken, refreshToken };
    }
    catch (error) {
        await prisma_1.prisma.user.delete({ where: { id: data.user.id } });
        throw error;
    }
};
// ─── Register Owner ───────────────────────────────────────────────────────────
const registerOwner = async (payload) => {
    const { name, email, password } = payload;
    const data = await auth_1.auth.api.signUpEmail({
        body: { name, email, password },
    });
    if (!data.user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to register owner');
    }
    try {
        // Owner এর role update করো
        await prisma_1.prisma.user.update({
            where: { id: data.user.id },
            data: { role: generated_1.$Enums.Role.OWNER },
        });
        const accessToken = token_1.tokenUtils.getAccessToken({
            userId: data.user.id,
            role: generated_1.$Enums.Role.OWNER,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });
        const refreshToken = token_1.tokenUtils.getRefreshToken({
            userId: data.user.id,
            role: generated_1.$Enums.Role.OWNER,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });
        return { ...data, accessToken, refreshToken };
    }
    catch (error) {
        await prisma_1.prisma.user.delete({ where: { id: data.user.id } });
        throw error;
    }
};
// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (payload) => {
    const { email, password } = payload;
    const data = await auth_1.auth.api.signInEmail({
        body: { email, password },
    });
    if (data.user.status === generated_1.$Enums.UserStatus.BLOCKED) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Your account is blocked. Please contact support.');
    }
    if (data.user.isDeleted || data.user.status === generated_1.$Enums.UserStatus.DELETED) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Your account has been deleted.');
    }
    const accessToken = token_1.tokenUtils.getAccessToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        status: data.user.status,
        isDeleted: data.user.isDeleted,
        emailVerified: data.user.emailVerified,
    });
    const refreshToken = token_1.tokenUtils.getRefreshToken({
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
const getMe = async (user) => {
    const isUserExists = await prisma_1.prisma.user.findUnique({
        where: { id: user.userId },
    });
    if (!isUserExists) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return isUserExists;
};
// ─── Refresh Token ────────────────────────────────────────────────────────────
const getNewToken = async (refreshToken, sessionToken) => {
    const isSessionExists = await prisma_1.prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });
    if (!isSessionExists) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid session token');
    }
    const verifiedRefreshToken = jwt_1.jwtUtils.verifyToken(refreshToken, env_1.envVars.REFRESH_TOKEN_SECRET);
    if (!verifiedRefreshToken.success) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid refresh token');
    }
    const data = verifiedRefreshToken.data;
    const newAccessToken = token_1.tokenUtils.getAccessToken({
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
    });
    const newRefreshToken = token_1.tokenUtils.getRefreshToken({
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
    });
    const { token } = await prisma_1.prisma.session.update({
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
const changePassword = async (payload, sessionToken) => {
    const session = await auth_1.auth.api.getSession({
        headers: new Headers({ Authorization: `Bearer ${sessionToken}` }),
    });
    if (!session) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid session token');
    }
    const { currentPassword, newPassword } = payload;
    const result = await auth_1.auth.api.changePassword({
        body: { currentPassword, newPassword, revokeOtherSessions: true },
        headers: new Headers({ Authorization: `Bearer ${sessionToken}` }),
    });
    if (session.user.needPasswordChange) {
        await prisma_1.prisma.user.update({
            where: { id: session.user.id },
            data: { needPasswordChange: false },
        });
    }
    const accessToken = token_1.tokenUtils.getAccessToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
        status: session.user.status,
        isDeleted: session.user.isDeleted,
        emailVerified: session.user.emailVerified,
    });
    const refreshToken = token_1.tokenUtils.getRefreshToken({
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
const logoutUser = async (sessionToken) => {
    return await auth_1.auth.api.signOut({
        headers: new Headers({ Authorization: `Bearer ${sessionToken}` }),
    });
};
// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = async (email, otp) => {
    const result = await auth_1.auth.api.verifyEmailOTP({ body: { email, otp } });
    if (result.status && !result.user.emailVerified) {
        await prisma_1.prisma.user.update({
            where: { email },
            data: { emailVerified: true },
        });
    }
};
// ─── Forget Password ──────────────────────────────────────────────────────────
const forgetPassword = async (email) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    if (!user.emailVerified)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email not verified');
    if (user.isDeleted || user.status === UserStatus.DELETED) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    await auth_1.auth.api.requestPasswordResetEmailOTP({ body: { email } });
};
// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (email, otp, newPassword) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    if (!user.emailVerified)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email not verified');
    if (user.isDeleted || user.status === UserStatus.DELETED) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    await auth_1.auth.api.resetPasswordEmailOTP({ body: { email, otp, password: newPassword } });
    if (user.needPasswordChange) {
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { needPasswordChange: false },
        });
    }
    await prisma_1.prisma.session.deleteMany({ where: { userId: user.id } });
};
// ─── Google Login Success ─────────────────────────────────────────────────────
const googleLoginSuccess = async (session) => {
    const accessToken = token_1.tokenUtils.getAccessToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
    });
    const refreshToken = token_1.tokenUtils.getRefreshToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
    });
    return { accessToken, refreshToken };
};
exports.AuthService = {
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
