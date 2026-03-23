// src/components/AutoEditPanel.tsx
// Template editor shown in the "Auto Edit" tab of FileUploadInput.
// Lets users configure aspect ratio, subtitle style, watermark, and color/speed,
// then either save as a reusable template or immediately generate all clips.
// [UPDATED] Added live WatermarkPreview that mirrors selected aspect ratio frame.

import { useState, useEffect, useRef } from "react";
import {
  Wand2, Save, ChevronDown, ChevronUp, Trash2, Loader2, Check,
  CreditCard, Zap, Image as ImageIcon, AlertCircle, Sparkles, Crop, RefreshCw,
} from "lucide-react";
import type { ClipTemplate } from "../lib/templates";
import {
  DEFAULT_TEMPLATE,
  fetchTemplates,
  createTemplateApi,
  updateTemplateApi,
  deleteTemplateApi,
  cacheWatermark,
  getCachedWatermark,
} from "../lib/templates";
import { SUBTITLE_PRESETS } from "../lib/storage";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Current credit balance */
  credits: number;
  /** Called when "Generate Videos" is clicked */
  onGenerate: (
    template: ClipTemplate,
    watermarkSrc: string | null
  ) => Promise<void>;
  onTopUpClick?: () => void;
  isLoading?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASPECT_RATIOS: {
  value: ClipTemplate["aspect_ratio"];
  label: string;
  desc: string;
}[] = [
  { value: "9:16",     label: "9:16",     desc: "TikTok/Reels" },
  { value: "16:9",     label: "16:9",     desc: "YouTube" },
  { value: "1:1",      label: "1:1",      desc: "Instagram" },
  { value: "4:3",      label: "4:3",      desc: "Classic" },
  { value: "original", label: "Original", desc: "Keep" },
];

// ─── WatermarkPreview ─────────────────────────────────────────────────────────
// Shows a scaled-down "video frame" with the correct aspect ratio, with the
// watermark image rendered at the exact position/size/opacity the user dialed in.

