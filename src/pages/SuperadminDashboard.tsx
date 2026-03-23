// src/pages/SuperadminDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Users, CreditCard, Search, Plus, LogOut, RefreshCw,
  TrendingUp, Shield, ChevronDown, ChevronUp,
  Check, AlertCircle, Loader2, X, Eye, EyeOff, Zap,
} from "lucide-react";
import { clearAuth, getToken, signIn, saveAuth } from "../lib/Auth";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE as string;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: "user" | "superadmin";
  created_at: string;
}

interface Stats {
  total_users: number;
  total_credits: number;
  total_accounts: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────
function SuperadminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await signIn({ email, password });
      if (res.user.role !== "superadmin") {
        setError("Akun ini tidak memiliki akses superadmin.");
        return;
      }
      saveAuth(res.token, res.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Subtle grid bg */}
      <div className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/8 border border-gray-200/80 p-8">
          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#000000] flex items-center justify-center mb-4 shadow-lg shadow-[#000000]/25">
              <Shield size={26} className="text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Admin Panel
            </h1>
            <p className="text-sm text-gray-400 mt-1">AI Viral Clipper · Superadmin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="admin@domain.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#000000] focus:bg-white focus:ring-2 focus:ring-[#000000]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#000000] focus:bg-white focus:ring-2 focus:ring-[#000000]/10 transition-all pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
                <AlertCircle size={13} className="shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#000000] text-white font-semibold text-sm hover:bg-[#17a864] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[#000000]/20 flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Memverifikasi...</>
                : <><Shield size={15} /> Masuk ke Dashboard</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Akses terbatas — superadmin only
        </p>
      </div>
    </div>
  );
}

