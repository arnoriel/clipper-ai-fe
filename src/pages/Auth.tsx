// src/pages/Auth.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Mail, Lock, User, ArrowRight, Sparkles,
} from "lucide-react";
import { signUp, signIn, saveAuth, isAuthenticated } from "../lib/Auth";
import { BrandLogo } from "../components/BrandLogo";
const GridBg = ({ className = "" }: { className?: string }) => (
  <div
    className={`absolute inset-0 pointer-events-none ${className}`}
    style={{
      backgroundImage:
        "linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)",
      backgroundSize: "48px 48px",
    }}
  />
);

// ─── Password strength bar ─────────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: "8+ karakter", ok: password.length >= 8 },
    { label: "Huruf besar", ok: /[A-Z]/.test(password) },
    { label: "Angka",       ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColors = ["bg-red-500", "bg-yellow-500", "bg-black dark:bg-white", "bg-black dark:bg-white"];
  const labels    = ["", "Lemah", "Sedang", "Kuat"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 transition-all duration-300 ${
              i < score ? barColors[score] : "bg-black/10 dark:bg-white/10"
            }`}
          />
        ))}
        <span className={`text-[10px] font-mono ml-1 uppercase tracking-wider ${
          score === 1 ? "text-red-500" : score === 2 ? "text-yellow-500" : "text-black dark:text-white"
        }`}>{labels[score]}</span>
      </div>
      <div className="flex gap-3">
        {checks.map((c) => (
          <span key={c.label} className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
            c.ok ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
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
      <label className="block font-mono text-xs text-black/60 dark:text-white/50 tracking-widest uppercase">
        {label}
      </label>
      <div className={`relative flex items-center border transition-all duration-200 ${
        error
          ? "border-red-500 bg-red-50 dark:bg-red-950/20"
          : focused
          ? "border-black dark:border-white bg-white dark:bg-black shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151]"
          : "border-black/20 dark:border-white/20 bg-white dark:bg-black hover:border-black/40 dark:hover:border-white/40 shadow-none"
      }`}>
        <span className={`pl-3.5 shrink-0 transition-colors ${
          focused ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"
        }`}>
          {icon}
        </span>
        <input
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          className="flex-1 bg-transparent px-3 py-3 font-mono text-sm text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 outline-none min-w-0"
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
// Main Auth Page — Light Theme with Mobile Support
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
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <GridBg />

      {/* Card */}
      <div className="relative w-full max-w-md z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 md:mb-10">
          <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151]">
            <BrandLogo size={20} className="text-white dark:text-black" />
          </div>
          <span className="text-xl font-black text-black dark:text-white uppercase tracking-tight">
            AI Viral Clipper
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-6 md:mb-8">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
                mode === m
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_#d1d5db] dark:shadow-[2px_2px_0px_#374151]"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              {m === "signin" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="border border-black/10 dark:border-white/10 bg-white dark:bg-black p-6 md:p-8 relative">
          <div className="absolute top-0 right-0 w-2 h-2 border-l border-b border-black/10 dark:border-white/10" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-r border-t border-black/10 dark:border-white/10" />

          {/* Success */}
          {success && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 font-mono text-xs text-black dark:text-white uppercase tracking-wider animate-[fadeIn_0.2s_ease]">
              <CheckCircle2 size={16} className="shrink-0" />
              {success}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-500 font-mono text-xs text-red-500 uppercase tracking-wider animate-[fadeIn_0.2s_ease]">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── SIGN IN ──────────────────────────────────────────────────────── */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-5" noValidate>
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-black dark:text-white leading-[1.05] tracking-tight mb-2">
                  Selamat datang kembali
                </h2>
                <p className="font-mono text-xs text-black/50 dark:text-white/40">Masuk untuk lanjutkan membuat konten viral</p>
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
                    className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                  >
                    {siShowPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider text-sm border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#d1d5db] dark:hover:shadow-[6px_6px_0px_#374151] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
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

              <p className="text-center font-mono text-xs text-black/50 dark:text-white/40">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-black dark:text-white hover:underline font-bold uppercase tracking-widest"
                >
                  Daftar
                </button>
              </p>
            </form>
          )}

          {/* ── SIGN UP ──────────────────────────────────────────────────────── */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-5" noValidate>
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-black dark:text-white leading-[1.05] tracking-tight mb-2">
                  Buat akun baru
                </h2>
                <p className="font-mono text-xs text-black/50 dark:text-white/40">Mulai buat konten viral hari ini — gratis</p>
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
                      className="text-gray-300 hover:text-gray-500 transition-colors p-1"
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
                    className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                  >
                    {suShowConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider text-sm border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#d1d5db] dark:hover:shadow-[6px_6px_0px_#374151] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
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

              <p className="text-center font-mono text-xs text-black/50 dark:text-white/40">
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-black dark:text-white hover:underline font-bold uppercase tracking-widest"
                >
                  Masuk
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 mt-6 px-4">
          Dengan mendaftar, kamu menyetujui syarat &amp; ketentuan kami.
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