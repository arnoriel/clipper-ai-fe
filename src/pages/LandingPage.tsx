// src/pages/LandingPage.tsx — Dark Neobrutalism / Terminal Aesthetic
import { useEffect, useState, createContext, useContext } from "react";
import { BrandLogo } from "../components/BrandLogo";
import {
  Sparkles, Zap, CreditCard, Rocket, Check,
  Gift, Menu, ChevronDown, Target, Smartphone, Brain,
  Tag, Flame, Building2, Infinity as InfinityIcon,
  Cloud, Handshake, HelpCircle, Clock, Ban,
  RefreshCcw, Shield, TrendingUp, Eye, DollarSign, Mic, Video,
  Trophy, Book, Monitor, Scissors as ScissorsIcon,
  ShoppingCart, AlertTriangle, TrendingDown, Anchor,
  Twitter, Instagram, Youtube, Facebook, Heart,
  Sun, Moon, X, Play, ArrowRight, ArrowDown, Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { content, type Lang } from "../locales/landing";

type LangContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof content["ID"];
};

export const LangContext = createContext<LangContextType>({
  lang: "ID",
  setLang: () => {},
  t: content["ID"],
});

// ── Grid Background ──────────────────────────────────────────────────────────
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

// ── Terminal Badge ───────────────────────────────────────────────────────────
const TermBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-black dark:border-white text-black dark:text-white text-xs font-mono font-bold tracking-widest uppercase">
    <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
    {children}
  </span>
);

