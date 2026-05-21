import { Request, Response, NextFunction } from 'express';
import  logger  from '@utils/logger.js';
import { env } from '@config/env.js';

/**
 * Application-level error class for controlled, operational errors.
 * Errors thrown as `AppError` are treated as expected failures (client mistakes,
 * resource-not-found, etc.) and will not trigger a 500 response.
 *
 * @param message - Human-readable error description sent to the client
 * @param statusCode - HTTP status code (defaults to 500)
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error-handling middleware. Must be registered last in the middleware chain.
 * Distinguishes AppError (operational) from unexpected errors, logs all failures,
 * and returns a consistent JSON error shape. Includes a stack trace in development.
 *
 * @param err - The caught error (AppError or generic Error)
 * @param req - Express request object (used for logging path/method/IP)
 * @param res - Express response object
 * @param _next - Next function required by Express error-handler signature (unused)
 * @returns JSON response with success: false, the error message, and stack trace in development
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    statusCode,
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};