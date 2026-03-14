

const BASE_URL = 'http://localhost:5000';

// ✅ Get token from localStorage
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// ✅ Get user safely from localStorage
export function getUser(): { id: number; name: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;

  const u = localStorage.getItem('user');

  // Ignore bad values
  if (!u || u === 'undefined' || u === 'null') return null;

  try {
    const parsed = JSON.parse(u);

    // Validate shape
    if (
      parsed &&
      typeof parsed.id === 'number' &&
      typeof parsed.name === 'string' &&
      typeof parsed.email === 'string' &&
      typeof parsed.role === 'string'
    ) {
      return parsed;
    } else {
      console.warn('Invalid user object in localStorage', parsed);
      return null;
    }
  } catch (err) {
    console.error('Failed to parse user from localStorage', err);
    return null;
  }
}

// ✅ Set token + user safely
export function setAuth(token: string, user: object | null) {
  if (typeof window === 'undefined') return;

  localStorage.setItem('token', token);

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
}

// ✅ Clear auth
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Generic request function
async function request(method: string, path: string, body?: unknown) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// API helpers
export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: unknown) => request('POST', path, body),
  put: (path: string, body?: unknown) => request('PUT', path, body),
  delete: (path: string) => request('DELETE', path),
};

// Upload files
export async function uploadFile(path: string, formData: FormData) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}