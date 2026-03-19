"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenUtils = void 0;
const jwt_1 = require("./jwt");
const env_1 = require("../../config/env");
const cookie_1 = require("./cookie");
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
};
const getAccessToken = (payload) => {
    return jwt_1.jwtUtils.createToken(payload, env_1.envVars.ACCESS_TOKEN_SECRET, {
        expiresIn: env_1.envVars.ACCESS_TOKEN_EXPIRES_IN,
    });
};
const getRefreshToken = (payload) => {
    return jwt_1.jwtUtils.createToken(payload, env_1.envVars.REFRESH_TOKEN_SECRET, {
        expiresIn: env_1.envVars.REFRESH_TOKEN_EXPIRES_IN,
    });
};
const setAccessTokenCookie = (res, token) => {
    cookie_1.CookieUtils.setCookie(res, 'accessToken', token, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 1000,
    });
};
const setRefreshTokenCookie = (res, token) => {
    cookie_1.CookieUtils.setCookie(res, 'refreshToken', token, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 7 * 1000,
    });
};
const setBetterAuthSessionCookie = (res, token) => {
    cookie_1.CookieUtils.setCookie(res, 'better-auth.session_token', token, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 1000,
    });
};
exports.tokenUtils = {
    getAccessToken,
    getRefreshToken,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setBetterAuthSessionCookie,
};
