// src/lib/Auth.ts
// Auth utilities — token management + API calls

const API_BASE = import.meta.env.VITE_API_BASE as string;
const TOKEN_KEY   = "clipper_ai_token";
const USER_KEY    = "clipper_ai_user";
const CREDITS_KEY = "clipper_ai_credits";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "superadmin";
  credits: number;
}

// ─── Token storage ──────────────────────────────────────────────────────────
export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(CREDITS_KEY, String(user.credits ?? 0));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CREDITS_KEY);
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

export function getStoredCredits(): number {
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function updateStoredCredits(credits: number) {
  localStorage.setItem(CREDITS_KEY, String(credits));
  // Also patch the user object
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      user.credits = credits;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch {}
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function isSuperadmin(): boolean {
  const user = getStoredUser();
  return user?.role === "superadmin";
}

/** Returns Authorization header object if logged in, else empty. */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
    const detail = data?.detail;
    if (Array.isArray(detail)) {
      const msg = detail.map((e: any) => e.msg).join(", ");
      throw new Error(msg);
    }
    throw new Error(
      typeof detail === "string" ? detail : `Server error (${res.status})`
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

/** Fetch latest credit balance from server and update localStorage. */
export async function refreshCredits(): Promise<number> {
  const token = getToken();
  if (!token) return 0;
  try {
    const res = await fetch(`${API_BASE}/api/user/credits`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return getStoredCredits();
    const { credits } = await res.json();
    updateStoredCredits(credits);
    return credits;
  } catch {
    return getStoredCredits();
  }
}