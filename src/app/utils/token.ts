import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { jwtUtils } from './jwt';
import { envVars } from '../../config/env';
import { Response } from 'express';
import { CookieUtils } from './cookie';


const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  path: '/',
};

const getAccessToken = (payload: JwtPayload) => {
  return jwtUtils.createToken(payload, envVars.ACCESS_TOKEN_SECRET, {
    expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions);
};

const getRefreshToken = (payload: JwtPayload) => {
  return jwtUtils.createToken(payload, envVars.REFRESH_TOKEN_SECRET, {
    expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
};

const setAccessTokenCookie = (res: Response, token: string) => {
  CookieUtils.setCookie(res, 'accessToken', token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 1000,
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  CookieUtils.setCookie(res, 'refreshToken', token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7 * 1000,
  });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  CookieUtils.setCookie(res, 'better-auth.session_token', token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 1000,
  });
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
};