import { ApiResponse } from '../_types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shopcop-backend.onrender.com/api/v1';

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = isFormData
    ? (options.headers ?? {})
    : { 'Content-Type': 'application/json', ...(options.headers ?? {}) };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(data.message ?? 'Request failed', response.status);
  }

  return data;
}