// ── Terminal Card (light/dark aware) ─────────────────────────────────────────
const DarkCard = ({
  children,
  className = "",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) => (
  <div
    className={`border ${
      accent
        ? "border-black dark:border-white bg-black/5 dark:bg-white/5"
        : "border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02]"
    } ${className}`}
  >
    {children}
  </div>
);

// ── Primary Button ───────────────────────────────────────────────────────────
const PrimaryBtn = ({
  children,
  to,
  onClick,
  className = "",
  icon,
}: {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) => {
  const cls = `inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#d1d5db] dark:hover:shadow-[6px_6px_0px_#374151] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none ${className}`;
  if (to) return <Link to={to} className={cls}>{icon}{children}</Link>;
  return <button onClick={onClick} className={cls}>{icon}{children}</button>;
};

// ── Ghost Button ─────────────────────────────────────────────────────────────
const GhostBtn = ({
  children,
  to,
  onClick,
  className = "",
  icon,
}: {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) => {
  const cls = `inline-flex items-center justify-center gap-2 px-6 py-3 border border-black/30 dark:border-white/30 text-black dark:text-white font-black uppercase tracking-widest text-sm hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors duration-150 ${className}`;
  if (to) return <Link to={to} className={cls}>{icon}{children}</Link>;
  return <button onClick={onClick} className={cls}>{icon}{children}</button>;
};

// ── Mono Label ───────────────────────────────────────────────────────────────
const MonoLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-mono text-[10px] tracking-widest text-black/40 dark:text-white/30 uppercase ${className}`}>{children}</span>
);

// ── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ badge, title, accent }: { badge: string; title: React.ReactNode; accent?: string }) => (
  <div className="mb-14 text-center">
    <TermBadge>{badge}</TermBadge>
    <h2 className="mt-5 text-3xl sm:text-5xl font-black uppercase text-black dark:text-white leading-[1.05] tracking-tight mx-auto">
      {title}
      {accent && <> <span className="text-black dark:text-white">{accent}</span></>}
    </h2>
  </div>
);

// ── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { lang, setLang, t } = useContext(LangContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "dark"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const onScroll = () => setScrolled(window.scrollY > 20);
  useEffect(() => {
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? "border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="container mx-auto flex items-center justify-between px-5 md:px-8 py-4 max-w-7xl">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-black dark:bg-white flex items-center justify-center">
              <BrandLogo size={18} className="text-white dark:text-black" />
            </div>
            <span className="font-black text-sm text-black dark:text-white uppercase tracking-widest hidden sm:inline-block">
              Try<span className="text-black dark:text-white">Klip</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/" className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">{t.nav.home}</a>
            <a href="#harga" className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">{t.nav.pricing}</a>
          </div>
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setLangDropdown(!langDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-black dark:text-white font-mono text-[10px] font-bold min-w-[100px] justify-between z-10">
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3" /> {lang === "ID" ? "INDONESIA" : "ENGLISH"}
                </div>
                <ChevronDown className={`h-3 w-3 transition-transform ${langDropdown ? "rotate-180" : ""}`} />
              </button>
              {langDropdown && (
                <>
                  <div className="fixed inset-0 z-0" onClick={() => setLangDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-full bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 shadow-lg z-20 flex flex-col">
                    <button 
                      onClick={() => { setLang("ID"); setLangDropdown(false); }}
                      className="text-left px-3 py-2 font-mono text-[10px] font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-b border-black/10 dark:border-white/10">
                      INDONESIA
                    </button>
                    <button 
                      onClick={() => { setLang("EN"); setLangDropdown(false); }}
                      className="text-left px-3 py-2 font-mono text-[10px] font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                      ENGLISH
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} className="p-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-black dark:text-white">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/login" className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">
              {t.nav.login}
            </Link>
          </div>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-black dark:text-white p-1">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-black border-t border-black/10 dark:border-white/10 px-5 py-5 flex flex-col gap-4">
          <a href="/" className="font-mono text-xs font-bold uppercase tracking-widest text-black/80 dark:text-white/80 py-2">{t.nav.home}</a>
          <a href="#harga" className="font-mono text-xs font-bold uppercase tracking-widest text-black/80 dark:text-white/80 py-2">{t.nav.pricing}</a>
          <hr className="border-black/10 dark:border-white/10" />
          <div className="flex items-center justify-between">
            <div className="relative w-full mr-2 z-10">
              <button 
                onClick={() => setLangDropdown(!langDropdown)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/10 text-black dark:text-white font-mono text-xs font-bold w-full transition-colors relative">
                <Globe className="h-4 w-4" /> {lang === "ID" ? "INDONESIA" : "ENGLISH"}
                <ChevronDown className={`h-4 w-4 transition-transform absolute right-3 ${langDropdown ? "rotate-180" : ""}`} />
              </button>
              {langDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 shadow-lg flex flex-col z-20">
                  <button 
                    onClick={() => { setLang("ID"); setLangDropdown(false); }}
                    className="text-center px-3 py-3 font-mono text-xs font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-b border-black/10 dark:border-white/10">
                    INDONESIA
                  </button>
                  <button 
                    onClick={() => { setLang("EN"); setLangDropdown(false); }}
                    className="text-center px-3 py-3 font-mono text-xs font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    ENGLISH
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} className="p-2 bg-gray-100 dark:bg-white/10 text-black dark:text-white shrink-0">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <Link to="/login" className="font-mono text-xs font-bold uppercase tracking-widest text-black/80 dark:text-white/80 py-2 mt-4">{t.nav.login}</Link>
        </div>
      )}
    </nav>
  );
};

// ── Hero ─────────────────────────────────────────────────────────────────────
const HeroSection = () => {
  const { t } = useContext(LangContext);

  return (
    <section className="relative min-h-screen flex items-center pt-20 bg-white dark:bg-black overflow-hidden">
      <GridBg />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 dark:to-black/80 pointer-events-none" />

      <div className="container mx-auto px-5 py-24 relative z-10 max-w-6xl text-center">
        <div className="mb-8">
          <TermBadge>{t.hero.badge}</TermBadge>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black font-bricolage text-black dark:text-white leading-[1.1] tracking-tight mb-6 overflow-visible pb-3">
          {t.hero.title1}<br />
          {t.hero.title2} <span className="font-serif italic lowercase font-normal text-black dark:text-white">{t.hero.title3}</span>
        </h1>

        <p className="text-black/50 dark:text-white/50 text-base sm:text-lg max-w-xl mx-auto mb-12 leading-relaxed font-mono">
          {t.hero.desc1}<br />
          {t.hero.desc2}
        </p>

        {/* CTA Button */}
        <div className="max-w-2xl mx-auto mb-14">
          <PrimaryBtn to="/app" className="w-full py-4 justify-center text-sm" icon={<Rocket className="h-4 w-4" />}>
            {t.hero.btnCTA}
          </PrimaryBtn>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {t.hero.stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-black text-2xl text-black dark:text-white">{s.val}</div>
              <MonoLabel>{s.label}</MonoLabel>
            </div>
          ))}
        </div>

        {/* Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 border border-black/20 dark:border-white/20" />
          <div className="border border-black/10 dark:border-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-black/10 dark:border-white/10 bg-black/3 dark:bg-white/3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <MonoLabel className="ml-3">ai-viral-clipper — dashboard</MonoLabel>
            </div>
            <img
              src="https://short-clip-lab.lovable.app/assets/hero-dashboard-BfIB42Ij.png"
              alt="TryKlip Dashboard"
              className="w-full opacity-80"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Integrations ─────────────────────────────────────────────────────────────
const IntegrationsSection = () => {
  const { t } = useContext(LangContext);
  return (
    <section className="py-5 border-y border-black/8 dark:border-white/8 bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-5 max-w-6xl">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MonoLabel className="mr-6">{t.integrations.badge}</MonoLabel>
          {[
            { icon: <Video className="h-4 w-4" />, label: "TikTok" },
            { icon: <Instagram className="h-4 w-4" />, label: "Instagram Reels" },
            { icon: <Youtube className="h-5 w-5" />, label: "YouTube Shorts" },
            { icon: <Brain className="h-4 w-4" />, label: "OpenAI" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 border border-black/10 dark:border-white/8 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 font-mono text-xs uppercase tracking-wider transition-colors">
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Transformation ────────────────────────────────────────────────────────────
const TransformationSection = () => {
  const { t } = useContext(LangContext);
  return (
    <section className="py-20 sm:py-32 bg-white dark:bg-black relative border-t border-black/10 dark:border-white/5 overflow-hidden">
      <GridBg className="opacity-50" />
      <div className="container mx-auto px-5 max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-black dark:text-white mb-4 tracking-tight">
            {t.transformation.title}
          </h2>
          <p className="text-black/60 dark:text-white/60 font-mono text-sm max-w-2xl mx-auto">
            {t.transformation.desc}
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
          <div className="flex flex-col gap-4 w-full max-w-[320px]">
            <div className="border border-black/10 dark:border-white/10 p-4 bg-white dark:bg-black/40">
              <div className="aspect-video bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 relative">
                <Play className="h-8 w-8 text-black/20 dark:text-white/20" />
                <span className="absolute bottom-2 right-2 font-mono text-[10px] text-black/40 dark:text-white/30 bg-black/5 dark:bg-white/10 px-1">12:34</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-black dark:text-white mb-1">{t.transformation.vidTitle}</h3>
                <span className="font-mono text-xs text-black/40 dark:text-white/40">12:34</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center shrink-0">
            <ArrowRight className="hidden lg:block h-6 w-6 text-black/30 dark:text-white/30 mb-3" />
            <ArrowDown className="block lg:hidden h-6 w-6 text-black/30 dark:text-white/30 mb-3" />
            <span className="font-mono text-[10px] text-center text-black/40 dark:text-white/40 max-w-[120px] uppercase tracking-widest leading-relaxed">
              {t.transformation.processText1}<br />{t.transformation.processText2}
            </span>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-[480px]">
            {[
              { hook: t.transformation.hooks[0], score: 98 },
              { hook: t.transformation.hooks[1], score: 95 },
              { hook: t.transformation.hooks[2], score: 91 },
            ].map((clip, i) => (
              <div key={i} className="flex items-stretch border border-black/10 dark:border-white/10 bg-white dark:bg-black/40 group hover:border-black/5 dark:hover:border-white/50 transition-colors cursor-pointer shadow-sm">
                <div className="w-12 sm:w-14 flex items-center justify-center border-r border-black/10 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black/30 dark:text-white/30 group-hover:text-black dark:hover:text-white transition-colors ml-0.5" />
                </div>
                <div className="flex-1 px-4 py-3 sm:py-4 flex items-center">
                  <span className="font-bold text-xs sm:text-sm text-black/90 dark:text-white/90 group-hover:text-black dark:hover:text-white transition-colors">"{clip.hook}"</span>
                </div>
                <div className="px-3 sm:px-4 py-3 sm:py-4 border-l border-black/10 dark:border-white/10 flex items-center justify-center">
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-black dark:text-white border border-black/30 dark:border-white/30 bg-black/10 dark:bg-white/10 px-1.5 py-0.5 sm:px-2 sm:py-1">
                    {clip.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Problem ───────────────────────────────────────────────────────────────────
const ProblemSection = () => {
  const { t } = useContext(LangContext);
  const problems = [
    { icon: Clock, code: t.problem.items[0].code, text: t.problem.items[0].text },
    { icon: AlertTriangle, code: t.problem.items[1].code, text: t.problem.items[1].text },
    { icon: HelpCircle, code: t.problem.items[2].code, text: t.problem.items[2].text },
    { icon: TrendingDown, code: t.problem.items[3].code, text: t.problem.items[3].text },
  ];
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-black relative">
      <GridBg />
      <div className="container mx-auto px-5 max-w-6xl relative z-10">
        <div className="max-w-3xl mx-auto">
          <SectionHeader badge={t.problem.badge} title={t.problem.title1} accent={t.problem.title2} />
          <div className="grid sm:grid-cols-2 gap-3 mb-10">
            {problems.map((p, i) => (
              <DarkCard key={i} className="p-5 flex items-start gap-4">
                <div className="shrink-0">
                  <MonoLabel className="text-red-400">{p.code}</MonoLabel><br />
                  <p.icon className="h-5 w-5 text-red-400 mt-1" />
                </div>
                <span className="text-black/60 dark:text-white/70 font-mono text-sm leading-relaxed">{p.text}</span>
              </DarkCard>
            ))}
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 font-mono text-sm px-3 py-1.5 bg-black/20 dark:bg-white/20 text-black dark:text-white">
              <TrendingUp className="h-4 w-4 text-black dark:text-white" />
              <span>{t.problem.conclusion1} <span className="font-bold">{t.problem.conclusion2}</span>{t.problem.conclusion3}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Features ──────────────────────────────────────────────────────────────────
const FeaturesSection = () => {
  const { t } = useContext(LangContext);
  const headlineStyles = [
    { label: "Emoji Style", examples: ["STOP SCROLL!", "POV: Baru Sadar Ini", "WAJIB Coba Ini!"] },
    { label: "Profesional", examples: ["5 Strategi Meningkatkan Revenue", "Framework Top 1% Creator"] },
    { label: "Gaya Berita", examples: ["BREAKING: Cara Baru Monetisasi"] },
    { label: "Minimalis", examples: ["Satu hal yang mengubah segalanya"] },
  ];
  const features = [
    { icon: Target, code: t.features.items[0].code, title: t.features.items[0].title, desc: t.features.items[0].desc },
    { icon: Smartphone, code: t.features.items[1].code, title: t.features.items[1].title, desc: t.features.items[1].desc },
    { icon: Brain, code: t.features.items[2].code, title: t.features.items[2].title, desc: t.features.items[2].desc },
    { icon: Sparkles, code: t.features.items[3].code, title: t.features.items[3].title, desc: t.features.items[3].desc },
    { icon: Tag, code: t.features.items[4].code, title: t.features.items[4].title, desc: t.features.items[4].desc },
    { icon: Anchor, code: t.features.items[5].code, title: t.features.items[5].title, desc: t.features.items[5].desc },
  ];

  return (
    <>
      <section id="cara-kerja" className="py-20 sm:py-32 bg-white dark:bg-black relative border-t border-black/10 dark:border-white/5">
        <GridBg />
        <div className="container mx-auto px-5 max-w-5xl relative z-10">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-4xl sm:text-5xl font-black uppercase text-black dark:text-white mb-4 tracking-tight">
              {t.caraKerja.title}
            </h2>
            <p className="text-black/60 dark:text-white/60 font-mono text-sm">
              {t.caraKerja.desc}
            </p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-[24px] left-[16%] right-[16%] border-t border-dashed border-black/20 dark:border-white/20 -z-10" />
            <div className="grid md:grid-cols-3 gap-12 md:gap-4 relative">
              {[
                { num: t.caraKerja.steps[0].num, title: t.caraKerja.steps[0].title, desc: t.caraKerja.steps[0].desc, icon: Video },
                { num: t.caraKerja.steps[1].num, title: t.caraKerja.steps[1].title, desc: t.caraKerja.steps[1].desc, icon: Brain },
                { num: t.caraKerja.steps[2].num, title: t.caraKerja.steps[2].title, desc: t.caraKerja.steps[2].desc, icon: ScissorsIcon },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="relative mb-6">
                    <div className="w-12 h-12 bg-white dark:bg-black border border-black dark:border-white flex items-center justify-center font-mono text-lg font-bold text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                      {step.num}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-black p-1.5 border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60 group-hover:border-black dark:hover:border-white group-hover:text-black dark:hover:text-white transition-colors">
                      <step.icon className="h-3 w-3" />
                    </div>
                  </div>
                  <h3 className="font-black text-sm uppercase text-black dark:text-white mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-black/60 dark:text-white/50 font-mono text-xs leading-relaxed max-w-[260px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="py-20 sm:py-28 bg-white dark:bg-black relative">
        <GridBg />
        <div className="container mx-auto px-5 max-w-6xl relative z-10">
          <SectionHeader badge={t.features.badge} title={t.features.title1} accent={t.features.title2} />
          <DarkCard className="p-6 sm:p-8 mb-5" accent>
            <MonoLabel className="text-black dark:text-white mb-3 block">{t.features.headlineCard.label}</MonoLabel>
            <p className="text-black/50 dark:text-white/50 font-mono text-sm mb-5">{t.features.headlineCard.desc}</p>
            <div className="space-y-4">
              {headlineStyles.map((style, i) => (
                <div key={i}>
                  <MonoLabel className="text-black dark:text-white/70 mb-2 block">[{style.label}]</MonoLabel>
                  <div className="flex flex-wrap gap-2">
                    {style.examples.map((ex, j) => (
                      <span key={j} className="px-3 py-1.5 border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 font-mono text-xs hover:border-black/5 dark:hover:border-white/50 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DarkCard>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <DarkCard key={i} className="p-5 sm:p-6 group hover:border-black/30 dark:hover:border-white/30 transition-colors">
                <MonoLabel className="text-black dark:text-white/60 mb-2 block">{f.code}</MonoLabel>
                <div className="flex items-center gap-3 mb-3">
                  <f.icon className="h-4 w-4 text-black dark:text-white" />
                  <h3 className="font-black text-xs uppercase text-black dark:text-white tracking-tight">{f.title}</h3>
                </div>
                <p className="text-black/50 dark:text-white/40 font-mono text-xs leading-relaxed">{f.desc}</p>
              </DarkCard>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

// ── Why Different ─────────────────────────────────────────────────────────────
const WhyDifferentSection = () => {
  const { t } = useContext(LangContext);
  const benefits = [
    { icon: InfinityIcon, code: t.whyDifferent.benefits[0].code, text: t.whyDifferent.benefits[0].text },
    { icon: Target, code: t.whyDifferent.benefits[1].code, text: t.whyDifferent.benefits[1].text },
    { icon: Cloud, code: t.whyDifferent.benefits[2].code, text: t.whyDifferent.benefits[2].text },
    { icon: Handshake, code: t.whyDifferent.benefits[3].code, text: t.whyDifferent.benefits[3].text },
    { icon: Zap, code: t.whyDifferent.benefits[4].code, text: t.whyDifferent.benefits[4].text },
  ];
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-black relative border-t border-black/10 dark:border-white/5">
      <GridBg />
      <div className="container mx-auto px-5 max-w-6xl relative z-10">
        <div className="max-w-3xl mx-auto">
          <SectionHeader badge={t.whyDifferent.badge} title={t.whyDifferent.title1} accent={t.whyDifferent.title2} />
          <DarkCard className="divide-y divide-black/10 dark:divide-white/5">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-4 p-5 hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
                <MonoLabel className="text-black dark:text-white w-14 shrink-0">{b.code}</MonoLabel>
                <b.icon className="h-4 w-4 text-black dark:text-white shrink-0" />
                <span className="font-mono text-sm text-black/60 dark:text-white/60">{b.text}</span>
                <Check className="h-4 w-4 text-black dark:text-white ml-auto shrink-0" />
              </div>
            ))}
          </DarkCard>
        </div>
      </div>
    </section>
  );
};

// ── Pricing ───────────────────────────────────────────────────────────────────
const PricingSection = () => {
  const { t } = useContext(LangContext);
  const plans = [
    { name: "Ecer", credits: 1, price: "Rp 1.500", perCredit: "Rp 1.500/credit", icon: CreditCard },
    { name: "Starter", credits: 100, price: "Rp 100.000", perCredit: "Rp 1.000/credit", icon: Zap },
    { name: "Pro", credits: 350, price: "Rp 300.000", perCredit: "Rp 857/credit", popular: true, discount: "Bonus 50 Credit", icon: Flame },
    { name: "Business", credits: 1000, price: "Rp 800.000", perCredit: "Rp 800/credit", discount: "Hemat 20%", icon: Building2 },
  ];
  const baseFeatures = t.pricing.baseFeatures;
  const addOns = [
    { name: "AI Headline Premium", credit: "+2 cr" },
    { name: "Keyword Highlight", credit: "+2 cr" },
    { name: "Advanced Subtitle", credit: "+2 cr" },
    { name: "Face Tracking Crop", credit: "+3 cr" },
    { name: "Template Save & Apply", credit: "+2 cr" },
    { name: "Priority Render Queue", credit: "+3 cr" },
    { name: "Analisis Video Panjang", credit: "+1 cr" },
  ];

  return (
    <section id="harga" className="py-20 sm:py-28 bg-gray-50 dark:bg-black relative border-t border-black/10 dark:border-white/5">
      <GridBg />
      <div className="container mx-auto px-5 max-w-6xl relative z-10">
        <SectionHeader badge={t.pricing.badge} title={t.pricing.title1} accent={t.pricing.title2} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {plans.map((plan, i) => (
            <DarkCard key={i} className={`p-5 sm:p-6 relative ${plan.popular ? "border-black dark:border-white" : ""}`}>
              {plan.popular && (
                <div className="absolute top-3 right-3">
                  <MonoLabel className="text-black dark:text-white">★ {t.pricing.popular}</MonoLabel>
                </div>
              )}
              {plan.discount && !plan.popular && (
                <div className="absolute top-3 right-3">
                  <MonoLabel className="text-black/40 dark:text-white/40">{plan.discount}</MonoLabel>
                </div>
              )}
              <plan.icon className={`h-5 w-5 mb-3 ${plan.popular ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"}`} />
              <h3 className="font-black text-lg uppercase text-black dark:text-white mb-1">{plan.name}</h3>
              <MonoLabel className="mb-3 block">{plan.credits} credit{plan.credits > 1 ? "s" : ""}</MonoLabel>
              <p className="font-mono text-sm text-black/50 dark:text-white/50 mb-1">{plan.price}</p>
              <MonoLabel className="mb-5 block">{plan.perCredit}</MonoLabel>
              {plan.popular
                ? <PrimaryBtn to="/app" icon={<ShoppingCart className="h-4 w-4" />} className="w-full py-2 text-xs justify-center">{t.pricing.buyBtn}</PrimaryBtn>
                : <GhostBtn to="/app" icon={<ShoppingCart className="h-4 w-4" />} className="w-full py-2 text-xs justify-center">{t.pricing.buyBtn}</GhostBtn>
              }
            </DarkCard>
          ))}
        </div>
        <div className="text-center mb-12">
          <MonoLabel>{t.pricing.noSub}</MonoLabel>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <DarkCard className="p-6 sm:p-8">
            <MonoLabel className="text-black dark:text-white mb-4 block">{t.pricing.baseLabel}</MonoLabel>
            <ul className="space-y-2.5">
              {baseFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2 font-mono text-sm text-black/60 dark:text-white/60">
                  <Check className="h-3.5 w-3.5 text-black dark:text-white shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </DarkCard>
          <DarkCard className="p-6 sm:p-8">
            <MonoLabel className="text-black dark:text-white mb-4 block">{t.pricing.addonLabel}</MonoLabel>
            <ul className="space-y-3">
              {addOns.map((a, i) => (
                <li key={i} className="flex items-center justify-between font-mono text-sm">
                  <span className="text-black/60 dark:text-white/60">{a.name}</span>
                  <span className="text-black dark:text-white border border-black/30 dark:border-white/30 px-2 py-0.5 text-[10px]">{a.credit}</span>
                </li>
              ))}
            </ul>
          </DarkCard>
        </div>
      </div>
    </section>
  );
};

