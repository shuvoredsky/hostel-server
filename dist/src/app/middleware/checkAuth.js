"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = void 0;
const generated_1 = require("../generated");
const cookie_1 = require("../utils/cookie");
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../utils/jwt");
const env_1 = require("../../config/env");
const checkAuth = (...authRoles) => async (req, res, next) => {
    try {
        const sessionToken = cookie_1.CookieUtils.getCookie(req, 'better-auth.session_token');
        if (!sessionToken) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized! No session token provided');
        }
        const sessionExists = await prisma_1.prisma.session.findFirst({
            where: {
                token: sessionToken,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
        if (!sessionExists) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Session expired or invalid');
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
        if (user.status === generated_1.$Enums.UserStatus.BLOCKED || user.status === generated_1.$Enums.UserStatus.DELETED) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Your account is blocked or deleted');
        }
        if (user.isDeleted) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Your account has been deleted');
        }
        if (authRoles.length > 0 && !authRoles.includes(user.role)) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to access this resource');
        }
        // Access token verify
        const accessToken = cookie_1.CookieUtils.getCookie(req, 'accessToken');
        if (!accessToken) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Access token not found');
        }
        const verifiedToken = jwt_1.jwtUtils.verifyToken(accessToken, env_1.envVars.ACCESS_TOKEN_SECRET);
        if (!verifiedToken.success) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Access token is invalid or expired');
        }
        req.user = {
            userId: user.id,
            role: user.role,
            email: user.email,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.checkAuth = checkAuth;
