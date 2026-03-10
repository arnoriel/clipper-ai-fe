// src/pages/LandingPage.tsx
import { useEffect, useState } from "react";
import {
  Scissors,
  Sparkles,
  Zap,
  Timer,
  CreditCard,
  Play,
  Rocket,
  Check,
  Plus,
  Gift,
  Menu,
  ChevronDown,
  Target,
  Smartphone,
  Brain,
  Star,
  Tag,
  Flame,
  Building2,
  Gem,
  Infinity,
  Cloud,
  Handshake,
  HelpCircle,
  MessageCircle,
  Clock,
  Ban,
  RefreshCcw,
  Shield,
  TrendingUp,
  Eye,
  DollarSign,
  Mic,
  Video,
  Trophy,
  Book,
  Monitor,
  Scissors as ScissorsIcon,
  Lightbulb,
  ShoppingCart,
  AlertTriangle,
  TrendingDown,
  Repeat,
  Image,
  Palette,
  Droplets,
  Anchor,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import { Link } from "react-router-dom";

// --- Types & Interfaces ---
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  highlight: string;
  description: string;
}

interface PricingCardProps {
  name: string;
  credits: number;
  price: string;
  perCredit: string;
  popular?: boolean;
  discount?: string;
  icon: React.ReactNode;
}

interface FAQItemProps {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

// --- Utility Components ---
const TextGradient = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`bg-gradient-to-r from-[#1ABC71] to-[#16a085] bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

const CardElevated = ({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm ${hover ? 'hover:shadow-lg hover:border-[#1ABC71]/30 dark:hover:border-[#1ABC71]/30' : ''} transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const ButtonPrimary = ({ children, to, onClick, className = "", icon }: {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1ABC71] text-white font-bold rounded-2xl hover:bg-[#16a085] transition-all duration-300 shadow-lg shadow-[#1ABC71]/20 hover:shadow-xl hover:shadow-[#1ABC71]/30 hover:-translate-y-0.5 active:translate-y-0";

  const content = (
    <>
      {icon}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${className}`}>
      {content}
    </button>
  );
};

