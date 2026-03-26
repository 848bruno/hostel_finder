const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api';
const REQUEST_TIMEOUT_MS = 8000;

interface RequestOptions {
  timeoutMs?: number;
}

const TOKEN_KEY = 'shf_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: string[] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData
        ? (body as FormData)
        : body !== undefined
        ? JSON.stringify(body)
        : undefined,
      signal: controller.signal,
    });

    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : {};

    if (!response.ok) {
      const details = Array.isArray(data.errors)
        ? data.errors.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
      const message = details.length > 0 ? details.join(' ') : data.message || 'Request failed';
      throw new ApiError(response.status, message, details);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Check that the backend is running.');
    }

    throw new ApiError(0, 'Could not reach the backend. Check that the API server is running.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, false, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, false, options),
  postForm: <T>(path: string, body: FormData, options?: RequestOptions) =>
    request<T>('POST', path, body, true, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, false, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, false, options),
};
