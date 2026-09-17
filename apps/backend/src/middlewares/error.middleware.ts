import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
  errors?: any[];
}

export const errorHandler = (
  err: AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default values for AppError
  let statusCode = 500;
  let status = 'error';
  let message = 'Internal server error';
  let errors: any[] | undefined;
  let isOperational = false;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    status = 'fail';
    message = 'Validation failed';
    errors = err.issues.map((issue: any) => ({  // Changed from errors to issues
      field: issue.path?.join('.') || 'unknown',
      message: issue.message,
    }));
    isOperational = true;
  } else {
    // It's an AppError
    const appErr = err as AppError;
    statusCode = appErr.statusCode || 500;
    status = appErr.status || 'error';
    message = appErr.message || 'Internal server error';
    errors = appErr.errors;
    isOperational = appErr.isOperational || false;

    // Handle JWT errors
    if (appErr.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
      isOperational = true;
    }

    if (appErr.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      isOperational = true;
    }

    // Handle Prisma errors
    if (appErr.name?.includes('Prisma') || appErr.code?.startsWith('P')) {
      // Handle specific Prisma errors
      if (appErr.code === 'P2002') {
        statusCode = 409;
        message = 'Duplicate field value entered';
        isOperational = true;
      } else if (appErr.code === 'P2025') {
        statusCode = 404;
        message = 'Record not found';
        isOperational = true;
      } else {
        // Generic Prisma error
        message = 'Database error occurred';
        isOperational = true;
      }
    }
  }

  // Development mode: detailed error
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      status,
      error: {
        message,
        stack: err.stack,
        ...(errors && { errors }),
      },
      ...(process.env.NODE_ENV === 'development' && {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      }),
    });
  } else {
    // Production mode
    if (isOperational) {
      // Operational, trusted error: send message to client
      res.status(statusCode).json({
        success: false,
        status,
        error: message,
        ...(errors && { errors }),
      });
    } else {
      // Programming or unknown errors: don't leak error details
      console.error('ERROR 💥', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
      
      res.status(500).json({
        success: false,
        status: 'error',
        error: 'Something went wrong!',
      });
    }
  }
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error: AppError = new Error(`Route not found - ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler factory
export const createValidationError = (message: string, errors?: any[]): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = 400;
  error.status = 'fail';
  error.isOperational = true;
  if (errors) error.errors = errors;
  return error;
};

// Authentication error factory
export const createAuthError = (message: string = 'Authentication failed'): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = 401;
  error.status = 'fail';
  error.isOperational = true;
  return error;
};

// Authorization error factory
export const createAuthorizationError = (message: string = 'Insufficient permissions'): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = 403;
  error.status = 'fail';
  error.isOperational = true;
  return error;
};