// ── Audience ──────────────────────────────────────────────────────────────────
const AudienceSection = () => {
  const { t } = useContext(LangContext);
  const audiences = [
    { icon: ScissorsIcon, label: t.targetUsers.audiences[0] },
    { icon: Mic, label: t.targetUsers.audiences[1] },
    { icon: Video, label: t.targetUsers.audiences[2] },
    { icon: Trophy, label: t.targetUsers.audiences[3] },
    { icon: Building2, label: t.targetUsers.audiences[4] },
    { icon: Book, label: t.targetUsers.audiences[5] },
    { icon: Monitor, label: t.targetUsers.audiences[6] },
  ];
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-black border-t border-black/10 dark:border-white/5 relative">
      <GridBg />
      <div className="container mx-auto px-5 max-w-6xl relative z-10">
        <SectionHeader badge={t.targetUsers.badge} title={t.targetUsers.title1} accent={t.targetUsers.title2} />
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {audiences.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2.5 border border-black/10 dark:border-white/10 text-black/60 dark:text-white/50 font-mono text-xs uppercase tracking-wider hover:border-black/5 dark:hover:border-white/50 hover:text-black dark:hover:text-white transition-colors cursor-default">
              <a.icon className="h-3.5 w-3.5" /> {a.label}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 font-mono text-sm text-black/40 dark:text-white/30 text-center">
          <span className="text-black dark:text-white">&gt;</span>
          <span>{t.targetUsers.conclusion1}</span>
          <span className="text-black dark:text-white">{t.targetUsers.conclusion2}</span>
          <Check className="h-4 w-4 text-black dark:text-white" />
        </div>
      </div>
    </section>
  );
};

