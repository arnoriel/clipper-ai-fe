// src/lib/auth.ts
// Auth utilities — token management + API calls

const API_BASE = import.meta.env.VITE_API_BASE as string;
const TOKEN_KEY = "clipper_ai_token";
const USER_KEY  = "clipper_ai_user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

// ─── Token storage ─────────────────────────────────────────────────────────
export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  // Quick JWT expiry check (client-side only, no crypto verify)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// ─── API calls ──────────────────────────────────────────────────────────────
export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function authFetch<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // FastAPI validation errors come as { detail: [...] }
    const detail = data?.detail;
    if (Array.isArray(detail)) {
      const msg = detail.map((e: any) => e.msg).join(", ");
      throw new Error(msg);
    }
    throw new Error(
      typeof detail === "string"
        ? detail
        : `Server error (${res.status})`
    );
  }

  return data as T;
}

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/signup", payload);
}

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/signin", payload);
}

export async function verifyToken(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { clearAuth(); return null; }
    return await res.json();
  } catch {
    return null;
  }
}