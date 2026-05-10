const envBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const primaryBase = (envBase && envBase.length > 0 ? envBase : 'http://127.0.0.1:4000').replace(/\/+$/, '');
const fallbackBase =
  primaryBase.includes('127.0.0.1')
    ? primaryBase.replace('127.0.0.1', 'localhost')
    : primaryBase.includes('localhost')
      ? primaryBase.replace('localhost', '127.0.0.1')
      : null;
const BASE_CANDIDATES = [primaryBase, ...(fallbackBase ? [fallbackBase] : [])];
export const API_BASE_URL = primaryBase;

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getUser(): { id: number; name: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;

  const u = localStorage.getItem('user');

  if (!u || u === 'undefined' || u === 'null') {
    return null;
  }

  try {
    return JSON.parse(u);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function setAuth(token: string, user: object) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function request(method: string, path: string, body?: unknown) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response | null = null;
  let lastFetchError: unknown = null;

  for (const base of BASE_CANDIDATES) {
    try {
      res = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      break;
    } catch (error) {
      lastFetchError = error;
    }
  }

  if (!res) {
    const message = lastFetchError instanceof Error ? lastFetchError.message : 'Network request failed';
    throw new ApiError(`Could not reach API (${BASE_CANDIDATES.join(' or ')}): ${message}`, 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || data.detail || data.error || 'Server error or Database disconnected';
    // Only log unexpected server-side failures; 4xx are often expected UX flows.
    if (res.status >= 500) {
      console.error(`API Error (${res.status}): ${errorMsg}`);
    }
    throw new ApiError(errorMsg, res.status, data);
  }
  return data;
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: unknown) => request('POST', path, body),
  put: (path: string, body?: unknown) => request('PUT', path, body),
  patch: (path: string, body?: unknown) => request('PATCH', path, body),
  delete: (path: string) => request('DELETE', path),
};

export async function uploadFile(path: string, formData: FormData) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // IMPORTANT: Do NOT set Content-Type for FormData.
  // The browser will automatically set it to multipart/form-data
  // with the correct boundary.
  let res: Response | null = null;
  let lastFetchError: unknown = null;

  for (const base of BASE_CANDIDATES) {
    try {
      res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      break;
    } catch (error) {
      lastFetchError = error;
    }
  }

  if (!res) {
    const message = lastFetchError instanceof Error ? lastFetchError.message : 'Network request failed';
    throw new Error(`Could not reach API (${BASE_CANDIDATES.join(' or ')}): ${message}`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}