function WatermarkPreview({
  src,
  x,
  y,
  width,
  opacity,
  aspectRatio,
}: {
  src: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
  aspectRatio: ClipTemplate["aspect_ratio"];
}) {
  // Map aspect ratio string → numeric ratio (width / height)
  const ratioNum =
    aspectRatio === "9:16"   ? 9 / 16 :
    aspectRatio === "16:9"   ? 16 / 9 :
    aspectRatio === "1:1"    ? 1 :
    aspectRatio === "4:3"    ? 4 / 3 :
    /* original → default */ 16 / 9;

  const isPortrait = ratioNum < 1;
  const displayLabel = aspectRatio === "original" ? "16:9 (original)" : aspectRatio;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          Preview Posisi Watermark
        </p>
        <span className="text-[9px] font-mono text-[#000000] bg-[#000000]/10 border border-[#000000]/20 px-1.5 py-0.5 rounded-md">
          {displayLabel}
        </span>
      </div>

      {/* Frame wrapper — centres portrait, fills width for landscape/square */}
      <div className={`flex ${isPortrait ? "justify-center" : ""}`}>
        <div
          style={
            isPortrait
              ? {
                  position: "relative",
                  height: "148px",
                  width: `${148 * ratioNum}px`,
                  flexShrink: 0,
                }
              : {
                  position: "relative",
                  width: "100%",
                  aspectRatio: `${ratioNum}`,
                }
          }
          className="rounded-xl overflow-hidden border border-white/10 shadow-lg"
        >
          {/* ── Dark video-like background ── */}
          <div className="absolute inset-0 bg-gray-400" />

          {/* ── Subtle grid (rule-of-thirds feel) ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: [
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
                "linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              ].join(", "),
              backgroundSize: "33.33% 33.33%",
            }}
          />

          {/* ── Thin centre crosshair ── */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 bottom-0 bg-white/5"
              style={{ left: "50%", width: "1px" }}
            />
            <div
              className="absolute left-0 right-0 bg-white/5"
              style={{ top: "50%", height: "1px" }}
            />
          </div>

          {/* ── Corner bracket markers ── */}
          {(
            [
              { top: "4px",  left:  "4px",  borderTop: "1.5px solid rgba(255,255,255,0.2)", borderLeft:  "1.5px solid rgba(255,255,255,0.2)" },
              { top: "4px",  right: "4px",  borderTop: "1.5px solid rgba(255,255,255,0.2)", borderRight: "1.5px solid rgba(255,255,255,0.2)" },
              { bottom: "4px", left:  "4px", borderBottom: "1.5px solid rgba(255,255,255,0.2)", borderLeft:  "1.5px solid rgba(255,255,255,0.2)" },
              { bottom: "4px", right: "4px", borderBottom: "1.5px solid rgba(255,255,255,0.2)", borderRight: "1.5px solid rgba(255,255,255,0.2)" },
            ] as React.CSSProperties[]
          ).map((style, i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 pointer-events-none"
              style={style}
            />
          ))}

          {/* ── The watermark itself ── */}
          <img
            src={src}
            alt="watermark preview"
            draggable={false}
            style={{
              position: "absolute",
              left:      `${x * 100}%`,
              top:       `${y * 100}%`,
              width:     `${width * 100}%`,
              opacity,
              objectFit: "contain",
              maxWidth:  "none",
              transform: "translateZ(0)",
              filter:    "drop-shadow(0 0 4px rgba(26,188,113,0.45))",
            }}
          />

          {/* ── Soft vignette ── */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)",
            }}
          />
        </div>
      </div>

      {/* ── Numeric readout below frame ── */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {[
          { label: "X",    value: `${Math.round(x * 100)}%` },
          { label: "Y",    value: `${Math.round(y * 100)}%` },
          { label: "Size", value: `${Math.round(width * 100)}%` },
          { label: "Opac", value: `${Math.round(opacity * 100)}%` },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] uppercase tracking-wider text-gray-400 font-medium">
              {item.label}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#000000]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutoEditPanel({
  credits,
  onGenerate,
  onTopUpClick,
  isLoading,
}: Props) {
  const [template, setTemplate] = useState<ClipTemplate>({
    ...DEFAULT_TEMPLATE,
  });
  const [watermarkSrc, setWatermarkSrc] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<ClipTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("crop");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // ── Load saved templates on mount ────────────────────────────────────────
  useEffect(() => {
    fetchTemplates().then(setSavedTemplates);
  }, []);

  // ── Close dropdown when clicking outside ────────────────────────────────
  useEffect(() => {
    if (!showTemplateDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setShowTemplateDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTemplateDropdown]);

  // ── Load cached watermark when a saved template is selected ─────────────
  useEffect(() => {
    if (template.id && template.watermark_name) {
      setWatermarkSrc(getCachedWatermark(template.id));
    } else if (!template.id) {
      setWatermarkSrc(null);
    }
  }, [template.id]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function upd(partial: Partial<ClipTemplate>) {
    setTemplate((prev) => ({ ...prev, ...partial }));
  }

  function toggleSection(s: string) {
    setExpandedSection((prev) => (prev === s ? null : s));
  }

  function handleWatermarkFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setWatermarkSrc(src);
      upd({ watermark_name: file.name });
    };
    reader.readAsDataURL(file);
  }

  function removeWatermark() {
    setWatermarkSrc(null);
    upd({ watermark_name: null });
  }

  function loadSavedTemplate(saved: ClipTemplate) {
    setTemplate({ ...saved });
    if (saved.id && saved.watermark_name) {
      setWatermarkSrc(getCachedWatermark(saved.id));
    } else {
      setWatermarkSrc(null);
    }
    setShowTemplateDropdown(false);
  }

  // ── Save template ────────────────────────────────────────────────────────
  async function handleSave() {
    if (!template.name.trim()) {
      setSaveError("Nama template wajib diisi");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, user_id, created_at, updated_at, ...body } = template;
      let saved: ClipTemplate;
      if (id) {
        saved = await updateTemplateApi(id, body);
      } else {
        saved = await createTemplateApi(body);
      }
      if (saved.id && watermarkSrc) {
        cacheWatermark(saved.id, watermarkSrc);
      }
      setTemplate(saved);
      setSavedTemplates((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      setSaveError(e.message || "Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Delete a saved template ──────────────────────────────────────────────
  async function handleDeleteSaved(t: ClipTemplate) {
    if (!t.id) return;
    await deleteTemplateApi(t.id);
    setSavedTemplates((prev) => prev.filter((x) => x.id !== t.id));
    if (template.id === t.id) {
      setTemplate({ ...DEFAULT_TEMPLATE });
      setWatermarkSrc(null);
    }
  }

  const hasCredits = credits > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* ── Template name + Load saved ── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Wand2 size={13} className="text-[#000000]" />
          <span className="text-xs font-semibold text-gray-700 flex-1">
            Template
          </span>
          {savedTemplates.length > 0 && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowTemplateDropdown((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-[#000000] font-semibold hover:text-[#16a085] transition-colors"
              >
                Load Saved
                <ChevronDown
                  size={11}
                  className={`transition-transform ${
                    showTemplateDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showTemplateDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
                  {savedTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 group cursor-pointer"
                    >
                      <button
                        onClick={() => loadSavedTemplate(t)}
                        className="flex-1 text-left text-sm text-gray-700 truncate"
                      >
                        {t.name}
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(t)}
                        className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <input
          type="text"
          value={template.name}
          onChange={(e) => upd({ name: e.target.value })}
          placeholder="Nama template..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#000000]/60 bg-white"
        />
      </div>

      {/* ── Crop / Aspect Ratio ── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection("crop")}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <Crop size={13} className="text-[#000000] shrink-0" />
          <span className="text-xs font-semibold text-gray-700 flex-1">
            Crop & Aspect Ratio
          </span>
          <span className="text-[10px] text-gray-400 mr-2 font-mono">
            {template.aspect_ratio}
          </span>
          {expandedSection === "crop" ? (
            <ChevronUp size={12} className="text-gray-400" />
          ) : (
            <ChevronDown size={12} className="text-gray-400" />
          )}
        </button>
        {expandedSection === "crop" && (
          <div className="p-3 grid grid-cols-5 gap-1.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                onClick={() => upd({ aspect_ratio: ar.value })}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all border ${
                  template.aspect_ratio === ar.value
                    ? "bg-[#000000]/10 border-[#000000]/40 text-[#000000]"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span className="text-[11px] font-bold">{ar.label}</span>
                <span className="text-[9px] opacity-60 mt-0.5">{ar.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Auto Subtitle ── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection("subtitle")}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <Sparkles size={13} className="text-[#000000] shrink-0" />
          <span className="text-xs font-semibold text-gray-700 flex-1">
            Auto Subtitle
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              upd({ subtitle_enabled: !template.subtitle_enabled });
            }}
            className={`relative w-8 h-4 rounded-full transition-colors mr-2 cursor-pointer ${
              template.subtitle_enabled ? "bg-[#000000]" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                template.subtitle_enabled
                  ? "translate-x-4"
                  : "translate-x-0.5"
              }`}
            />
          </div>
          {expandedSection === "subtitle" ? (
            <ChevronUp size={12} className="text-gray-400" />
          ) : (
            <ChevronDown size={12} className="text-gray-400" />
          )}
        </button>
        {expandedSection === "subtitle" && template.subtitle_enabled && (
          <div className="p-3">
            <p className="text-[10px] text-gray-400 mb-2">
              Gaya subtitle (3 kata/baris, sync otomatis):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUBTITLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => upd({ subtitle_preset_id: preset.id })}
                  className={`relative rounded-xl overflow-hidden border transition-all ${
                    template.subtitle_preset_id === preset.id
                      ? "border-[#000000] shadow-[0_0_8px_rgba(26,188,113,0.25)]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="h-10 flex items-center justify-center px-2"
                    style={{ backgroundColor: preset.previewBg }}
                  >
                    <span
                      style={{
                        fontFamily: `'${
                          preset.overrides.fontFamily ?? "Montserrat"
                        }', sans-serif`,
                        fontSize: "11px",
                        fontWeight: preset.overrides.bold ? "bold" : "normal",
                        color: preset.previewText,
                        textTransform: preset.overrides.uppercase
                          ? "uppercase"
                          : "none",
                      }}
                    >
                      {preset.emoji} {preset.name}
                    </span>
                  </div>
                  <div
                    className={`px-2 py-1 text-[9px] flex items-center justify-between ${
                      template.subtitle_preset_id === preset.id
                        ? "bg-[#000000]/10 text-[#000000]"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    <span className="font-medium truncate">{preset.name}</span>
                    {template.subtitle_preset_id === preset.id && (
                      <Check size={9} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {expandedSection === "subtitle" && !template.subtitle_enabled && (
          <div className="p-4 text-center text-xs text-gray-400">
            Subtitle otomatis dinonaktifkan
          </div>
        )}
      </div>

      {/* ── Watermark ── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection("watermark")}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <ImageIcon size={13} className="text-[#000000] shrink-0" />
          <span className="text-xs font-semibold text-gray-700 flex-1">
            Watermark / Logo
          </span>
          <span className="text-[10px] text-gray-400 mr-2">
            {template.watermark_name ? "✓" : "—"}
          </span>
          {expandedSection === "watermark" ? (
            <ChevronUp size={12} className="text-gray-400" />
          ) : (
            <ChevronDown size={12} className="text-gray-400" />
          )}
        </button>

        {expandedSection === "watermark" && (
          <div className="p-3 space-y-3">
            {watermarkSrc ? (
              <>
                {/* ── File info row ── */}
                <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <img
                    src={watermarkSrc}
                    alt="watermark"
                    className="w-12 h-12 object-contain rounded-lg bg-white border border-gray-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {template.watermark_name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      X {Math.round(template.watermark_x * 100)}% · Y{" "}
                      {Math.round(template.watermark_y * 100)}% · W{" "}
                      {Math.round(template.watermark_width * 100)}%
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-[#000000] hover:bg-[#000000]/10 transition-colors">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleWatermarkFile(f);
                        }}
                      />
                      <RefreshCw size={12} />
                    </label>
                    <button
                      onClick={removeWatermark}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* ── Sliders ── */}
                <div className="space-y-2">
                  {[
                    { key: "watermark_width"   as const, label: "Ukuran",          min: 0.05, max: 0.5,  step: 0.01 },
                    { key: "watermark_opacity" as const, label: "Opacity",         min: 0.1,  max: 1,    step: 0.05 },
                    { key: "watermark_x"       as const, label: "X (kiri←→kanan)", min: 0,    max: 1,    step: 0.01 },
                    { key: "watermark_y"       as const, label: "Y (atas↕bawah)",  min: 0,    max: 1,    step: 0.01 },
                  ].map((f) => (
                    <div key={f.key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">
                          {f.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#000000]">
                          {Math.round(template[f.key] * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={template[f.key]}
                        onChange={(e) => upd({ [f.key]: +e.target.value })}
                        className="w-full accent-[#000000]"
                      />
                    </div>
                  ))}
                </div>

                {/* ── Live frame preview — appears after sliders ── */}
                <WatermarkPreview
                  src={watermarkSrc}
                  x={template.watermark_x}
                  y={template.watermark_y}
                  width={template.watermark_width}
                  opacity={template.watermark_opacity}
                  aspectRatio={template.aspect_ratio}
                />
              </>
            ) : (
              /* ── Upload area ── */
              <label className="block cursor-pointer">
                <input
                  ref={watermarkInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleWatermarkFile(f);
                    if (e.target) e.target.value = "";
                  }}
                />
                <div className="flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#000000]/50 hover:bg-[#000000]/5 transition-all text-center">
                  <ImageIcon size={20} className="text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium">
                    Upload watermark / logo
                  </p>
                  <p className="text-[10px] text-gray-400">
                    PNG · SVG · WebP · JPG
                  </p>
                </div>
              </label>
            )}
          </div>
        )}
      </div>

      {/* ── Color & Speed ── */}
      {/* <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection("color")}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <Sliders size={13} className="text-[#000000] shrink-0" />
          <span className="text-xs font-semibold text-gray-700 flex-1">
            Warna & Kecepatan
          </span>
          <span className="text-[10px] text-gray-400 mr-2">
            {[
              template.brightness !== 0,
              template.contrast !== 0,
              template.saturation !== 0,
              template.speed !== 1,
            ].some(Boolean)
              ? "Disesuaikan"
              : "Default"}
          </span>
          {expandedSection === "color" ? (
            <ChevronUp size={12} className="text-gray-400" />
          ) : (
            <ChevronDown size={12} className="text-gray-400" />
          )}
        </button>
        {expandedSection === "color" && (
          <div className="p-3 space-y-3">
            {(
              [
                { key: "brightness" as const, label: "Brightness", min: -0.5, max: 0.5 },
                { key: "contrast"   as const, label: "Contrast",   min: -0.5, max: 0.5 },
                { key: "saturation" as const, label: "Saturation", min: -0.5, max: 0.5 },
              ] as const
            ).map((f) => (
              <div key={f.key}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-500">{f.label}</span>
                  <span className="text-[10px] font-mono text-[#000000]">
                    {template[f.key] > 0 ? "+" : ""}
                    {(template[f.key] * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={0.05}
                  value={template[f.key]}
                  onChange={(e) => upd({ [f.key]: +e.target.value })}
                  className="w-full accent-[#000000]"
                />
              </div>
            ))}
            <div>
              <p className="text-[10px] text-gray-500 mb-1.5">Kecepatan</p>
              <div className="grid grid-cols-6 gap-1">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => upd({ speed: s })}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      template.speed === s
                        ? "bg-[#000000]/20 border-[#000000]/40 text-[#000000]"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* ── Credit estimate ── */}
      <div
        className={`flex items-center gap-3 px-3 py-3 rounded-xl border ${
          !hasCredits
            ? "bg-red-50 border-red-200"
            : "bg-[#000000]/5 border-[#000000]/20"
        }`}
      >
        <CreditCard
          size={14}
          className={!hasCredits ? "text-red-500 shrink-0" : "text-[#000000] shrink-0"}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700">Estimasi Kredit</p>
          <p
            className={`text-[10px] ${
              !hasCredits ? "text-red-500" : "text-gray-400"
            }`}
          >
            {template.subtitle_enabled
              ? "1 analisis + 1 per clip subtitle (otomatis)"
              : "1 kredit untuk analisis video"}
          </p>
        </div>
        <span
          className={`text-lg font-black tabular-nums ${
            !hasCredits
              ? "text-red-500"
              : credits <= 3
              ? "text-orange-500"
              : "text-[#000000]"
          }`}
        >
          {credits}
        </span>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
          <AlertCircle size={12} className="shrink-0" />
          <span>{saveError}</span>
          <button
            onClick={() => setSaveError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !template.name.trim()}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-black hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
        >
          {isSaving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : saveSuccess ? (
            <Check size={12} className="text-[#000000]" />
          ) : (
            <Save size={12} />
          )}
          {saveSuccess ? "Tersimpan!" : "Simpan Template"}
        </button>

        {!hasCredits ? (
          <button
            onClick={onTopUpClick}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={13} /> Top Up Kredit
          </button>
        ) : (
          <button
            onClick={() => onGenerate(template, watermarkSrc)}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#000000]/20 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <Zap size={13} /> Generate Videos
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}