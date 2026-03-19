"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieUtils = void 0;
const setCookie = (res, key, value, option) => {
    res.cookie(key, value, option);
};
const getCookie = (req, key) => {
    return req.cookies[key];
};
const clearCookie = (res, key, option) => {
    res.clearCookie(key, option);
};
exports.CookieUtils = { setCookie, getCookie, clearCookie };
