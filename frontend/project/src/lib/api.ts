const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '/api';
const ACCESS_TOKEN_KEY = 'vectra.access_token';
const REFRESH_TOKEN_KEY = 'vectra.refresh_token';

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'EDUCATOR' | 'ADMIN';
  created_at?: string;
}

interface TokenPair { access_token: string; refresh_token: string; }

export function getAccessToken() { return localStorage.getItem(ACCESS_TOKEN_KEY); }
export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
function saveTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const send = () => {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData) && options.body !== undefined) headers.set('Content-Type', 'application/json');
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };
  let response = await send();
  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/register' && path !== '/auth/refresh') {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      const refreshed = await fetch(`${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, { method: 'POST' });
      if (refreshed.ok) { saveTokens(await refreshed.json() as TokenPair); response = await send(); }
    }
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string }; detail?: string } | null;
    if (response.status === 401) clearTokens();
    throw new Error(payload?.error?.message ?? payload?.detail ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function signInRequest(email: string, password: string) {
  const tokens = await api<TokenPair>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  saveTokens(tokens);
  return api<ApiUser>('/auth/me');
}
export async function signUpRequest(name: string, email: string, password: string) {
  const tokens = await api<TokenPair>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  saveTokens(tokens);
  return api<ApiUser>('/auth/me');
}
