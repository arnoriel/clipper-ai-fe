// src/components/CreditModal.tsx
import { useState } from "react";
import { X, Zap, Star, Briefcase, ShoppingBag, Check, ChevronRight, Copy, MessageCircle } from "lucide-react";

interface Props {
  currentCredits: number;
  onClose: () => void;
}

interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
  icon: typeof Zap;
  gradient: string;
}

const PACKAGES: Package[] = [
  {
    id:            "ecer",
    name:          "Ecer",
    credits:       1,
    price:         1500,
    pricePerCredit: 1500,
    icon:          ShoppingBag,
    gradient:      "from-gray-700 to-gray-600",
  },
  {
    id:            "starter",
    name:          "Starter",
    credits:       100,
    price:         100000,
    pricePerCredit: 1000,
    icon:          Zap,
    gradient:      "from-blue-600 to-blue-500",
  },
  {
    id:            "pro",
    name:          "Pro",
    credits:       350,
    price:         300000,
    pricePerCredit: 857,
    badge:         "POPULER",
    badgeColor:    "bg-[#000000]",
    highlight:     true,
    icon:          Star,
    gradient:      "from-[#000000] to-emerald-500",
  },
  {
    id:            "business",
    name:          "Business",
    credits:       1000,
    price:         800000,
    pricePerCredit: 800,
    badge:         "HEMAT 20%",
    badgeColor:    "bg-orange-500",
    icon:          Briefcase,
    gradient:      "from-orange-500 to-orange-400",
  },
];

const CS_WHATSAPP = "+6285608160503";
const QR_IMAGE    = "/qr.jpg";

function formatRp(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function CreditModal({ currentCredits, onClose }: Props) {
  const [step, setStep]         = useState<"packages" | "payment">("packages");
  const [selected, setSelected] = useState<Package | null>(null);
  const [copied, setCopied]     = useState(false);

  function handleSelectPackage(pkg: Package) {
    setSelected(pkg);
    setStep("payment");
  }

  function handleCopyAmount() {
    if (!selected) return;
    navigator.clipboard.writeText(String(selected.price)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsApp() {
    if (!selected) return;
    const msg = encodeURIComponent(
      `Halo, saya ingin membeli paket *${selected.name}* (${selected.credits} credit) senilai ${formatRp(selected.price)}.\n\nSaya sudah transfer, berikut bukti pembayarannya:`
    );
    window.open(`https://wa.me/${CS_WHATSAPP.replace(/\D/g, "")}?text=${msg}`, "_blank");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-[#0e0e0e] sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ maxHeight: "95dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
          {step === "payment" ? (
            <button
              onClick={() => setStep("packages")}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ChevronRight size={14} className="rotate-180" />
              Ganti paket
            </button>
          ) : (
            <div>
              <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                Top Up Credit
              </h2>
              <p className="text-[11px] text-white/40 mt-0.5">
                Saldo kamu: <span className="text-[#000000] font-bold">{currentCredits} credit</span>
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(95dvh - 70px)" }}>

          {/* ══ STEP 1: Packages ══ */}
          {step === "packages" && (
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-white/30 text-center mb-2">
                1 credit = 1 analisis video <span className="text-white/15">atau</span> 1 auto-subtitle
              </p>

              {PACKAGES.map((pkg) => {
                const Icon = pkg.icon;
                const bonusCredits = pkg.id === "pro" ? 50 : 0;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full group relative rounded-2xl border overflow-hidden transition-all duration-200 text-left hover:scale-[1.01] active:scale-[0.99] ${
                      pkg.highlight
                        ? "border-[#000000]/50 bg-[#000000]/8 hover:bg-[#000000]/12"
                        : "border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/6"
                    }`}
                  >
                    {pkg.badge && (
                      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${pkg.badgeColor}`}>
                        {pkg.badge}
                      </div>
                    )}

                    <div className="p-4 flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center shrink-0`}>
                        <Icon size={20} className="text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-base font-bold text-white">{pkg.name}</span>
                          <span className="text-lg font-black text-white">
                            {pkg.credits.toLocaleString("id-ID")}
                            <span className="text-sm font-normal text-white/50 ml-1">credit</span>
                          </span>
                          {bonusCredits > 0 && (
                            <span className="text-[10px] text-[#000000] font-bold bg-[#000000]/15 px-1.5 py-0.5 rounded-full">
                              +{bonusCredits} bonus
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-sm font-bold text-white">{formatRp(pkg.price)}</span>
                          <span className="text-[11px] text-white/30">{formatRp(pkg.pricePerCredit)} / credit</span>
                        </div>
                      </div>

                      <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors shrink-0" />
                    </div>
                  </button>
                );
              })}

              <p className="text-[10px] text-white/20 text-center pt-2 leading-relaxed">
                Harga sudah termasuk PPN. Pembelian bersifat final & tidak dapat dikembalikan.
              </p>
            </div>
          )}

          {/* ══ STEP 2: Payment ══ */}
          {step === "payment" && selected && (
            <div className="p-4 space-y-4">
              {/* Package summary */}
              <div className={`rounded-2xl p-4 bg-gradient-to-br ${selected.gradient} bg-opacity-15`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selected.gradient} flex items-center justify-center shrink-0`}>
                    <selected.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Paket {selected.name}</p>
                    <p className="text-[11px] text-white/60">
                      {selected.credits.toLocaleString("id-ID")} credit
                      {selected.id === "pro" && " + 50 bonus"}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-lg font-black text-white">{formatRp(selected.price)}</p>
                    <p className="text-[10px] text-white/40">{formatRp(selected.pricePerCredit)}/credit</p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-white/50 font-medium">Scan QR untuk bayar via QRIS</p>
                <div className="rounded-2xl border border-white/15 bg-white p-3 shadow-lg">
                  <img
                    src={QR_IMAGE}
                    alt="QRIS Payment"
                    className="w-48 h-48 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192'%3E%3Crect width='192' height='192' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3EQR Code%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>

                {/* Amount to transfer */}
                <div className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/30 mb-0.5">Jumlah transfer</p>
                    <p className="text-xl font-black text-[#000000]">{formatRp(selected.price)}</p>
                  </div>
                  <button
                    onClick={handleCopyAmount}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      copied
                        ? "bg-[#000000]/30 text-[#000000] border border-[#000000]/40"
                        : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white border border-white/10"
                    }`}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Tersalin!" : "Salin"}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-2.5">
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Cara Pembayaran</p>
                {[
                  "Scan QR di atas menggunakan aplikasi e-wallet atau mobile banking kamu.",
                  `Bayar tepat sebesar ${formatRp(selected.price)}.`,
                  "Screenshot bukti pembayaran kamu.",
                  "Konfirmasi ke CS kami di WhatsApp dengan kirim bukti transfer.",
                  "Credit akan ditambahkan dalam 1×24 jam (biasanya dalam beberapa menit).",
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-[#000000]/20 text-[#000000] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[11px] text-white/50 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <button
                onClick={handleWhatsApp}
                className="w-full py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 transition-colors flex items-center justify-center gap-2.5 font-bold text-sm text-white shadow-lg shadow-green-900/30"
              >
                <MessageCircle size={18} />
                Konfirmasi via WhatsApp CS
              </button>

              <p className="text-[10px] text-white/20 text-center leading-relaxed">
                CS kami online Senin–Sabtu 09.00–21.00 WIB · Respon dalam 15 menit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}