// ── Imagine ───────────────────────────────────────────────────────────────────
const ImagineSection = () => {
  const { t } = useContext(LangContext);
  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-black border-t border-black/10 dark:border-white/5 relative">
      <GridBg />
      <div className="container mx-auto px-5 max-w-6xl relative z-10">
        <div className="max-w-3xl mx-auto">
          <SectionHeader badge={t.imagine.badge} title={t.imagine.title1} accent={t.imagine.title2} />
          <DarkCard className="p-6 sm:p-8 mb-4" accent>
            <div className="font-black text-xl sm:text-2xl text-black dark:text-white uppercase mb-5 flex items-center gap-3 flex-wrap">
              <Mic className="h-5 w-5 text-black dark:text-white" />
              {t.imagine.podcast1} <span className="text-black dark:text-white">{t.imagine.podcast2}</span> → {t.imagine.podcast3} <span className="text-black dark:text-white">{t.imagine.podcast4}</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[{ icon: TrendingUp, text: t.imagine.outcomes[0] }, { icon: Eye, text: t.imagine.outcomes[1] }, { icon: DollarSign, text: t.imagine.outcomes[2] }].map((item, i) => (
                <div key={i} className="flex items-center gap-2 border border-black/10 dark:border-white/10 px-4 py-3 font-mono text-xs text-black/60 dark:text-white/50">
                  <item.icon className="h-4 w-4 text-black dark:text-white shrink-0" /> {item.text}
                </div>
              ))}
            </div>
          </DarkCard>
          <DarkCard className="p-5 sm:p-6">
            <MonoLabel className="text-black dark:text-white block mb-4">{t.imagine.zeroRisk}</MonoLabel>
            {[{ icon: RefreshCcw, text: t.imagine.guarantees[0] }, { icon: Shield, text: t.imagine.guarantees[1] }, { icon: Ban, text: t.imagine.guarantees[2] }].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-black/10 dark:border-white/5 last:border-0">
                <item.icon className="h-4 w-4 text-black dark:text-white shrink-0" />
                <span className="font-mono text-sm text-black/60 dark:text-white/50">{item.text}</span>
              </div>
            ))}
          </DarkCard>
        </div>
      </div>
    </section>
  );
};

