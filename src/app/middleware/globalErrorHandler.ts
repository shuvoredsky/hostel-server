import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import AppError from '../errorHelpers/AppError';

const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorSources = [{ path: '', message }];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorSources = err.issues.map((issue) => ({
      path: String(issue.path[issue.path.length - 1] || ''),
      message: issue.message,
    }));
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: '', message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: '', message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: process.env.NODE_ENV === 'development' ? (err as Error)?.stack : null,
  });
};

export default globalErrorHandler;