// Standardized API response helpers

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function successResponse<T>(data: T, message?: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export class ApiErrorClass extends Error {
  public statusCode: number;
  public error: string;

  constructor(statusCode: number, message: string, error: string = 'Error') {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.name = 'ApiError';
  }

  toJSON(): ApiError {
    return {
      success: false,
      error: this.error,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