// ── CTA ───────────────────────────────────────────────────────────────────────
const CTASection = () => {
  const { t } = useContext(LangContext);
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-black relative overflow-hidden border-t border-black/10 dark:border-white/5">
      <GridBg />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-black/5 dark:bg-white/5 blur-[120px] pointer-events-none" />
      <div className="container mx-auto px-5 max-w-6xl relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <TermBadge>{t.cta.badge}</TermBadge>
          <h2 className="mt-5 text-3xl sm:text-6xl font-black uppercase text-black dark:text-white leading-[0.95] tracking-tight mb-6">
            {t.cta.title1}<br />
            <span className="text-black dark:text-white">{t.cta.title2}</span>
          </h2>
          <p className="text-black/50 dark:text-white/40 font-mono text-sm mb-8">{t.cta.desc}</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <DarkCard className="p-6 sm:p-8 text-center" accent>
            <div className="h-12 w-12 border border-black/40 dark:border-white/40 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-6 w-6 text-black dark:text-white" />
            </div>
            <MonoLabel className="text-black dark:text-white block mb-2">{t.cta.affiliateLabel}</MonoLabel>
            <h3 className="font-black text-xl uppercase text-black dark:text-white mb-3 tracking-tight">{t.cta.affiliateTitle}</h3>
            <p className="text-black/50 dark:text-white/40 font-mono text-sm mb-6 whitespace-pre-line">{t.cta.affiliateDesc}</p>
            <GhostBtn icon={<Sparkles className="h-4 w-4" />} className="px-6 py-2.5 text-xs">
              {t.cta.affiliateBtn}
            </GhostBtn>
          </DarkCard>
        </div>
      </div>
    </section>
  );
};

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQSection = () => {
  const { t } = useContext(LangContext);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = t.faq.questions;

  return (
    <section id="faq" className="py-20 sm:py-28 bg-gray-50 dark:bg-black border-t border-black/10 dark:border-white/5 relative">
      <GridBg />
      <div className="container mx-auto px-5 max-w-6xl relative z-10">
        <SectionHeader badge={t.faq.badge} title={t.faq.title1} accent={t.faq.title2} />
        <div className="max-w-2xl mx-auto space-y-2">
          {faqs.map((faq, i) => (
            <DarkCard key={i} className="overflow-hidden">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="flex items-center gap-3 font-mono text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors">
                  <span className="text-black dark:text-white">&gt;</span> {faq.q}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-black/30 dark:text-white/30 transition-transform duration-200 ${openIndex === i ? "rotate-180 text-black dark:text-white" : ""}`} />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 font-mono text-sm text-black/60 dark:text-white/40 leading-relaxed border-t border-black/10 dark:border-white/5 pt-4 ml-8">
                  {faq.a}
                </div>
              )}
            </DarkCard>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Footer ────────────────────────────────────────────────────────────────────
const Footer = () => {
  const { lang, t } = useContext(LangContext);
  const year = new Date().getFullYear();
  return (
    <footer className="bg-white dark:bg-black border-t border-black/10 dark:border-white/8 pt-14 pb-8">
      <div className="container mx-auto px-5 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 bg-black dark:bg-white flex items-center justify-center">
                <BrandLogo size={16} className="text-white dark:text-black" />
              </div>
              <span className="font-black text-sm text-black dark:text-white uppercase tracking-widest">
                Try<span className="text-black dark:text-white">Klip</span>
              </span>
            </Link>
            <p className="text-black/50 dark:text-white/30 font-mono text-xs mb-6 max-w-sm leading-relaxed">
              {t.footer.desc}
            </p>
            <div className="flex gap-2">
              {[Twitter, Instagram, Youtube, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="h-8 w-8 border border-black/10 dark:border-white/10 flex items-center justify-center text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40 transition-colors">
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: t.footer.col1, links: lang === "ID"
              ? ["Fitur Utama|#fitur", "Harga|#harga", "Template|#", "Update|#"]
              : ["Core Features|#fitur", "Pricing|#harga", "Templates|#", "Updates|#"] },
            { title: t.footer.col2, links: lang === "ID"
              ? ["Tentang Kami|#", "Karir|#", "Kontak|#", "Afiliasi|#"]
              : ["About Us|#", "Careers|#", "Contact|#", "Affiliate|#"] },
            { title: t.footer.col3, links: lang === "ID"
              ? ["Syarat & Ketentuan|#", "Privasi|#", "Cookie|#", "Refund|#"]
              : ["Terms & Conditions|#", "Privacy|#", "Cookie|#", "Refund|#"] },
          ].map((col, i) => (
            <div key={i}>
              <MonoLabel className="text-black dark:text-white mb-4 block">{col.title}</MonoLabel>
              <ul className="space-y-2.5">
                {col.links.map((l, j) => {
                  const [label, href] = l.split("|");
                  return <li key={j}><a href={href} className="font-mono text-xs text-black/50 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">{label}</a></li>;
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-black/10 dark:border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <MonoLabel>© {year} TryKlip. {t.footer.rights}</MonoLabel>
          <MonoLabel className="flex items-center gap-1">
            {t.footer.madeWit} <Heart className="h-2.5 w-2.5 text-red-500 fill-red-500 mx-0.5" /> in Indonesia
          </MonoLabel>
        </div>
      </div>
    </footer>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const [lang, setLang] = useState<Lang>("ID");
  const t = content[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-black/20 dark:selection:bg-white/20 selection:text-black dark:selection:text-white">
        <Navbar />
        <main>
          <HeroSection />
          <IntegrationsSection />
          <TransformationSection />
          <ProblemSection />
          <FeaturesSection />
          <WhyDifferentSection />
          <PricingSection />
          <AudienceSection />
          <ImagineSection />
          <CTASection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </LangContext.Provider>
  );
};

export default LandingPage;
