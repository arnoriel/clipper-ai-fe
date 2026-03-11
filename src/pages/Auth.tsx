// src/pages/Auth.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Zap, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Mail, Lock, User, ArrowRight, Sparkles,
} from "lucide-react";
import { signUp, signIn, saveAuth, isAuthenticated } from "../lib/Auth";

// ─── Subtle dot-grid background ───────────────────────────────────────────────
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
      style={{
        backgroundImage:
          "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        opacity: 0.55,
      }}
    />
  );
}

// ─── Soft color blobs ──────────────────────────────────────────────────────────
function ColorBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute rounded-full"
        style={{
          width: 480, height: 480,
          top: "-10%", left: "-8%",
          background: "radial-gradient(circle, rgba(26,188,113,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 420, height: 420,
          bottom: "-8%", right: "-6%",
          background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ─── Password strength bar ─────────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: "8+ karakter", ok: password.length >= 8 },
    { label: "Huruf besar", ok: /[A-Z]/.test(password) },
    { label: "Angka",       ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColors = ["bg-red-400", "bg-yellow-400", "bg-[#1ABC71]", "bg-[#1ABC71]"];
  const labels    = ["", "Lemah", "Sedang", "Kuat"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? barColors[score] : "bg-gray-200"
            }`}
          />
        ))}
        <span className={`text-[10px] font-semibold ml-1 ${
          score === 1 ? "text-red-500" : score === 2 ? "text-yellow-500" : "text-[#1ABC71]"
        }`}>{labels[score]}</span>
      </div>
      <div className="flex gap-3">
        {checks.map((c) => (
          <span key={c.label} className={`flex items-center gap-1 text-[10px] transition-colors ${
            c.ok ? "text-[#1ABC71]" : "text-gray-400"
          }`}>
            <CheckCircle2 size={9} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Input field ───────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  label: string;
  error?: string;
  rightEl?: React.ReactNode;
}

function AuthInput({ icon, label, error, rightEl, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 tracking-wide uppercase">
        {label}
      </label>
      <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
        error
          ? "border-red-400 bg-red-50"
          : focused
          ? "border-[#1ABC71] bg-white shadow-[0_0_0_3px_rgba(26,188,113,0.12)]"
          : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
      }`}>
        <span className={`pl-3.5 shrink-0 transition-colors ${
          focused ? "text-[#1ABC71]" : "text-gray-400"
        }`}>
          {icon}
        </span>
        <input
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none"
        />
        {rightEl && <span className="pr-3">{rightEl}</span>}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-500 animate-[fadeIn_0.15s_ease]">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Auth Page — Light Theme
// ══════════════════════════════════════════════════════════════════════════════
export default function Auth() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);

  // Sign-in state
  const [siEmail, setSiEmail]       = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPw, setSiShowPw]     = useState(false);

  // Sign-up state
  const [suName, setSuName]               = useState("");
  const [suEmail, setSuEmail]             = useState("");
  const [suPassword, setSuPassword]       = useState("");
  const [suConfirm, setSuConfirm]         = useState("");
  const [suShowPw, setSuShowPw]           = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);

  // Shared
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated()) navigate("/app", { replace: true });
  }, []);

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError("");
    setSuccess("");
    setFieldErrors({});
    setSearchParams(next === "signup" ? { mode: "signup" } : {});
  }

  // ─── Sign in ────────────────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!siEmail)    errs.siEmail    = "Email wajib diisi";
    if (!siPassword) errs.siPassword = "Password wajib diisi";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const res = await signIn({ email: siEmail, password: siPassword });
      saveAuth(res.token, res.user);
      setSuccess(`Selamat datang kembali, ${res.user.name}!`);
      setTimeout(() => navigate("/app", { replace: true }), 700);
    } catch (err: any) {
      setError(err.message || "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Sign up ────────────────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!suName.trim() || suName.trim().length < 2) errs.suName    = "Nama minimal 2 karakter";
    if (!suEmail)                                    errs.suEmail   = "Email wajib diisi";
    if (!suPassword || suPassword.length < 8)        errs.suPassword = "Password minimal 8 karakter";
    if (suPassword !== suConfirm)                    errs.suConfirm = "Password tidak cocok";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const res = await signUp({
        name: suName.trim(),
        email: suEmail,
        password: suPassword,
        confirm_password: suConfirm,
      });
      saveAuth(res.token, res.user);
      setSuccess(`Akun berhasil dibuat! Halo, ${res.user.name} 👋`);
      setTimeout(() => navigate("/app", { replace: true }), 800);
    } catch (err: any) {
      setError(err.message || "Registrasi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      <DotGrid />
      <ColorBlobs />

      {/* Card */}
      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#1ABC71] flex items-center justify-center shadow-lg shadow-[#1ABC71]/25">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}
          >
            AI Viral Clipper
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white border border-gray-200 mb-8 shadow-sm">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === m
                  ? "bg-[#1ABC71] text-white shadow-md shadow-[#1ABC71]/20"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {m === "signin" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/60">

          {/* Success */}
          {success && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1ABC71]/8 border border-[#1ABC71]/20 text-sm text-[#15a862] animate-[fadeIn_0.2s_ease]">
              <CheckCircle2 size={16} className="shrink-0" />
              {success}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 animate-[fadeIn_0.2s_ease]">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── SIGN IN ──────────────────────────────────────────────────────── */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-5" noValidate>
              <div>
                <h2
                  className="text-xl font-bold text-gray-900 mb-1"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Selamat datang kembali
                </h2>
                <p className="text-xs text-gray-400">Masuk untuk lanjutkan membuat konten viral</p>
              </div>

              <AuthInput
                icon={<Mail size={15} />}
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                error={fieldErrors.siEmail}
                autoComplete="email"
              />

              <AuthInput
                icon={<Lock size={15} />}
                label="Password"
                type={siShowPw ? "text" : "password"}
                placeholder="••••••••"
                value={siPassword}
                onChange={(e) => setSiPassword(e.target.value)}
                error={fieldErrors.siPassword}
                autoComplete="current-password"
                rightEl={
                  <button
                    type="button"
                    onClick={() => setSiShowPw((v) => !v)}
                    className="text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {siShowPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[#1ABC71] text-sm font-semibold text-white hover:bg-[#16a863] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#1ABC71]/20 active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Masuk
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-[#1ABC71] hover:underline font-semibold"
                >
                  Daftar sekarang
                </button>
              </p>
            </form>
          )}

          {/* ── SIGN UP ──────────────────────────────────────────────────────── */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-5" noValidate>
              <div>
                <h2
                  className="text-xl font-bold text-gray-900 mb-1"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Buat akun baru
                </h2>
                <p className="text-xs text-gray-400">Mulai buat konten viral hari ini — gratis</p>
              </div>

              <AuthInput
                icon={<User size={15} />}
                label="Nama Lengkap"
                type="text"
                placeholder="John Doe"
                value={suName}
                onChange={(e) => setSuName(e.target.value)}
                error={fieldErrors.suName}
                autoComplete="name"
              />

              <AuthInput
                icon={<Mail size={15} />}
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={suEmail}
                onChange={(e) => setSuEmail(e.target.value)}
                error={fieldErrors.suEmail}
                autoComplete="email"
              />

              <div>
                <AuthInput
                  icon={<Lock size={15} />}
                  label="Password"
                  type={suShowPw ? "text" : "password"}
                  placeholder="Min. 8 karakter"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  error={fieldErrors.suPassword}
                  autoComplete="new-password"
                  rightEl={
                    <button
                      type="button"
                      onClick={() => setSuShowPw((v) => !v)}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {suShowPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                <PasswordStrengthBar password={suPassword} />
              </div>

              <AuthInput
                icon={<Lock size={15} />}
                label="Konfirmasi Password"
                type={suShowConfirm ? "text" : "password"}
                placeholder="Ulangi password"
                value={suConfirm}
                onChange={(e) => setSuConfirm(e.target.value)}
                error={fieldErrors.suConfirm}
                autoComplete="new-password"
                rightEl={
                  <button
                    type="button"
                    onClick={() => setSuShowConfirm((v) => !v)}
                    className="text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {suShowConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[#1ABC71] text-sm font-semibold text-white hover:bg-[#16a863] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#1ABC71]/20 active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={15} />
                    Buat Akun
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-[#1ABC71] hover:underline font-semibold"
                >
                  Masuk
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 mt-6">
          Dengan mendaftar, kamu menyetujui syarat & ketentuan kami.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}