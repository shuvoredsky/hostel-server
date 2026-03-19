"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Something went wrong!';
    let errorSources = [{ path: '', message }];
    if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        errorSources = err.issues.map((issue) => ({
            path: String(issue.path[issue.path.length - 1] || ''),
            message: issue.message,
        }));
    }
    else if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
        errorSources = [{ path: '', message }];
    }
    else if (err instanceof Error) {
        message = err.message;
        errorSources = [{ path: '', message }];
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        stack: process.env.NODE_ENV === 'development' ? err?.stack : null,
    });
};
exports.default = globalErrorHandler;