// ─── Add Credits Modal ────────────────────────────────────────────────────────
function AddCreditsModal({
  user, onClose, onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}) {
  const [amount, setAmount]   = useState("");
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const PRESETS               = [10, 50, 100, 350, 500, 1000];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(amount, 10);
    if (!n || n <= 0) { setError("Masukkan jumlah kredit yang valid"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/add-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ amount: n, note }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Gagal menambahkan kredit");
      onSuccess((await res.json()).new_balance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const preview = parseInt(amount || "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-200 overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#000000]/10 flex items-center justify-center shrink-0">
              <Zap size={16} className="text-[#000000]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Tambah Kredit</h3>
              <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{user.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current balance */}
          <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Saldo Saat Ini</p>
              <p className="text-2xl font-black text-gray-900 tabular-nums mt-0.5">
                {user.credits.toLocaleString()}
                <span className="text-sm font-medium text-gray-400 ml-1">cr</span>
              </p>
            </div>
            {preview > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-[#000000] font-semibold uppercase tracking-wider">Setelah Top Up</p>
                <p className="text-2xl font-black text-[#000000] tabular-nums mt-0.5">
                  {(user.credits + preview).toLocaleString()}
                  <span className="text-sm font-medium text-[#000000]/60 ml-1">cr</span>
                </p>
              </div>
            )}
          </div>

          {/* Presets */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Pilih Jumlah</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((n) => (
                <button key={n} type="button" onClick={() => setAmount(String(n))}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    amount === String(n)
                      ? "bg-[#000000] border-[#000000] text-white shadow-md shadow-[#000000]/20"
                      : "bg-white border-gray-200 text-gray-600 hover:border-[#000000]/40 hover:text-[#000000]"
                  }`}>
                  +{n}
                </button>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Jumlah Kustom
            </label>
            <input
              type="number" min="1" max="100000" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="Masukkan jumlah..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#000000] focus:bg-white focus:ring-2 focus:ring-[#000000]/10 transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Catatan Transaksi
            </label>
            <input
              type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="mis. Transfer BCA #REF123..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#000000] focus:bg-white focus:ring-2 focus:ring-[#000000]/10 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              <AlertCircle size={12} className="shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading || !amount || parseInt(amount) <= 0}
            className="w-full py-3.5 rounded-xl bg-[#000000] text-white font-bold text-sm hover:bg-[#17a864] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[#000000]/20 flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Memproses...</>
              : <><Plus size={14} /> Tambahkan {preview > 0 ? `${preview.toLocaleString()} Credit` : "Kredit"}</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
          <Icon size={15} />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 tabular-nums leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Credit Pill ──────────────────────────────────────────────────────────────
function CreditPill({ value }: { value: number }) {
  if (value === 0)
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-500 border border-red-100">0 cr</span>;
  if (value <= 5)
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-500 border border-orange-100">{value.toLocaleString()} cr</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">{value.toLocaleString()} cr</span>;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<"credits" | "name" | "created_at">("created_at");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [addCreditUser, setAddCreditUser] = useState<AdminUser | null>(null);
  const [toast, setToast]           = useState("");

  // Check token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const p = JSON.parse(atob(token.split(".")[1]));
      if (p.exp * 1000 > Date.now() && p.role === "superadmin") setIsLoggedIn(true);
    } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) { clearAuth(); setIsLoggedIn(false); return; }
        throw new Error("Gagal memuat data");
      }
      const data = await res.json();
      // Filter out superadmin from list
      setUsers((data.users || []).filter((u: AdminUser) => u.role !== "superadmin"));
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isLoggedIn) fetchUsers(); }, [isLoggedIn, fetchUsers]);

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(""), 3500);
  }

  function handleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  }

  const SortIcon = ({ field }: { field: typeof sortBy }) =>
    sortBy === field
      ? (sortDir === "asc" ? <ChevronUp size={11} className="text-[#000000]" /> : <ChevronDown size={11} className="text-[#000000]" />)
      : <ChevronDown size={11} className="text-gray-300" />;

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let va: any = a[sortBy], vb: any = b[sortBy];
      if (sortBy === "created_at") { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const lowCreditCount  = users.filter((u) => u.credits <= 5 && u.credits > 0).length;
  const zeroCreditCount = users.filter((u) => u.credits === 0).length;

  if (!isLoggedIn) return <SuperadminLogin onSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Accent top bar */}
      <div className="h-1 bg-[#000000]" />

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#000000] flex items-center justify-center">
              <Zap size={13} className="text-white fill-white" />
            </div>
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              AI Viral Clipper
            </span>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs font-semibold text-[#000000] bg-[#000000]/8 px-2 py-0.5 rounded-full">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} disabled={loading}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
              title="Refresh">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { clearAuth(); setIsLoggedIn(false); navigate("/auth"); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all">
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* ── Page title ── */}
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Pantau seluruh user dan kelola saldo kredit mereka.
          </p>
        </div>

        {/* ── Stat cards ── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total User" value={stats.total_users.toLocaleString()}
              sub="Akun terdaftar"
              icon={Users} accent="bg-blue-50 text-blue-500"
            />
            <StatCard
              label="Total Kredit" value={stats.total_credits.toLocaleString()}
              sub="Saldo aktif seluruh user"
              icon={CreditCard} accent="bg-[#000000]/10 text-[#000000]"
            />
            <StatCard
              label="Kredit Hampir Habis" value={String(lowCreditCount)}
              sub="Saldo ≤ 5 credit"
              icon={TrendingUp} accent="bg-orange-50 text-orange-500"
            />
            <StatCard
              label="Kredit Habis" value={String(zeroCreditCount)}
              sub="Perlu top up segera"
              icon={Shield} accent="bg-red-50 text-red-400"
            />
          </div>
        )}

        {/* ── Users table ── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-800">Daftar Pengguna</h2>
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 w-56 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border-b border-red-100 px-6 py-3">
              <AlertCircle size={13} className="shrink-0" /> {error}
            </div>
          )}

          {/* ── Desktop table ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  {[
                    { label: "#",          field: null },
                    { label: "Nama",       field: "name" as const },
                    { label: "Email",      field: null },
                    { label: "Kredit",     field: "credits" as const },
                    { label: "Bergabung",  field: "created_at" as const },
                    { label: "Aksi",       field: null },
                  ].map((col) => (
                    <th key={col.label}
                      onClick={col.field ? () => handleSort(col.field!) : undefined}
                      className={`px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${col.field ? "cursor-pointer hover:text-gray-600 select-none" : ""}`}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.field && <SortIcon field={col.field} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading && !users.length ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Loader2 size={22} className="animate-spin mx-auto text-[#000000] mb-2" />
                      <p className="text-sm text-gray-400">Memuat data pengguna...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Users size={28} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Tidak ada pengguna ditemukan</p>
                    </td>
                  </tr>
                ) : filtered.map((user, idx) => (
                  <tr key={user.id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-gray-300">{idx + 1}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-400 font-mono">{user.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <CreditPill value={user.credits} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-400">{formatDate(user.created_at)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setAddCreditUser(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#000000]/40 hover:text-[#000000] hover:bg-[#000000]/5 transition-all shadow-sm opacity-0 group-hover:opacity-100">
                        <Plus size={12} /> Top Up
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden divide-y divide-gray-50">
            {loading && !users.length ? (
              <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                <Loader2 size={20} className="animate-spin text-[#000000]" />
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={24} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Tidak ada pengguna</p>
              </div>
            ) : filtered.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 text-sm font-bold text-gray-500">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-400 font-mono truncate">{user.email}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{formatDate(user.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <CreditPill value={user.credits} />
                  <button onClick={() => setAddCreditUser(user)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#000000]/8 border border-[#000000]/20 text-[#000000] text-[11px] font-semibold hover:bg-[#000000]/15 transition-colors">
                    <Plus size={11} /> Top Up
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
              <p className="text-[11px] text-gray-400">
                Menampilkan {filtered.length} dari {users.length} pengguna
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add credits modal ── */}
      {addCreditUser && (
        <AddCreditsModal
          user={addCreditUser}
          onClose={() => setAddCreditUser(null)}
          onSuccess={(newBalance) => {
            setUsers((prev) => prev.map((u) => u.id === addCreditUser.id ? { ...u, credits: newBalance } : u));
            if (stats) setStats({ ...stats, total_credits: stats.total_credits - addCreditUser.credits + newBalance });
            showToast(`Berhasil! ${addCreditUser.name} kini punya ${newBalance.toLocaleString()} credit`);
            setAddCreditUser(null);
          }}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-black/8 text-sm text-gray-700 whitespace-nowrap animate-in slide-in-from-bottom-2">
          <div className="w-5 h-5 rounded-full bg-[#000000] flex items-center justify-center shrink-0">
            <Check size={11} className="text-white" strokeWidth={3} />
          </div>
          {toast}
        </div>
      )}
    </div>
  );
}