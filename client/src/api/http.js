// Tiny fetch wrapper: adds the login token and turns errors into exceptions.
const BASE = (import.meta.env.VITE_API_BASE || '') + '/api';
export const AUTH_KEY = 'cb_auth';   // localStorage: { token, role: 'teacher' | 'student', email? }

export const readAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
};

export const http = async (path, { method = 'GET', body, form } = {}) => {
  const headers = {};
  const auth = readAuth();
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};
