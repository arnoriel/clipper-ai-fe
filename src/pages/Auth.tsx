// src/pages/Auth.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Mail, Lock, User, ArrowRight, Sparkles, Globe,
} from "lucide-react";
import { signUp, signIn, saveAuth, isAuthenticated } from "../lib/Auth";
import { BrandLogo } from "../components/BrandLogo";
import { content, type Lang } from "../locales/landing";
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
function PasswordStrengthBar({ password, labels }: { password: string; labels: { length: string; upper: string; number: string; weak: string; medium: string; strong: string } }) {
  const checks = [
    { label: labels.length, ok: password.length >= 8 },
    { label: labels.upper,  ok: /[A-Z]/.test(password) },
    { label: labels.number, ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColors = ["bg-red-500", "bg-yellow-500", "bg-black dark:bg-white", "bg-black dark:bg-white"];
  const scoreLabels = ["", labels.weak, labels.medium, labels.strong];

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
        }`}>{scoreLabels[score]}</span>
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
      <label className="block font-mono text-[10px] tracking-widest text-black/40 dark:text-white/30 uppercase">
        {label}
      </label>
      <div className={`relative flex items-center border transition-all duration-200 ${
        error
          ? "border-red-500 bg-red-50 dark:bg-red-950/20"
          : focused
          ? "border-black dark:border-white bg-black/5 dark:bg-white/5"
          : "border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02]"
      }`}>
        <span className={`pl-4 shrink-0 transition-colors ${
          focused ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
        }`}>
          {icon}
        </span>
        <input
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          className="flex-1 bg-transparent border-none appearance-none focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none shadow-none px-3 py-3 font-mono text-sm text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 outline-none w-full min-w-0"
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

  // Read language from localStorage (same key used by LandingPage Navbar)
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("lang") as Lang) || "ID"
  );
  const t = content[lang];

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

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
    if (!siEmail)    errs.siEmail    = t.auth.errEmailRequired;
    if (!siPassword) errs.siPassword = t.auth.errPasswordRequired;
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const res = await signIn({ email: siEmail, password: siPassword });
      saveAuth(res.token, res.user);
      setSuccess(`${t.auth.successSignin}, ${res.user.name}!`);
      setTimeout(() => navigate("/app", { replace: true }), 700);
    } catch (err: any) {
      setError(err.message || t.auth.errSignin);
    } finally {
      setLoading(false);
    }
  }

  // ─── Sign up ────────────────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!suName.trim() || suName.trim().length < 2) errs.suName     = t.auth.errNameMin;
    if (!suEmail)                                    errs.suEmail    = t.auth.errEmailRequired;
    if (!suPassword || suPassword.length < 8)        errs.suPassword = t.auth.errPasswordMin;
    if (suPassword !== suConfirm)                    errs.suConfirm  = t.auth.errPasswordMatch;
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
      setSuccess(`${t.auth.successSignup}, ${res.user.name} 👋`);
      setTimeout(() => navigate("/app", { replace: true }), 800);
    } catch (err: any) {
      setError(err.message || t.auth.errSignup);
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <GridBg />

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLang(lang === "ID" ? "EN" : "ID")}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur text-black dark:text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:border-black dark:hover:border-white transition-colors"
        >
          <Globe size={11} />
          {lang === "ID" ? "EN" : "ID"}
        </button>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md z-10">

        {/* Logo */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8 md:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-black dark:border-white text-black dark:text-white text-xs font-mono font-bold tracking-widest uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
            {t.auth.badge}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-black dark:bg-white flex items-center justify-center">
              <BrandLogo size={18} className="text-white dark:text-black" />
            </div>
            <span className="font-black text-xl text-black dark:text-white uppercase tracking-widest hidden sm:inline-block">
              Try<span className="text-black dark:text-white">Klip</span>
            </span>
          </div>
        </div>

        {/* Form card */}
        <div className="border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6 md:p-8 relative">

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
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-black uppercase text-black dark:text-white leading-[1.05] tracking-tight mx-auto mb-3">
                  {t.auth.signinTitle1} <span className="text-black dark:text-white">{t.auth.signinTitle2}</span>
                </h2>
                <span className="block font-mono text-[10px] tracking-widest text-black/40 dark:text-white/30 uppercase">{t.auth.signinSub}</span>
              </div>

              <AuthInput
                icon={<Mail size={15} />}
                label={t.auth.labelEmail}
                type="email"
                placeholder={t.auth.placeholderEmail}
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                error={fieldErrors.siEmail}
                autoComplete="email"
              />

              <AuthInput
                icon={<Lock size={15} />}
                label={t.auth.labelPassword}
                type={siShowPw ? "text" : "password"}
                placeholder={t.auth.placeholderPassword}
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
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#d1d5db] dark:hover:shadow-[6px_6px_0px_#374151] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {t.auth.btnSignin}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <p className="text-center font-mono text-[10px] tracking-widest text-black/40 dark:text-white/30 uppercase pt-6 border-t border-black/10 dark:border-white/10 mt-6">
                {t.auth.noAccount}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-black dark:text-white hover:underline font-bold ml-1"
                >
                  {t.auth.linkRegister}
                </button>
              </p>
            </form>
          )}

          {/* ── SIGN UP ──────────────────────────────────────────────────────── */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-5" noValidate>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-black uppercase text-black dark:text-white leading-[1.05] tracking-tight mx-auto mb-3">
                  {t.auth.signupTitle1} <span className="text-black dark:text-white">{t.auth.signupTitle2}</span>
                </h2>
                <span className="block font-mono text-[10px] tracking-widest text-black/40 dark:text-white/30 uppercase">{t.auth.signupSub}</span>
              </div>

              <AuthInput
                icon={<User size={15} />}
                label={t.auth.labelName}
                type="text"
                placeholder={t.auth.placeholderName}
                value={suName}
                onChange={(e) => setSuName(e.target.value)}
                error={fieldErrors.suName}
                autoComplete="name"
              />

              <AuthInput
                icon={<Mail size={15} />}
                label={t.auth.labelEmail}
                type="email"
                placeholder={t.auth.placeholderEmail}
                value={suEmail}
                onChange={(e) => setSuEmail(e.target.value)}
                error={fieldErrors.suEmail}
                autoComplete="email"
              />

              <div>
                <AuthInput
                  icon={<Lock size={15} />}
                  label={t.auth.labelPassword}
                  type={suShowPw ? "text" : "password"}
                  placeholder={t.auth.placeholderNewPw}
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
                <PasswordStrengthBar
                  password={suPassword}
                  labels={{
                    length: t.auth.pwLength,
                    upper:  t.auth.pwUpper,
                    number: t.auth.pwNumber,
                    weak:   t.auth.pwWeak,
                    medium: t.auth.pwMedium,
                    strong: t.auth.pwStrong,
                  }}
                />
              </div>

              <AuthInput
                icon={<Lock size={15} />}
                label={t.auth.labelConfirm}
                type={suShowConfirm ? "text" : "password"}
                placeholder={t.auth.placeholderConfirm}
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
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#d1d5db] dark:hover:shadow-[6px_6px_0px_#374151] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={15} />
                    {t.auth.btnSignup}
                  </>
                )}
              </button>

              <p className="text-center font-mono text-[10px] tracking-widest text-black/40 dark:text-white/30 uppercase pt-6 border-t border-black/10 dark:border-white/10 mt-6">
                {t.auth.haveAccount}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-black dark:text-white hover:underline font-bold ml-1"
                >
                  {t.auth.linkLogin}
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <span className="block text-center font-mono text-[10px] tracking-widest text-black/40 dark:text-white/30 uppercase mt-6 px-4">
          {t.auth.footer}
        </span>
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