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
  ChevronDown} from "lucide-react";
import { Link } from "react-router-dom";

// --- Types & Interfaces ---
interface FeatureCardProps {
  icon: React.ReactNode;
  emoji: string;
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
}

// --- Utility Components ---
const TextGradient = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`bg-gradient-to-r from-[#1ABC71] to-[#16a085] bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

const CardElevated = ({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${hover ? 'hover:shadow-lg hover:border-[#1ABC71]/30' : ''} transition-all duration-300 ${className}`}>
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
  const baseClasses = "inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-800 font-bold rounded-2xl border-2 border-gray-200 hover:border-[#1ABC71]/40 hover:bg-[#1ABC71]/5 transition-all duration-300";
  
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

// --- Section Components ---
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#fitur", label: "Fitur" },
    { href: "#harga", label: "Harga" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm" : "bg-transparent"
    }`}>
      <div className="container mx-auto flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-9 w-9 rounded-xl bg-[#1ABC71] flex items-center justify-center">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span>AI Viral <TextGradient>Clipper</TextGradient></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          {navLinks.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="hover:text-[#1ABC71] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <ButtonPrimary to="/app" className="px-6 py-2.5 text-sm">
            Coba Sekarang 🚀
          </ButtonPrimary>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-700 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-5 py-4 space-y-4">
          {navLinks.map((link) => (
            <a 
              key={link.href} 
              href={link.href}
              className="block text-gray-600 hover:text-[#1ABC71] font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <ButtonPrimary to="/app" className="w-full py-3 text-sm">
            Coba Sekarang 🚀
          </ButtonPrimary>
        </div>
      )}
    </nav>
  );
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-b from-white to-gray-50">
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
            AI Clipper Pertama di Indonesia 🇮🇩
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight text-gray-900">
            Video Panjang? <TextGradient>Otomatis Jadi Clip</TextGradient> Siap Upload ⚡
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-5 leading-relaxed">
            Tinggal upload, pilih gaya, AI yang kerjain sisanya. Langsung siap buat TikTok, Reels & Shorts 🎬
          </p>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-8">
            {[
              { icon: Zap, text: "Simpel banget" },
              { icon: Timer, text: "Hemat waktu berjam-jam" },
              { icon: CreditCard, text: "Mulai dari Rp 1.500" },
            ].map((tag, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-4 py-1.5 font-medium hover:bg-[#1ABC71]/10 hover:text-[#1ABC71] transition-colors cursor-default">
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

const ProblemSection = () => {
  const problems = [
    { emoji: "⏰", text: "Buang waktu 2–3 jam cuma buat 1 clip" },
    { emoji: "😩", text: "Subtitle ribet & nggak konsisten" },
    { emoji: "🤷", text: "Nggak tau bagian mana yang viral" },
    { emoji: "📉", text: "Sudah upload tapi view kecil" },
  ];

  return (
    <section className="py-20 sm:py-28 relative bg-white">
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-bold text-red-600 bg-red-50 px-4 py-1.5 rounded-full mb-5">
            💥 Masalah Umum
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 tracking-tight text-gray-900">
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
                <span className="text-2xl shrink-0">{problem.emoji}</span>
                <span className="text-gray-800 font-medium text-sm sm:text-base">{problem.text}</span>
              </CardElevated>
            ))}
          </div>

          <p className="text-gray-600 text-lg">
            Waktunya kerja lebih <span className="text-[#1ABC71] font-bold">pintar</span>, bukan lebih lama 💪
          </p>
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const headlineStyles = [
    {
      label: "🔥 Emoji Style",
      examples: ["STOP SCROLL! ⚠️", "POV: Baru Sadar Ini 😳", "Kamu HARUS Coba Ini! 🔥"]
    },
    {
      label: "🎯 Profesional",
      examples: ["5 Strategi Terbukti Meningkatkan Revenue", "Framework yang Dipakai Top 1% Creator"]
    },
    {
      label: "📰 Gaya Berita",
      examples: ["BREAKING: Terungkap Cara Baru Monetisasi", "Riset Terbaru: 80% Creator Salah Strategi"]
    },
    {
      label: "✍️ Clean / Tanpa Emoji",
      examples: ["Ini yang tidak pernah diajarkan siapapun", "Satu hal yang mengubah segalanya"]
    }
  ];

  const features: FeatureCardProps[] = [
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><span className="text-[#1ABC71] font-bold text-lg">🎯</span></div>,
      emoji: "🎯",
      title: "Auto Detect Momen Viral",
      highlight: "Biar AI yang cari, kamu tinggal duduk manis.",
      description: "AI scan seluruh transkrip & deteksi momen paling engaging. Langsung dapet bagian yang bikin orang berhenti scroll."
    },
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><span className="text-[#1ABC71] font-bold text-lg">📱</span></div>,
      emoji: "📱",
      title: "Custom Crop per Platform",
      highlight: "Beda platform, beda crop. Otomatis!",
      description: "9:16 (TikTok/Reels), 4:5 (Instagram), 1:1 (Feed), 16:9 (YouTube). Wajah & momen penting selalu pas di frame."
    },
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><span className="text-[#1ABC71] font-bold text-lg">🧠</span></div>,
      emoji: "🧠",
      title: "Manual Cut Mode",
      highlight: "Kamu bosnya. AI cuma asisten.",
      description: "Mau potong di detik ke-47? Silakan. Full kontrol timeline di tangan kamu."
    },
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><span className="text-[#1ABC71] font-bold text-lg">✨</span></div>,
      emoji: "✨",
      title: "Subtitle Otomatis Viral Style",
      highlight: "Subtitle yang bikin nonton sampai habis.",
      description: "Bold putih + outline hitam ala kreator viral. Highlight warna otomatis di keyword penting + emoji 🔥"
    },
    {
      icon: <div className="h-11 w-11 rounded-xl bg-[#1ABC71]/10 flex items-center justify-center group-hover:bg-[#1ABC71]/20 transition-colors"><span className="text-[#1ABC71] font-bold text-lg">🏷️</span></div>,
      emoji: "🏷️",
      title: "Branding Sendiri",
      highlight: "Clip kamu, identitas kamu.",
      description: "Upload logo, pasang watermark. Setiap clip yang keluar = marketing gratis buat brand kamu."
    }
  ];

  return (
    <section id="fitur" className="py-20 sm:py-28 relative">
      
      <div className="container mx-auto px-5 relative z-10">
        <div className="text-center mb-14">
          <span className="inline-block text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            ⚡ Fitur Lengkap
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold max-w-3xl mx-auto tracking-tight text-gray-900">
            Semua Yang Kamu Butuh Buat <TextGradient>Clip Viral</TextGradient> 🎬
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
              <span className="text-2xl">🪝</span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">Headline Hook Otomatis 🪝</h3>
              <p className="text-[#1ABC71] text-xs font-bold">AI pasang headline yang bikin orang berhenti scroll.</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-5 max-w-2xl">
            Pilih style yang cocok, dari fun penuh emoji, profesional, gaya berita, sampai clean.
          </p>
          <div className="space-y-4">
            {headlineStyles.map((style, i) => (
              <div key={i}>
                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#1ABC71]/10 text-[#1ABC71] mb-2">
                  {style.label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {style.examples.map((example, j) => (
                    <span key={j} className="inline-flex items-center px-3 sm:px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer hover:border-[#1ABC71]/40 hover:bg-[#1ABC71]/5 transition-all select-none">
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
                <span className="text-2xl">{feature.emoji}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-[#1ABC71] text-xs font-bold mb-2">{feature.highlight}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </CardElevated>
          ))}
        </div>

        {/* Template Feature */}
        <CardElevated className="p-6 sm:p-8 max-w-5xl mx-auto">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">🎬</span>
            <div>
              <h3 className="font-bold text-xl text-gray-900">Simpan Sebagai Template Clip</h3>
              <p className="text-[#1ABC71] text-xs font-bold">Atur sekali, pakai selamanya ♻️</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-5 max-w-2xl">
            Bikin template clip lengkap: headline hook, logo, watermark, gaya teks, warna. Tinggal pilih video, pilih template, langsung jadi!
          </p>
          <div className="flex flex-wrap gap-2">
            {["🪝 Headline Hook", "🖼️ Logo & Watermark", "🎨 Gaya Teks", "🌈 Warna Teks"].map((tag, i) => (
              <span key={i} className="text-xs px-4 py-2 rounded-full bg-[#1ABC71]/10 text-[#1ABC71] font-bold cursor-default">
                {tag}
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
    { emoji: "♾️", text: "Sekali beli, pakai selamanya (bukan langganan)" },
    { emoji: "🎯", text: "1 credit = 1 menit video, simpel" },
    { emoji: "☁️", text: "Upload dari file, YouTube, atau Google Drive" },
    { emoji: "🤝", text: "Ajak teman, dapet komisi (affiliate)" },
    { emoji: "⚡", text: "Server cepat & stabil, gak nge-lag" },
  ];

  return (
    <section className="py-20 sm:py-28 relative bg-white">
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
              💎 Kenapa Beda
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
              Kenapa <TextGradient>Beda</TextGradient> Dari Yang Lain? 🤔
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
                <span className="text-2xl shrink-0">{benefit.emoji}</span>
                <div className="h-8 w-8 rounded-full bg-[#1ABC71]/15 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-[#1ABC71]" />
                </div>
                <span className="text-base sm:text-lg font-medium text-gray-800">{benefit.text}</span>
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
      icon: <div className="text-3xl">🔥</div>
    },
    {
      name: "Business",
      credits: 1000,
      price: "Rp 800.000",
      perCredit: "Rp 800 / credit",
      discount: "Hemat 20%",
      icon: <div className="text-3xl">🏢</div>
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
    <section id="harga" className="py-20 sm:py-28 relative bg-gray-50">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle, #1ABC71 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />
      
      <div className="container mx-auto px-5 relative z-10">
        <div className="text-center mb-6">
          <span className="inline-block text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            💰 Bayar Sesuai Pakai
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-gray-900">
            Mulai dari <TextGradient>Rp 1.500</TextGradient> per Video 🎥
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-base sm:text-lg">
            Gak ada langganan bulanan. Beli credit sesuai kebutuhan, pakai kapan aja. Semakin banyak, semakin hemat ✌️
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
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1ABC71] text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  ⭐ POPULER
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
              
              <h3 className="font-bold text-lg sm:text-2xl text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-[#1ABC71] font-extrabold text-2xl sm:text-3xl mb-1">
                {plan.credits} <span className="text-sm sm:text-lg text-gray-600 font-medium">Credit</span>
              </p>
              <p className="text-gray-600 text-xs sm:text-sm mb-1">{plan.price}</p>
              <p className="text-xs text-gray-500 mb-4 sm:mb-6 flex items-center justify-center gap-1">
                <CreditCard className="h-3 w-3" />
                {plan.perCredit}
              </p>
              
              <ButtonPrimary 
                to="/app" 
                className={`w-full py-2.5 sm:py-3 text-sm sm:text-base ${plan.popular ? '' : 'bg-gray-100 text-gray-700 hover:bg-[#1ABC71]/10 hover:text-[#1ABC71] shadow-none'}`}
              >
                Beli Credit 🛒
              </ButtonPrimary>
            </CardElevated>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          🚫 Tidak ada subscription. Tidak ada hidden fee. Bayar hanya fitur yang kamu pakai.
        </p>

        {/* Features Breakdown */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto mt-16 sm:mt-20">
          <CardElevated className="p-6 sm:p-8">
            <h3 className="font-bold text-xl text-gray-900 mb-1 flex items-center gap-2">
              <Check className="h-5 w-5 text-[#1ABC71]" />
              Base Processing ✅
            </h3>
            <p className="text-gray-500 text-sm mb-5">Termasuk di setiap 1 credit / menit video</p>
            <ul className="space-y-2.5">
              {baseFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-[#1ABC71] shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardElevated>

          <CardElevated className="p-6 sm:p-8">
            <h3 className="font-bold text-xl text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#1ABC71]" />
              Add-on Features 🧩
            </h3>
            <p className="text-gray-500 text-sm mb-5">Aktifkan sesuai kebutuhan, bayar credit tambahan</p>
            <ul className="space-y-3">
              {addOns.map((addon, i) => (
                <li key={i} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <span className="text-gray-800 font-semibold">{addon.name}</span>
                    <p className="text-gray-500 text-xs">{addon.desc}</p>
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
          <p className="text-sm font-bold text-gray-900 mb-3">💡 Contoh Kalkulasi</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Video 10 menit = <span className="text-gray-900 font-medium">10 credit (base)</span></p>
            <p>+ Auto Detect Viral = <span className="text-[#1ABC71] font-bold">+5 credit</span></p>
            <p>+ Emoji Subtitle = <span className="text-[#1ABC71] font-bold">+2 credit</span></p>
            <div className="border-t border-gray-200 mt-3 pt-3">
              <p className="text-gray-900 font-extrabold text-lg">Total: 17 Credit 🎉</p>
            </div>
          </div>
        </CardElevated>
      </div>
    </section>
  );
};

const AudienceSection = () => {
  const audiences = [
    { emoji: "✂️", label: "Freelancer Clipper", rotate: -5 },
    { emoji: "🎙️", label: "Podcaster", rotate: 4 },
    { emoji: "🎥", label: "Content Creator", rotate: -3 },
    { emoji: "🏆", label: "Personal Branding Coach", rotate: 3 },
    { emoji: "🏢", label: "Agency Clipper", rotate: -4 },
    { emoji: "📚", label: "Edukator Online", rotate: 5 },
    { emoji: "💻", label: "Webinar Host", rotate: -2 },
  ];

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white">
      <div className="container mx-auto px-5">
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-block text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            🎯 Untuk Siapa
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Siapa Yang Cocok Pakai Ini? 🤩
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
              <span className="text-lg">{audience.emoji}</span>
              <span className="text-sm font-semibold text-gray-800">{audience.label}</span>
            </CardElevated>
          ))}
        </div>

        {/* Mobile Tags - Simplified */}
        <div className="sm:hidden flex flex-wrap justify-center gap-2 max-w-md mx-auto mb-10">
          {audiences.map((audience, i) => (
            <div 
              key={i} 
              className="bg-white rounded-full px-4 py-2 border border-gray-200 shadow-sm flex items-center gap-2"
            >
              <span>{audience.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{audience.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-lg">
          Kalau kamu bikin konten panjang → <span className="text-[#1ABC71] font-bold">ini wajib punya.</span> 💯
        </p>
      </div>
    </section>
  );
};

const ImagineSection = () => {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1ABC71]/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-5 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            🧠 Bayangkan Ini
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-gray-900">
            Konten panjang tanpa distribusi = <TextGradient>potensi terbuang 😱</TextGradient>
          </h2>
          
          <div className="w-56 sm:w-72 mx-auto my-6">
            <img 
                src="https://short-clip-lab.lovable.app/assets/illust-imagine-B4P396rs.png" 
                alt="Ilustrasi distribusi konten ke berbagai platform" 
                className="w-full h-auto"
            />
          </div>


          <p className="text-gray-600 text-lg mb-8">
            AI Viral Clipper bantu kamu maksimalkan setiap menit jadi peluang exposure ✨
          </p>

          <CardElevated className="p-6 sm:p-8 mb-6">
            <p className="text-lg sm:text-xl mb-6 text-gray-900 font-semibold">
              🎙️ 1 podcast <span className="text-[#1ABC71] font-extrabold">1 jam</span> → Bisa jadi <span className="text-[#1ABC71] font-extrabold">20–40 short clip</span> 🤯
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { emoji: "📈", text: "Lebih banyak distribusi" },
                { emoji: "👀", text: "Lebih banyak exposure" },
                { emoji: "💰", text: "Lebih banyak peluang cuan" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-gray-600 bg-gray-100 rounded-xl py-3 px-3">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </CardElevated>

          <CardElevated className="p-5 sm:p-6 space-y-3 text-left">
            <h3 className="font-bold text-lg text-center text-gray-900 mb-4">🔐 Tanpa Risiko Ribet</h3>
            {[
              { emoji: "🔄", text: "Credit otomatis kembali jika gagal render" },
              { emoji: "🛡️", text: "Sistem stabil & scalable" },
              { emoji: "🚫", text: "Tidak ada kontrak bulanan" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-gray-800 font-medium">{item.text}</span>
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
    <section className="py-20 sm:py-28 relative bg-white">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle, #1ABC71 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />
      
      <div className="container mx-auto px-5 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-gray-900">
            Udah Capek Edit Manual? 😮‍💨 <TextGradient>Coba Aja Dulu</TextGradient>
          </h2>
          
          <div className="w-48 sm:w-60 mx-auto my-6">
            <img 
                src="https://short-clip-lab.lovable.app/assets/illust-cta-RjJScGTS.png" 
                alt="Ilustrasi rocket launch mulai sekarang" 
                className="w-full h-auto"
            />
          </div>

          <p className="text-gray-600 text-lg mb-8">
            Upload 1 video, lihat hasilnya sendiri. Gak cocok? Gak masalah, gak ada langganan 😊
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
            <h3 className="font-bold text-2xl text-gray-900 mb-2">🤝 Partner Resmi AI Viral Clipper</h3>
            <p className="text-gray-600 mb-6">
              Jadi bagian dari ekosistem kreator dan dapatkan komisi dari setiap user yang kamu referensikan 💸<br/>
              Simple. Transparan. Scalable.
            </p>
            <ButtonSecondary className="px-6 py-3">
              Gabung Program Affiliate 🎉
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
      question: "🤔 Harus bisa edit?",
      answer: "Tidak sama sekali! AI Viral Clipper dirancang untuk pemula. Tinggal upload video, AI akan otomatis mendeteksi momen viral dan membuat clip siap upload. Kamu bisa langsung download dan post ke TikTok/Reels/Shorts tanpa perlu edit manual."
    },
    {
      question: "✍️ Bisa pakai subtitle sendiri?",
      answer: "Ya! Kamu bisa upload file SRT atau VTT sendiri, atau biarkan AI generate subtitle otomatis dengan style viral (bold putih + outline hitam) yang sudah terbukti meningkatkan engagement."
    },
    {
      question: "📱 Bisa pakai HP?",
      answer: "Saat ini AI Viral Clipper berbasis web dan optimal di desktop/laptop untuk pengalaman edit yang lebih baik. Namun, kamu tetap bisa akses via browser HP untuk upload dan download hasil clip."
    },
    {
      question: "⏱️ Ada batas durasi?",
      answer: "Kamu bisa upload video hingga 2 jam! 1 credit = 1 menit video. Jadi video 30 menit = 30 credit. Semakin panjang video, semakin banyak clip viral yang bisa dihasilkan."
    }
  ];

  return (
    <section id="faq" className="py-20 sm:py-28 relative bg-gray-50">
      <div className="container mx-auto px-5">
        <div className="text-center mb-10">
          <span className="inline-block text-sm font-bold text-[#1ABC71] bg-[#1ABC71]/10 px-4 py-1.5 rounded-full mb-5">
            ❓ FAQ
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Pertanyaan Umum 💬
          </h2>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <CardElevated key={i} className="border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left font-bold hover:text-[#1ABC71] transition-colors"
              >
                <span className="text-sm sm:text-base">{faq.question}</span>
                <ChevronDown 
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`} 
                />
              </button>
              {openIndex === i && (
                <div className="px-5 sm:px-6 pb-4 sm:pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
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
  return (
    <footer className="border-t border-gray-200 py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <p className="text-gray-600 text-base sm:text-lg mb-2">Bukan cuma tools. 🛠️</p>
          <p className="text-gray-600 text-base sm:text-lg">
            Konten panjang tanpa distribusi = potensi terbuang. <span className="text-[#1ABC71] font-bold">AI Viral Clipper</span> bantu kamu maksimalkan setiap menit jadi peluang exposure ✨
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <div className="h-6 w-6 rounded-md bg-[#1ABC71] flex items-center justify-center">
            <Scissors className="h-3.5 w-3.5 text-white" />
          </div>
          <span>© 2026 AI Viral Clipper. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

// --- Main Landing Page Component ---
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#1ABC71]/20">
      <Navbar />
      <main>
        <HeroSection />
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