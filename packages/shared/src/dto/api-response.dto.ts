/**
 * Standardized API Response DTOs and helper functions
 * Migrated and enhanced from apps/backend/src/utils/response.ts
 */
import { HTTP_STATUS } from '../constants';
import { ErrorCode, ERROR_MESSAGES } from '../constants/errors.constants';

/**
 * Base API Response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

/**
 * API Error interface
 */
export interface ApiError {
  code: ErrorCode | string;
  message: string;
  details?: any;
  field?: string;
  statusCode?: number;
}

/**
 * Validation Error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Error Response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: ValidationError[];
    stack?: string; // Only in development
  };
  timestamp: string;
}

/**
 * Paginated Response interface (DTO version - more specific than common.types)
 */
export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Creates a successful API response
 * @param data - Response data
 * @param message - Success message
 */
export function createSuccessResponse<T>(
  data?: T,
  message: string = 'Success'
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an error API response
 * @param code - Error code
 * @param message - Error message (optional, will use default from ERROR_MESSAGES)
 * @param statusCode - HTTP status code
 * @param details - Additional error details
 */
export function createErrorResponse(
  code: ErrorCode | string,
  message?: string,
  statusCode: number = HTTP_STATUS.INTERNAL_ERROR,
  details?: any
): ApiResponse {
  const errorMessage = message || (code in ErrorCode ? ERROR_MESSAGES[code as ErrorCode] : 'An error occurred');

  return {
    success: false,
    error: {
      code,
      message: errorMessage,
      statusCode,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a validation error response
 * @param errors - Array of validation errors
 * @param message - Optional custom message
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  message: string = 'Validation failed'
): ApiResponse {
  return {
    success: false,
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      details: errors,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a not found error response
 * @param resource - Resource name (e.g., 'Event', 'User')
 * @param identifier - Optional resource identifier
 */
export function createNotFoundResponse(
  resource: string = 'Resource',
  identifier?: string
): ApiResponse {
  const message = identifier
    ? `${resource} with ID '${identifier}' not found`
    : `${resource} not found`;

  return createErrorResponse(ErrorCode.NOT_FOUND, message, HTTP_STATUS.NOT_FOUND);
}

/**
 * Creates an unauthorized error response
 * @param message - Optional custom message
 */
export function createUnauthorizedResponse(message?: string): ApiResponse {
  return createErrorResponse(
    ErrorCode.UNAUTHORIZED,
    message || ERROR_MESSAGES[ErrorCode.UNAUTHORIZED],
    HTTP_STATUS.UNAUTHORIZED
  );
}

/**
 * Creates a forbidden error response
 * @param message - Optional custom message
 */
export function createForbiddenResponse(message?: string): ApiResponse {
  return createErrorResponse(
    ErrorCode.FORBIDDEN,
    message || ERROR_MESSAGES[ErrorCode.FORBIDDEN],
    HTTP_STATUS.FORBIDDEN
  );
}

/**
 * Creates a conflict error response
 * @param message - Error message
 */
export function createConflictResponse(message: string): ApiResponse {
  return createErrorResponse(ErrorCode.RESOURCE_CONFLICT, message, HTTP_STATUS.CONFLICT);
}

/**
 * Creates a paginated response
 * @param data - Array of data items
 * @param total - Total count of items
 * @param page - Current page number
 * @param limit - Items per page
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedApiResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: ApiResponse): response is ApiResponse & { success: false; error: ApiError } {
  return response.success === false;
}
