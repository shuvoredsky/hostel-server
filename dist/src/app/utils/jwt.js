"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createToken = (payload, secret, options) => {
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
const verifyToken = (token, secret) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return { success: true, data: decoded };
    }
    catch (error) {
        return { success: false, message: error.message, error };
    }
};
const decodeToken = (token) => {
    return jsonwebtoken_1.default.decode(token);
};
exports.jwtUtils = { createToken, verifyToken, decodeToken };