const ButtonSecondary = ({ children, to, onClick, className = "", icon }: {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-transparent text-gray-800 dark:text-gray-200 font-bold rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#1ABC71]/40 dark:hover:border-[#1ABC71]/40 hover:bg-[#1ABC71]/5 transition-all duration-300";

  const content = (
    <>
      {icon}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${className}`}>
      {content}
    </button>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Scrollspy logic
      const sections = ["fitur", "harga", "faq"];
      let current = "";

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Adjust threshold - if top is within upper half of screen
          if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.2) {
            current = section;
          }
        }
      }

      // If we are at the very bottom of the page, force the last section to be active
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        current = sections[sections.length - 1];
      }
      // If we're at the very top, clear active section
      else if (window.scrollY < 100) {
        current = "";
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    // Call once to set initial state
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If it's the logo pointing to "/", scroll to top
    if (href === "/") {
      if (window.location.pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    // Otherwise scroll to the specific ID
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);

      if (element) {
        // Offset by 80px to account for the fixed navbar
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
        setMobileMenuOpen(false);
      }
    }
  };

  const navLinks = [
    { href: "#fitur", label: "Fitur" },
    { href: "#harga", label: "Harga" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm" : "bg-transparent dark:bg-transparent"
      }`}>
      <div className="container mx-auto flex items-center justify-between px-5 py-4">
        <Link to="/" onClick={(e) => scrollToSection(e, "/")} className="flex items-center gap-2 font-bold text-xl cursor-pointer">
          <div className="h-9 w-9 rounded-xl bg-[#1ABC71] flex items-center justify-center">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="dark:text-white">AI Viral <TextGradient>Clipper</TextGradient></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.substring(1);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`transition-colors cursor-pointer ${isActive ? "text-[#1ABC71] font-bold" : "hover:text-[#1ABC71] dark:hover:text-[#1ABC71]"
                  }`}
              >
                {link.label}
              </a>
            );
          })}

          <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-6 lg:pl-8">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <ButtonPrimary to="/app" className="px-6 py-2.5 text-sm whitespace-nowrap" icon={<Rocket className="h-4 w-4" />}>
              Coba Sekarang
            </ButtonPrimary>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            className="text-gray-700 dark:text-gray-200 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-5 py-4 space-y-4">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.substring(1);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`block font-medium cursor-pointer ${isActive ? "text-[#1ABC71] font-bold" : "text-gray-600 hover:text-[#1ABC71]"
                  }`}
              >
                {link.label}
              </a>
            );
          })}
          <ButtonPrimary to="/app" className="w-full py-3 text-sm" icon={<Rocket className="h-4 w-4" />}>
            Coba Sekarang
          </ButtonPrimary>
        </div>
      )}
    </nav>
  );
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Background Decorations */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#1ABC71]/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1ABC71]/5 rounded-full blur-3xl" />

      {/* Dot Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle, #1ABC71 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />

      <div className="container mx-auto px-5 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1ABC71]/10 text-[#1ABC71] text-sm font-bold mb-6 border border-[#1ABC71]/20 hover:scale-105 transition-transform cursor-default">
            <Sparkles className="h-4 w-4" />
            AI Clipper Pertama di Indonesia
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight text-gray-900 dark:text-white">
            Video Panjang? <TextGradient>Otomatis Jadi Clip</TextGradient> Siap Upload
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-5 leading-relaxed">
            Tinggal upload, pilih gaya, AI yang kerjain sisanya. Langsung siap buat TikTok, Reels &amp; Shorts
          </p>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-8">
            {[
              { icon: Zap, text: "Simpel banget" },
              { icon: Timer, text: "Hemat waktu berjam-jam" },
              { icon: CreditCard, text: "Mulai dari Rp 1.500" },
            ].map((tag, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1.5 font-medium hover:bg-[#1ABC71]/10 dark:hover:bg-[#1ABC71]/20 hover:text-[#1ABC71] transition-colors cursor-default">
                <tag.icon className="h-4 w-4 text-[#1ABC71]" />
                {tag.text}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <ButtonPrimary to="/app" icon={<Rocket className="h-5 w-5" />}>
              Coba Sekarang
            </ButtonPrimary>
            <ButtonSecondary icon={<Play className="h-5 w-5 text-[#1ABC71]" />}>
              Lihat Demo
            </ButtonSecondary>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mt-8">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-b from-[#1ABC71]/20 via-[#1ABC71]/5 to-transparent blur-xl" />
            <img
              src="https://short-clip-lab.lovable.app/assets/hero-dashboard-BfIB42Ij.png"
              alt="AI Viral Clipper Dashboard"
              className="relative rounded-3xl border-2 border-gray-200 shadow-2xl w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const IntegrationsSection = () => {
  return (
    <section className="py-10 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-5">
        <p className="text-center text-sm font-bold text-gray-400 dark:text-gray-500 mb-6 tracking-widest uppercase">
          Siap Upload Ke & Didukung Oleh
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-16 opacity-60 dark:opacity-40 grayscale hover:grayscale-0 dark:hover:grayscale-0 focus-within:grayscale-0 cursor-default transition-all duration-500">
          <div className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors">
            <Video className="h-7 w-7" />
            <span className="text-2xl font-extrabold tracking-tighter">TikTok</span>
          </div>
          <div className="flex items-center gap-2 hover:text-[#E1306C] transition-colors">
            <Instagram className="h-7 w-7" />
            <span className="text-2xl font-extrabold tracking-tighter">Reels</span>
          </div>
          <div className="flex items-center gap-2 hover:text-[#FF0000] transition-colors">
            <Youtube className="h-8 w-8" />
            <span className="text-2xl font-extrabold tracking-tighter">Shorts</span>
          </div>
          <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex items-center gap-2 hover:text-[#10a37f] transition-colors">
            <Brain className="h-7 w-7" />
            <span className="text-2xl font-extrabold tracking-tight">OpenAI</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProblemSection = () => {
  const problems = [
    { icon: Clock, text: "Buang waktu 2–3 jam cuma buat 1 clip" },
    { icon: AlertTriangle, text: "Subtitle ribet & nggak konsisten" },
    { icon: HelpCircle, text: "Nggak tau bagian mana yang viral" },
    { icon: TrendingDown, text: "Sudah upload tapi view kecil" },
  ];

  return (
    <section className="py-20 sm:py-28 relative bg-white dark:bg-gray-900">
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-4 py-1.5 rounded-full mb-5">
            <Flame className="h-4 w-4" />
            Masalah Umum
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 tracking-tight text-gray-900 dark:text-white">
            Masih Potong Video <TextGradient>Manual?</TextGradient>
          </h2>

          <div className="w-48 sm:w-64 mx-auto mb-8">
            <img
              src="https://short-clip-lab.lovable.app/assets/illust-problem-BXpRa9fH.png"
              alt="Ilustrasi frustrasi edit video manual"
              className="w-full h-auto"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-10">
            {problems.map((problem, i) => (
              <CardElevated key={i} className="p-4 sm:p-5 flex items-center gap-3 text-left">
                <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <problem.icon className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <span className="text-gray-800 dark:text-gray-200 font-medium text-sm sm:text-base">{problem.text}</span>
              </CardElevated>
            ))}
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-lg flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#1ABC71]" />
            Waktunya kerja lebih <span className="text-[#1ABC71] font-bold">pintar</span>, bukan lebih lama
          </p>
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const headlineStyles = [
    {
      label: "Emoji Style",
      labelIcon: <Flame className="h-3 w-3" />,
      examples: ["STOP SCROLL!", "POV: Baru Sadar Ini", "Kamu HARUS Coba Ini!"]
    },
    {
      label: "Profesional",
      labelIcon: <Target className="h-3 w-3" />,
      examples: ["5 Strategi Terbukti Meningkatkan Revenue", "Framework yang Dipakai Top 1% Creator"]
    },
    {
      label: "Gaya Berita",
      labelIcon: <Monitor className="h-3 w-3" />,
      examples: ["BREAKING: Terungkap Cara Baru Monetisasi", "Riset Terbaru: 80% Creator Salah Strategi"]
    },
    {
      label: "Clean / Minimalis",
      labelIcon: <Scissors className="h-3 w-3" />,
      examples: ["Ini yang tidak pernah diajarkan siapapun", "Satu hal yang mengubah segalanya"]
    }
  ];

  const features: FeatureCardProps[] = [
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><Target className="h-6 w-6 text-[#1ABC71]" /></div>,
      title: "Auto Detect Momen Viral",
      highlight: "Biar AI yang cari, kamu tinggal duduk manis.",
      description: "AI scan seluruh transkrip & deteksi momen paling engaging. Langsung dapet bagian yang bikin orang berhenti scroll."
    },
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><Smartphone className="h-6 w-6 text-[#1ABC71]" /></div>,
      title: "Custom Crop per Platform",
      highlight: "Beda platform, beda crop. Otomatis!",
      description: "9:16 (TikTok/Reels), 4:5 (Instagram), 1:1 (Feed), 16:9 (YouTube). Wajah & momen penting selalu pas di frame."
    },
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><Brain className="h-6 w-6 text-[#1ABC71]" /></div>,
      title: "Manual Cut Mode",
      highlight: "Kamu bosnya. AI cuma asisten.",
      description: "Mau potong di detik ke-47? Silakan. Full kontrol timeline di tangan kamu."
    },
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><Sparkles className="h-6 w-6 text-[#1ABC71]" /></div>,
      title: "Subtitle Otomatis Viral Style",
      highlight: "Subtitle yang bikin nonton sampai habis.",
      description: "Bold putih + outline hitam ala kreator viral. Highlight warna otomatis di keyword penting."
    },
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><Tag className="h-6 w-6 text-[#1ABC71]" /></div>,
      title: "Branding Sendiri",
      highlight: "Clip kamu, identitas kamu.",
      description: "Upload logo, pasang watermark. Setiap clip yang keluar = marketing gratis buat brand kamu."
    }
  ];

  return (
    <section id="fitur" className="py-20 sm:py-28 relative">

      <div className="container mx-auto px-5 relative z-10">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            <Zap className="h-4 w-4" />
            Fitur Lengkap
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold max-w-3xl mx-auto tracking-tight text-gray-900 dark:text-white">
            Semua Yang Kamu Butuh Buat <TextGradient>Clip Viral</TextGradient>
          </h2>
          <div className="w-48 sm:w-64 mx-auto mt-6">
            <img
              src="https://short-clip-lab.lovable.app/assets/illust-solution-CyNhw-ht.png"
              alt="AI robot mengedit video otomatis"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Headline Hook Feature */}
        <CardElevated className="p-6 sm:p-8 mb-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-[#1ABC71]/10 flex items-center justify-center shrink-0">
              <Anchor className="h-6 w-6 text-[#1ABC71]" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                Headline Hook Otomatis
                <Anchor className="h-4 w-4 text-[#1ABC71]" />
              </h3>
              <p className="text-[#1ABC71] text-xs font-bold">AI pasang headline yang bikin orang berhenti scroll.</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-5 max-w-2xl">
            Pilih style yang cocok, dari fun penuh emoji, profesional, gaya berita, sampai clean.
          </p>
          <div className="space-y-4">
            {headlineStyles.map((style, i) => (
              <div key={i}>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#1ABC71]/10 text-[#1ABC71] mb-2">
                  {style.labelIcon}
                  {style.label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {style.examples.map((example, j) => (
                    <span key={j} className="inline-flex items-center px-3 sm:px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium cursor-pointer hover:border-[#1ABC71]/40 dark:hover:border-[#1ABC71]/40 hover:bg-[#1ABC71]/5 transition-all select-none">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardElevated>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto mb-6">
          {features.map((feature, i) => (
            <CardElevated key={i} className="p-5 sm:p-6 group">
              <div className="flex items-center gap-3 mb-3">
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{feature.title}</h3>
              <p className="text-[#1ABC71] text-xs font-bold mb-2">{feature.highlight}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </CardElevated>
          ))}
        </div>

        {/* Template Feature */}
        <CardElevated className="p-6 sm:p-8 max-w-5xl mx-auto">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-[#1ABC71]/10 flex items-center justify-center shrink-0">
              <Video className="h-6 w-6 text-[#1ABC71]" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">Simpan Sebagai Template Clip</h3>
              <p className="text-[#1ABC71] text-xs font-bold flex items-center gap-1"><Repeat className="h-3 w-3" /> Atur sekali, pakai selamanya</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-5 max-w-2xl">
            Bikin template clip lengkap: headline hook, logo, watermark, gaya teks, warna. Tinggal pilih video, pilih template, langsung jadi!
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: <Anchor className="h-3 w-3" />, label: "Headline Hook" },
              { icon: <Image className="h-3 w-3" />, label: "Logo & Watermark" },
              { icon: <Palette className="h-3 w-3" />, label: "Gaya Teks" },
              { icon: <Droplets className="h-3 w-3" />, label: "Warna Teks" },
            ].map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#1ABC71]/10 text-[#1ABC71] font-bold cursor-default">
                {tag.icon}
                {tag.label}
              </span>
            ))}
          </div>
        </CardElevated>
      </div>
    </section>
  );
};

const WhyDifferentSection = () => {
  const benefits = [
    { icon: Infinity, text: "Sekali beli, pakai selamanya (bukan langganan)" },
    { icon: Target, text: "1 credit = 1 menit video, simpel" },
    { icon: Cloud, text: "Upload dari file, YouTube, atau Google Drive" },
    { icon: Handshake, text: "Ajak teman, dapet komisi (affiliate)" },
    { icon: Zap, text: "Server cepat & stabil, gak nge-lag" },
  ];

  return (
    <section className="py-20 sm:py-28 relative bg-white dark:bg-gray-900">
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
              <Gem className="h-4 w-4" />
              Kenapa Beda
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Kenapa <TextGradient>Beda</TextGradient> Dari Yang Lain?
            </h2>
            <div className="w-48 sm:w-56 mx-auto mt-6">
              <img
                src="https://short-clip-lab.lovable.app/assets/illust-why-different-DfVTYG-X.png"
                alt="Ilustrasi keunggulan produk"
                className="w-full h-auto"
              />
            </div>
          </div>

          <CardElevated className="p-6 sm:p-8 space-y-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="h-5 w-5 text-[#1ABC71]" />
                </div>
                <div className="h-8 w-8 rounded-full bg-[#1ABC71]/15 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-[#1ABC71]" />
                </div>
                <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200">{benefit.text}</span>
              </div>
            ))}
          </CardElevated>
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const plans: PricingCardProps[] = [
    {
      name: "Ecer",
      credits: 1,
      price: "Rp 1.500",
      perCredit: "Rp 1.500 / credit",
      icon: <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500" />
    },
    {
      name: "Starter",
      credits: 100,
      price: "Rp 100.000",
      perCredit: "Rp 1.000 / credit",
      icon: <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500" />
    },
    {
      name: "Pro",
      credits: 350,
      price: "Rp 300.000",
      perCredit: "Rp 857 / credit",
      popular: true,
      discount: "Bonus 50 Credit",
      icon: <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-orange-500" />
    },
    {
      name: "Business",
      credits: 1000,
      price: "Rp 800.000",
      perCredit: "Rp 800 / credit",
      discount: "Hemat 20%",
      icon: <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500" />
    }
  ];

  const baseFeatures = [
    "Upload Video: File / YouTube / Google Drive",
    "Auto Detect Momen Viral, AI pilihkan momen engaging",
    "Manual Cut Mode, kontrol timeline",
    "Subtitle Standar, putih + outline hitam",
    "Headline Hook Basic",
    "Semua Aspect Ratio: 9:16 • 4:5 • 1:1 • 16:9",
    "Export 1080p Full HD",
    "Custom Watermark Text"
  ];

  const addOns = [
    { name: "AI Headline Premium Styles", desc: "Gaya headline Emoji, Profesional, Berita & Clean", credit: "+2 credit" },
    { name: "Keyword Highlight", desc: "Sorot kata kunci penting secara otomatis", credit: "+2 credit" },
    { name: "Advanced Subtitle", desc: "Tambahkan emoji, warna, font khusus", credit: "+2 credit" },
    { name: "Advanced Face Tracking Crop", desc: "Tracking wajah presisi untuk semua rasio", credit: "+3 credit" },
    { name: "Template Save & Apply", desc: "Simpan preset dan terapkan ke video baru", credit: "+2 credit" },
    { name: "Priority Render Queue", desc: "Antrian prioritas, render lebih cepat", credit: "+3 credit" },
    { name: "Analisis Video Panjang", desc: "Gak mau banyak clip? AI analisis video 1 jam kamu cuma 1 credit", credit: "+1 credit" },
  ];

  return (
    <section id="harga" className="py-20 sm:py-28 relative bg-gray-50 dark:bg-gray-950">
      <div className="absolute inset-0 opacity-30 dark:opacity-10" style={{
        backgroundImage: "radial-gradient(circle, #1ABC71 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />

      <div className="container mx-auto px-5 relative z-10">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            <DollarSign className="h-4 w-4" />
            Bayar Sesuai Pakai
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-gray-900 dark:text-white">
            Mulai dari <TextGradient>Rp 1.500</TextGradient> per Video
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-base sm:text-lg">
            Gak ada langganan bulanan. Beli credit sesuai kebutuhan, pakai kapan aja. Semakin banyak, semakin hemat.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 max-w-6xl mx-auto mt-12">
          {plans.map((plan, i) => (
            <CardElevated
              key={i}
              className={`rounded-2xl p-5 sm:p-7 text-center relative ${plan.popular ? 'border-2 border-[#1ABC71] bg-[#1ABC71]/5 shadow-lg' : ''}`}
              hover={!plan.popular}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1ABC71] text-white text-xs font-bold px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Star className="h-3 w-3 fill-white" /> POPULER
                </span>
              )}
              {plan.discount && !plan.popular && (
                <span className="absolute top-3 right-3 text-[10px] sm:text-xs font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-2 py-0.5 rounded-full">
                  {plan.discount}
                </span>
              )}
              {plan.discount && plan.popular && (
                <span className="absolute top-3 right-3 text-[10px] sm:text-xs font-bold text-[#1ABC71] bg-white px-2 py-0.5 rounded-full border border-[#1ABC71]">
                  {plan.discount}
                </span>
              )}

              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[#1ABC71]/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                {plan.icon}
              </div>

              <h3 className="font-bold text-lg sm:text-2xl text-gray-900 dark:text-white mb-1">{plan.name}</h3>
              <p className="text-[#1ABC71] font-extrabold text-2xl sm:text-3xl mb-1">
                {plan.credits} <span className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">Credit</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1">{plan.price}</p>
              <p className="text-xs text-gray-500 mb-4 sm:mb-6 flex items-center justify-center gap-1">
                <CreditCard className="h-3 w-3" />
                {plan.perCredit}
              </p>

              <ButtonPrimary
                to="/app"
                className={`w-full py-2.5 sm:py-3 text-sm sm:text-base ${plan.popular ? '' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-[#1ABC71]/10 dark:hover:bg-[#1ABC71]/20 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] shadow-none border-none'}`}
                icon={<ShoppingCart className="h-4 w-4" />}
              >
                Beli Credit
              </ButtonPrimary>
            </CardElevated>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8 flex items-center justify-center gap-2">
          <Ban className="h-4 w-4 text-gray-400" />
          Tidak ada subscription. Tidak ada hidden fee. Bayar hanya fitur yang kamu pakai.
        </p>

        {/* Features Breakdown */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto mt-16 sm:mt-20">
          <CardElevated className="p-6 sm:p-8">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Check className="h-5 w-5 text-[#1ABC71]" />
              Base Processing
            </h3>
            <p className="text-gray-500 text-sm mb-5">Termasuk di setiap 1 credit / menit video</p>
            <ul className="space-y-2.5">
              {baseFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Check className="h-4 w-4 text-[#1ABC71] shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardElevated>

          <CardElevated className="p-6 sm:p-8">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#1ABC71]" />
              Add-on Features
            </h3>
            <p className="text-gray-500 text-sm mb-5">Aktifkan sesuai kebutuhan, bayar credit tambahan</p>
            <ul className="space-y-3">
              {addOns.map((addon, i) => (
                <li key={i} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <span className="text-gray-800 dark:text-gray-200 font-semibold">{addon.name}</span>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{addon.desc}</p>
                  </div>
                  <span className="shrink-0 text-[#1ABC71] font-bold text-xs bg-[#1ABC71]/10 px-2 py-1 rounded-lg whitespace-nowrap">
                    {addon.credit}
                  </span>
                </li>
              ))}
            </ul>
          </CardElevated>
        </div>

        {/* Calculation Example */}
        <CardElevated className="max-w-md mx-auto mt-12 sm:mt-14 p-6 text-center">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Contoh Kalkulasi
          </p>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Video 10 menit = <span className="text-gray-900 dark:text-white font-medium">10 credit (base)</span></p>
            <p>+ Auto Detect Viral = <span className="text-[#1ABC71] font-bold">+5 credit</span></p>
            <p>+ Emoji Subtitle = <span className="text-[#1ABC71] font-bold">+2 credit</span></p>
            <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
              <p className="text-gray-900 dark:text-white font-extrabold text-lg flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-[#1ABC71]" />
                Total: 17 Credit
              </p>
            </div>
          </div>
        </CardElevated>
      </div>
    </section>
  );
};

const AudienceSection = () => {
  const audiences = [
    { icon: ScissorsIcon, label: "Freelancer Clipper" },
    { icon: Mic, label: "Podcaster" },
    { icon: Video, label: "Content Creator" },
    { icon: Trophy, label: "Personal Branding Coach" },
    { icon: Building2, label: "Agency Clipper" },
    { icon: Book, label: "Edukator Online" },
    { icon: Monitor, label: "Webinar Host" },
  ];

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white dark:bg-gray-900">
      <div className="container mx-auto px-5">
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            <Target className="h-4 w-4" />
            Untuk Siapa
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Siapa Yang Cocok Pakai Ini?
          </h2>
          <div className="w-56 sm:w-72 mx-auto mt-6">
            <img
              src="https://short-clip-lab.lovable.app/assets/illust-audience-C37OaC17.png"
              alt="Ilustrasi target audience kreator"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Desktop Tags */}
        <div className="hidden sm:flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-10">
          {audiences.map((audience, i) => (
            <CardElevated
              key={i}
              className="rounded-full px-5 py-3 flex items-center gap-2 cursor-default">
              <div className="h-7 w-7 rounded-full bg-[#1ABC71]/10 flex items-center justify-center">
                <audience.icon className="h-4 w-4 text-[#1ABC71]" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{audience.label}</span>
            </CardElevated>
          ))}
        </div>

        {/* Mobile Tags - Simplified */}
        <div className="sm:hidden flex flex-wrap justify-center gap-2 max-w-md mx-auto mb-10">
          {audiences.map((audience, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-2"
            >
              <audience.icon className="h-4 w-4 text-[#1ABC71]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{audience.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400 text-lg flex items-center justify-center gap-2">
          Kalau kamu bikin konten panjang → <span className="text-[#1ABC71] font-bold">ini wajib punya.</span>
          <Check className="h-5 w-5 text-[#1ABC71]" />
        </p>
      </div>
    </section>
  );
};

const ImagineSection = () => {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden dark:bg-gray-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1ABC71]/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-5 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            <Brain className="h-4 w-4" />
            Bayangkan Ini
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-gray-900 dark:text-white">
            Konten panjang tanpa distribusi = <TextGradient>potensi terbuang</TextGradient>
          </h2>

          <div className="w-56 sm:w-72 mx-auto my-6">
            <img
              src="https://short-clip-lab.lovable.app/assets/illust-imagine-B4P396rs.png"
              alt="Ilustrasi distribusi konten ke berbagai platform"
              className="w-full h-auto"
            />
          </div>


          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-[#1ABC71]" />
            AI Viral Clipper bantu kamu maksimalkan setiap menit jadi peluang exposure
          </p>

          <CardElevated className="p-6 sm:p-8 mb-6">
            <p className="text-lg sm:text-xl mb-6 text-gray-900 dark:text-white font-semibold flex items-center justify-center gap-2 flex-wrap">
              <Mic className="h-5 w-5 text-[#1ABC71]" />
              1 podcast <span className="text-[#1ABC71] font-extrabold">1 jam</span> → Bisa jadi <span className="text-[#1ABC71] font-extrabold">20–40 short clip</span>
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, text: "Lebih banyak distribusi" },
                { icon: Eye, text: "Lebih banyak exposure" },
                { icon: DollarSign, text: "Lebih banyak peluang cuan" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50 rounded-xl py-3 px-3">
                  <item.icon className="h-5 w-5 text-[#1ABC71]" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </CardElevated>

          <CardElevated className="p-5 sm:p-6 space-y-3 text-left">
            <h3 className="font-bold text-lg text-center text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-[#1ABC71]" />
              Tanpa Risiko Ribet
            </h3>
            {[
              { icon: RefreshCcw, text: "Credit otomatis kembali jika gagal render" },
              { icon: Shield, text: "Sistem stabil & scalable" },
              { icon: Ban, text: "Tidak ada kontrak bulanan" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#1ABC71]/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-[#1ABC71]" />
                </div>
                <span className="text-gray-800 dark:text-gray-300 font-medium">{item.text}</span>
              </div>
            ))}
          </CardElevated>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="py-20 sm:py-28 relative bg-white dark:bg-gray-900">
      <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{
        backgroundImage: "radial-gradient(circle, #1ABC71 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />

      <div className="container mx-auto px-5 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-gray-900 dark:text-white">
            Udah Capek Edit Manual? <TextGradient>Coba Aja Dulu</TextGradient>
          </h2>

          <div className="w-48 sm:w-60 mx-auto my-6">
            <img
              src="https://short-clip-lab.lovable.app/assets/illust-cta-RjJScGTS.png"
              alt="Ilustrasi rocket launch mulai sekarang"
              className="w-full h-auto"
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
            Upload 1 video, lihat hasilnya sendiri. Gak cocok? Gak masalah, gak ada langganan.
          </p>

          <ButtonPrimary to="/app" icon={<Rocket className="h-5 w-5" />} className="px-10 py-4 text-lg">
            Coba AI Viral Clipper
          </ButtonPrimary>
        </div>

        <div className="max-w-2xl mx-auto">
          <CardElevated className="p-6 sm:p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#1ABC71]/10 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-7 w-7 text-[#1ABC71]" />
            </div>
            <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
              <Handshake className="h-6 w-6 text-[#1ABC71]" />
              Partner Resmi AI Viral Clipper
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Jadi bagian dari ekosistem kreator dan dapatkan komisi dari setiap user yang kamu referensikan<br />
              Simple. Transparan. Scalable.
            </p>
            <ButtonSecondary className="px-6 py-3" icon={<Sparkles className="h-4 w-4" />}>
              Gabung Program Affiliate
            </ButtonSecondary>
          </CardElevated>
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItemProps[] = [
    {
      icon: <HelpCircle className="h-4 w-4 text-[#1ABC71]" />,
      question: "Harus bisa edit?",
      answer: "Tidak sama sekali! AI Viral Clipper dirancang untuk pemula. Tinggal upload video, AI akan otomatis mendeteksi momen viral dan membuat clip siap upload. Kamu bisa langsung download dan post ke TikTok/Reels/Shorts tanpa perlu edit manual."
    },
    {
      icon: <Scissors className="h-4 w-4 text-[#1ABC71]" />,
      question: "Bisa pakai subtitle sendiri?",
      answer: "Ya! Kamu bisa upload file SRT atau VTT sendiri, atau biarkan AI generate subtitle otomatis dengan style viral (bold putih + outline hitam) yang sudah terbukti meningkatkan engagement."
    },
    {
      icon: <Smartphone className="h-4 w-4 text-[#1ABC71]" />,
      question: "Bisa pakai HP?",
      answer: "Saat ini AI Viral Clipper berbasis web dan optimal di desktop/laptop untuk pengalaman edit yang lebih baik. Namun, kamu tetap bisa akses via browser HP untuk upload dan download hasil clip."
    },
    {
      icon: <Timer className="h-4 w-4 text-[#1ABC71]" />,
      question: "Ada batas durasi?",
      answer: "Kamu bisa upload video hingga 2 jam! 1 credit = 1 menit video. Jadi video 30 menit = 30 credit. Semakin panjang video, semakin banyak clip viral yang bisa dihasilkan."
    }
  ];

  return (
    <section id="faq" className="py-20 sm:py-28 relative bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-5">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <MessageCircle className="h-8 w-8 text-[#1ABC71]" />
            Pertanyaan Umum
          </h2>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <CardElevated key={i} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left font-bold text-gray-900 dark:text-gray-200 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] transition-colors"
              >
                <span className="text-sm sm:text-base flex items-center gap-2">
                  {faq.icon}
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 sm:px-6 pb-4 sm:pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
                  {faq.answer}
                </div>
              )}
            </CardElevated>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
      <div className="container mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-6">
              <div className="h-9 w-9 rounded-xl bg-[#1ABC71] flex items-center justify-center">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white">AI Viral <TextGradient>Clipper</TextGradient></span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm leading-relaxed">
              Jadikan video panjangmu peluang cuan baru. Otomatis deteksi momen viral, auto-crop, dan generate subtitle ala kreator pro dalam hitungan menit.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] hover:border-[#1ABC71] dark:hover:border-[#1ABC71] hover:shadow-md transition-all">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-10 w-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] hover:border-[#1ABC71] dark:hover:border-[#1ABC71] hover:shadow-md transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-10 w-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] hover:border-[#1ABC71] dark:hover:border-[#1ABC71] hover:shadow-md transition-all">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="#" className="h-10 w-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] hover:border-[#1ABC71] dark:hover:border-[#1ABC71] hover:shadow-md transition-all">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-5">Produk</h4>
            <ul className="space-y-3">
              <li><a href="#fitur" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Fitur Utama</a></li>
              <li><a href="#harga" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Harga</a></li>
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Template</a></li>
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Update Terbaru</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-5">Perusahaan</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors flex items-center gap-2">Karir <span className="text-[10px] font-bold bg-[#1ABC71] text-white px-2 py-0.5 rounded-full">Hiring</span></a></li>
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Kontak</a></li>
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Afiliasi</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-5">Legalitas</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Kebijakan Cookie</a></li>
              <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#1ABC71] dark:hover:text-[#1ABC71] text-sm font-medium transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium text-center md:text-left">
            © {currentYear} AI Viral Clipper. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium">
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> in Indonesia
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Main Landing Page Component ---
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans selection:bg-[#1ABC71]/20">
      <Navbar />
      <main>
        <HeroSection />
        <IntegrationsSection />
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
  );
};

export default LandingPage;