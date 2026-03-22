// src/pages/Auth.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Mail, Lock, ArrowRight,
} from "lucide-react";
import { signIn, saveAuth, isAuthenticated } from "../lib/Auth";
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

// Removed PasswordStrengthBar

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
          ? "border-black dark:border-white bg-white dark:bg-black shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]"
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
  // Sign-in state
  const [siEmail, setSiEmail]       = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPw, setSiShowPw]     = useState(false);

  // Shared
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated()) navigate("/app", { replace: true });
  }, []);

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

  // Removed handleSignUp

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <GridBg />

      {/* Card */}
      <div className="relative w-full max-w-md z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 md:mb-10">
          <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]">
            <BrandLogo size={20} className="text-white dark:text-black" />
          </div>
          <span className="text-xl font-black text-black dark:text-white uppercase tracking-tight">
            AI Viral Clipper
          </span>
        </div>

        {/* Form card */}
        <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-6 md:p-8 relative shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ffffff]">

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
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#1ABC71] text-black font-bold uppercase tracking-wider text-sm border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[4px_4px_0px_#000000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#000000] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none dark:bg-black dark:text-white dark:border-white dark:shadow-[4px_4px_0px_#ffffff] dark:hover:shadow-[6px_6px_0px_#ffffff]"
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
          </form>
        </div>

        {/* Footer */}
        <p className="text-center font-mono text-[10px] text-black/40 dark:text-white/30 mt-6 px-4">
          Hanya untuk pengguna terdaftar. Hubungi admin untuk akses.
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