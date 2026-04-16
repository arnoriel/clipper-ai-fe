// src/components/VideoEditor.tsx
// CapCut-style video editor with AI auto-subtitle + AI Motion Facial Tracking
// Mobile-responsive: stacked layout on mobile, side-by-side on desktop
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Play, Pause, SkipBack, SkipForward, Type, Crop,
  Sliders, Zap, Download, Loader2, Plus, Trash2, Clock, RefreshCw,
  AlignCenter, AlignLeft, AlignRight, Bold, Italic, ChevronDown, ChevronUp,
  Eye, EyeOff, CaseSensitive, Sparkles, Wand2, Check, Image as ImageIcon,
  ChevronLeft, Scan, Activity, User, AlertCircle, Info,
} from "lucide-react";
import type { ViralMoment } from "../lib/AI";
import { formatTime } from "../lib/AI";
import type { ClipEdits, TextOverlay, MotionAnalysisResult } from "../lib/storage";
import {
  generateId,
  defaultTextOverlay,
  defaultImageOverlay,
  loadAllSubtitleFonts,
  SUBTITLE_FONTS,
  SUBTITLE_PRESETS,
  applyPresetToOverlay,
  type SubtitlePreset,
  type ImageOverlay,
} from "../lib/storage";

// Props interface
interface Props {
  moment: ViralMoment;
  edits: ClipEdits;
  videoSrc: string;
  onUpdateEdits: (edits: ClipEdits) => void;
  onExport: (moment: ViralMoment, edits: ClipEdits) => void;
  onClose: () => void;
  isExporting: boolean;
  onAutoSubtitle?: () => Promise<any | null>;
  onAnalyzeMotion?: () => Promise<MotionAnalysisResult | null>;
  credits?: number;
}

type Tab = "subtitle" | "trim" | "crop" | "color" | "speed" | "media" | "intro";

const ASPECT_RATIOS: { label: string; value: ClipEdits["aspectRatio"]; desc: string }[] = [
  { label: "Original", value: "original", desc: "Keep source dimensions" },
  { label: "9:16 Vertical", value: "9:16", desc: "TikTok / Reels / Shorts" },
  { label: "16:9 Wide", value: "16:9", desc: "YouTube / Landscape" },
  { label: "1:1 Square", value: "1:1", desc: "Instagram feed" },
  { label: "4:3 Classic", value: "4:3", desc: "Classic TV ratio" },
];

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SNAP_THRESHOLD = 0.03;
const FONT_REFERENCE_WIDTH = 1080;

const CATEGORY_LABELS: Record<string, string> = {
  "sans-serif": "Sans-serif",
  "display": "Display / Impact",
  "handwriting": "Handwriting",
  "serif": "Serif",
  "monospace": "Monospace",
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildTextShadow(t: TextOverlay, scale: number): string {
  if (!t.shadowEnabled) return "none";
  const color = hexToRgba(t.shadowColor || "#000000", 0.85);
  const sx = (t.shadowX ?? 2) * scale;
  const sy = (t.shadowY ?? 2) * scale;
  const blur = (t.shadowBlur ?? 8) * scale;
  return `${sx}px ${sy}px ${blur}px ${color}`;
}

// ΓöÇΓöÇΓöÇ Font picker ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const categories = ["display", "sans-serif", "serif", "handwriting", "monospace"] as const;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-left hover:border-white/30 transition-colors"
      >
        <span className="text-sm text-white/90 truncate" style={{ fontFamily: `'${value}', sans-serif` }}>
          {value}
        </span>
        <ChevronDown size={12} className={`text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-[#181818] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
            {categories.map((cat) => {
              const fonts = SUBTITLE_FONTS.filter((f) => f.category === cat);
              if (!fonts.length) return null;
              return (
                <div key={cat}>
                  <div className="px-3 pt-2 pb-1 text-[9px] text-white/25 font-medium uppercase tracking-widest sticky top-0 bg-[#181818]">
                    {CATEGORY_LABELS[cat]}
                  </div>
                  {fonts.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => { onChange(font.name); setOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/8 ${value === font.name ? "text-[#000000] bg-[#000000]/10" : "text-white/70"}`}
                      style={{ fontFamily: `'${font.name}', sans-serif` }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Color swatch ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-white/40 shrink-0 w-16">{label}</label>
      <div className="relative flex-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="h-7 rounded-lg border border-white/20 flex items-center px-2 gap-2 cursor-pointer"
          style={{ backgroundColor: hexToRgba(value, 0.3) }}>
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: value }} />
          <span className="text-[10px] font-mono text-white/60">{value.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Preset card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function PresetCard({
  preset, isActive, onClick,
}: {
  preset: SubtitlePreset; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-xl overflow-hidden border transition-all duration-200 text-left group ${
        isActive ? "border-[#000000] shadow-[0_0_12px_rgba(26,188,113,0.35)]" : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="h-12 md:h-14 flex items-center justify-center px-2"
        style={{ backgroundColor: preset.previewBg }}>
        <span className="text-center leading-tight"
          style={{
            fontFamily: `'${preset.overrides.fontFamily ?? "Montserrat"}', sans-serif`,
            fontSize: "13px",
            fontWeight: preset.overrides.bold ? "bold" : "normal",
            color: preset.previewText,
            textTransform: preset.overrides.uppercase ? "uppercase" : "none",
            letterSpacing: `${(preset.overrides.letterSpacing ?? 0) * 0.3}px`,
            textShadow: preset.overrides.shadowEnabled
              ? `${preset.overrides.shadowX ?? 2}px ${preset.overrides.shadowY ?? 2}px ${preset.overrides.shadowBlur ?? 8}px ${preset.previewAccent}40`
              : "none",
            WebkitTextStroke: (preset.overrides.outlineWidth ?? 0) > 0
              ? `${Math.min(1.5, preset.overrides.outlineWidth ?? 0)}px ${preset.overrides.outlineColor ?? "#000"}`
              : undefined,
            ...(preset.overrides.backgroundEnabled
              ? {
                background: hexToRgba(preset.overrides.backgroundColor ?? "#000", preset.overrides.backgroundOpacity ?? 0.8),
                padding: "2px 8px",
                borderRadius: "4px",
              }
              : {}),
          }}
        >
          {preset.emoji} {preset.name}
        </span>
      </div>
      <div className={`px-2 py-1.5 ${isActive ? "bg-[#000000]/15" : "bg-[#111]"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white/80 truncate">{preset.name}</span>
          {isActive && <Check size={10} className="text-[#000000] shrink-0" />}
        </div>
      </div>
    </button>
  );
}

// ΓöÇΓöÇΓöÇ SliderField ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function SliderField({ label, value, min, max, step, format, onChange, dark }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; dark?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className={`text-xs ${dark ? "text-white/50" : "text-gray-600"}`}>{label}</label>
        <span className="text-xs font-mono text-[#000000]">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#000000]" />
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Motion Status Badge ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function MotionStatusBadge({ edits }: { edits: ClipEdits }) {
  if (!edits.motionAnalyzed) return null;

  if (!edits.motionAvailable) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px]">
        <AlertCircle size={10} />
        <span>OpenCV tidak tersedia di server</span>
      </div>
    );
  }

  if (edits.motionKeyframes && edits.motionKeyframes.length > 1 && !edits.isStaticMotion) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#000000]/10 border border-[#000000]/20 text-[#000000] text-[10px]">
        <Activity size={10} className="shrink-0" />
        <span>AI Tracking aktif ┬╖ {edits.motionKeyframes.length} keyframes</span>
      </div>
    );
  }

  if (edits.isStaticMotion) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px]">
        <User size={10} className="shrink-0" />
        <span>Wajah ditemukan ┬╖ crop statis ke posisi orang</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[10px]">
      <Info size={10} className="shrink-0" />
      <span>Tidak ada orang terdeteksi ┬╖ center crop</span>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Main component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function VideoEditor({
  moment, edits, videoSrc, onUpdateEdits, onExport, onClose, isExporting,
  onAutoSubtitle, onAnalyzeMotion,
  credits,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCredits = (credits ?? 1) > 0;
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("subtitle");
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Mobile: whether right panel is showing (bottom sheet)
  const [mobileShowPanel, setMobileShowPanel] = useState(false);

  // Auto-subtitle state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState("");
  const [subtitleSubTab, setSubtitleSubTab] = useState<"presets" | "layers" | "add">("presets");

  // ΓöÇΓöÇΓöÇ Motion tracking state ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [isAnalyzingMotion, setIsAnalyzingMotion] = useState(false);
  const [motionError, setMotionError] = useState("");
  // Track which ratio was last analyzed to detect when re-analysis is needed
  const lastAnalyzedRatioRef = useRef<string | null>(null);

  // Preview video wrapper actual pixel width
  const [previewWidth, setPreviewWidth] = useState(0);

  useEffect(() => {
    const el = videoWrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setPreviewWidth(entry.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const fontPreviewScale = previewWidth > 0 ? previewWidth / FONT_REFERENCE_WIDTH : 1;

  // Drag state
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; textX: number; textY: number } | null>(null);

  // Progress bar drag state
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);

  // Timeline drag
  const [draggingTimelineId, setDraggingTimelineId] = useState<string | null>(null);
  const [draggingTimelineEdge, setDraggingTimelineEdge] = useState<"left" | "right" | "move" | null>(null);
  const timelineDragRef = useRef<{ startX: number; origStart: number; origEnd: number } | null>(null);

  const clipStart = moment.startTime + edits.trimStart;
  const clipEnd = moment.endTime + edits.trimEnd;
  const clipDuration = clipEnd - clipStart;

  const activePresetId = edits.activePresetId ?? "bold-impact";

  useEffect(() => { loadAllSubtitleFonts(); }, []);

  // ΓöÇΓöÇΓöÇ Auto-trigger motion analysis when aspect ratio changes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    const ratio = edits.aspectRatio;

    // Only run when ratio is non-original and changed from last analyzed
    if (ratio === "original") {
      lastAnalyzedRatioRef.current = null;
      return;
    }
    if (!onAnalyzeMotion) return;
    // Already analyzed for this ratio
    if (edits.motionAnalyzed && lastAnalyzedRatioRef.current === ratio) return;
    if (isAnalyzingMotion) return;

    lastAnalyzedRatioRef.current = ratio;
    runMotionAnalysis();
  }, [edits.aspectRatio]);

  async function runMotionAnalysis() {
    if (!onAnalyzeMotion || isAnalyzingMotion) return;
    setIsAnalyzingMotion(true);
    setMotionError("");
    try {
      await onAnalyzeMotion();
    } catch (e: any) {
      setMotionError(e.message || "Motion analysis failed");
    } finally {
      setIsAnalyzingMotion(false);
    }
  }

  // ΓöÇΓöÇ Image overlay drag ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const imageDragStartRef = useRef<{ mouseX: number; mouseY: number; imgX: number; imgY: number } | null>(null);

  function addImageOverlay(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const overlay = defaultImageOverlay({ id: generateId(), src, name: file.name });
      updateEdits({ imageOverlays: [...(edits.imageOverlays ?? []), overlay] });
      setSelectedImageId(overlay.id);
    };
    reader.readAsDataURL(file);
  }

  function updateImageOverlay(id: string, changes: Partial<ImageOverlay>) {
    updateEdits({
      imageOverlays: (edits.imageOverlays ?? []).map((img) => (img.id === id ? { ...img, ...changes } : img)),
    });
  }

  function removeImageOverlay(id: string) {
    updateEdits({ imageOverlays: (edits.imageOverlays ?? []).filter((img) => img.id !== id) });
    if (selectedImageId === id) setSelectedImageId(null);
  }

  const handleImageMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setDraggingImageId(id); setSelectedImageId(id);
    const img = (edits.imageOverlays ?? []).find((i) => i.id === id);
    if (!img) return;
    imageDragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, imgX: img.x, imgY: img.y };
  }, [edits.imageOverlays]);

  useEffect(() => {
    if (!draggingImageId) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!imageDragStartRef.current || !videoWrapRef.current) return;
      const rect = videoWrapRef.current.getBoundingClientRect();
      const dx = (e.clientX - imageDragStartRef.current.mouseX) / rect.width;
      const dy = (e.clientY - imageDragStartRef.current.mouseY) / rect.height;
      const newX = Math.min(1, Math.max(0, imageDragStartRef.current.imgX + dx));
      const newY = Math.min(1, Math.max(0, imageDragStartRef.current.imgY + dy));
      updateImageOverlay(draggingImageId, { x: newX, y: newY });
    };
    const onMouseUp = () => { setDraggingImageId(null); imageDragStartRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [draggingImageId]);

  // Video sync
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;
    v.currentTime = clipStart;
    setCurrentTime(clipStart);
    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (v.currentTime >= clipEnd) { v.pause(); v.currentTime = clipStart; setIsPlaying(false); }
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [videoSrc, clipStart, clipEnd]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else { if (v.currentTime >= clipEnd) v.currentTime = clipStart; v.play(); setIsPlaying(true); }
  }

  function seek(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + delta, clipStart), clipEnd);
  }

  // ΓöÇΓöÇ Spacebar play/pause ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying]);

  // ΓöÇΓöÇ Progress bar drag ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  function seekToClientX(clientX: number) {
    const bar = progressBarRef.current;
    if (!bar || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    videoRef.current.currentTime = clipStart + pct * clipDuration;
  }

  function handleProgressMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setIsDraggingProgress(true);
    seekToClientX(e.clientX);
  }

  function handleProgressTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    const bar = progressBarRef.current;
    if (!bar || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (touch.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = clipStart + pct * clipDuration;
  }

  function handleProgressTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    seekToClientX(touch.clientX);
  }

  useEffect(() => {
    if (!isDraggingProgress) return;
    const onMove = (e: MouseEvent) => seekToClientX(e.clientX);
    const onUp = () => setIsDraggingProgress(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingProgress]);

  function updateEdits(partial: Partial<ClipEdits>) {
    onUpdateEdits({ ...edits, ...partial });
  }

  // ΓöÇΓöÇ Get current active preset ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const currentPreset = SUBTITLE_PRESETS.find((p) => p.id === activePresetId) ?? SUBTITLE_PRESETS[0];

  // ΓöÇΓöÇ Apply preset to all auto-subtitles ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  function applyPresetToAllAuto(presetId: string) {
    const preset = SUBTITLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const updated = edits.textOverlays.map((t) =>
      t.isAutoSubtitle ? applyPresetToOverlay(t, preset) : t
    );
    updateEdits({ textOverlays: updated, activePresetId: presetId });
  }

  // ΓöÇΓöÇ Auto-subtitle ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  async function handleAutoSubtitle() {
    if (!onAutoSubtitle) return;
    setIsTranscribing(true);
    setTranscribeError("");
    try {
      const result = await onAutoSubtitle();
      if (!result) { setTranscribeError("No response from server."); return; }

      const chunks = (result as any).chunks as { text: string; start: number; end: number }[] | undefined;
      if (!chunks || chunks.length === 0) { setTranscribeError("No speech detected or generation failed."); return; }

      const preset = SUBTITLE_PRESETS.find((p) => p.id === activePresetId) ?? SUBTITLE_PRESETS[0];
      const manual = edits.textOverlays.filter((t) => !t.isAutoSubtitle);
      const newOverlays: TextOverlay[] = chunks.map((chunk) =>
        applyPresetToOverlay(
          defaultTextOverlay({
            id: generateId(),
            text: chunk.text,
            startSec: parseFloat(chunk.start.toFixed(3)),
            endSec: parseFloat(chunk.end.toFixed(3)),
            isAutoSubtitle: true,
          }),
          preset,
        )
      );
      updateEdits({ textOverlays: [...manual, ...newOverlays] });
      setSubtitleSubTab("layers");
    } catch (e: any) {
      setTranscribeError(e.message || "Transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  }

  function clearAutoSubtitles() {
    updateEdits({ textOverlays: edits.textOverlays.filter((t) => !t.isAutoSubtitle) });
  }

  // ΓöÇΓöÇ Text overlay CRUD ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  function addTextOverlay() {
    if (!newText.trim()) return;
    const relCurrentTime = currentTime - clipStart;
    const preset = SUBTITLE_PRESETS.find((p) => p.id === activePresetId) ?? SUBTITLE_PRESETS[0];
    const base = defaultTextOverlay({
      id: generateId(),
      text: newText.trim(),
      startSec: Math.max(0, relCurrentTime),
      endSec: Math.min(clipDuration, relCurrentTime + 3),
    });
    const overlay = applyPresetToOverlay(base, preset);
    updateEdits({ textOverlays: [...edits.textOverlays, overlay] });
    setSelectedOverlayId(overlay.id);
    setExpandedId(overlay.id);
    setNewText("");
  }

  function updateOverlay(id: string, changes: Partial<TextOverlay>) {
    updateEdits({
      textOverlays: edits.textOverlays.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    });
  }

  function removeOverlay(id: string) {
    updateEdits({ textOverlays: edits.textOverlays.filter((t) => t.id !== id) });
    if (selectedOverlayId === id) setSelectedOverlayId(null);
    if (expandedId === id) setExpandedId(null);
  }

  // ΓöÇΓöÇ Drag text on video ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const handleTextMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setDraggingTextId(id); setSelectedOverlayId(id);
    const overlay = edits.textOverlays.find((t) => t.id === id);
    if (!overlay) return;
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, textX: overlay.x, textY: overlay.y };
  }, [edits.textOverlays]);

  useEffect(() => {
    if (!draggingTextId) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !videoWrapRef.current) return;
      const rect = videoWrapRef.current.getBoundingClientRect();
      const dx = (e.clientX - dragStartRef.current.mouseX) / rect.width;
      const dy = (e.clientY - dragStartRef.current.mouseY) / rect.height;
      let newX = Math.min(1, Math.max(0, dragStartRef.current.textX + dx));
      let newY = Math.min(1, Math.max(0, dragStartRef.current.textY + dy));
      const snapX = Math.abs(newX - 0.5) < SNAP_THRESHOLD;
      const snapY = Math.abs(newY - 0.5) < SNAP_THRESHOLD;
      if (snapX) newX = 0.5;
      if (snapY) newY = 0.5;
      setSnapGuides({ x: snapX, y: snapY });
      updateOverlay(draggingTextId, { x: newX, y: newY });
    };
    const onMouseUp = () => { setDraggingTextId(null); setSnapGuides({ x: false, y: false }); dragStartRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [draggingTextId]);

  // ΓöÇΓöÇ Timeline drag ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent, id: string, edge: "left" | "right" | "move") => {
    e.preventDefault(); e.stopPropagation();
    const overlay = edits.textOverlays.find((t) => t.id === id);
    if (!overlay) return;
    setDraggingTimelineId(id); setDraggingTimelineEdge(edge); setSelectedOverlayId(id);
    timelineDragRef.current = { startX: e.clientX, origStart: overlay.startSec ?? 0, origEnd: overlay.endSec ?? clipDuration };
  }, [edits.textOverlays, clipDuration]);

  useEffect(() => {
    if (!draggingTimelineId || !draggingTimelineEdge) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!timelineDragRef.current || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const pxPerSec = rect.width / clipDuration;
      const dSec = (e.clientX - timelineDragRef.current.startX) / pxPerSec;
      const { origStart, origEnd } = timelineDragRef.current;
      let newStart = origStart, newEnd = origEnd;
      if (draggingTimelineEdge === "left") newStart = Math.min(Math.max(0, origStart + dSec), origEnd - 0.5);
      else if (draggingTimelineEdge === "right") newEnd = Math.max(Math.min(clipDuration, origEnd + dSec), origStart + 0.5);
      else { const dur = origEnd - origStart; newStart = Math.min(Math.max(0, origStart + dSec), clipDuration - dur); newEnd = newStart + dur; }
      updateOverlay(draggingTimelineId, { startSec: newStart, endSec: newEnd });
    };
    const onMouseUp = () => { setDraggingTimelineId(null); setDraggingTimelineEdge(null); };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [draggingTimelineId, draggingTimelineEdge, clipDuration]);

  function handleTimelineClick(e: React.MouseEvent) {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const t = clipStart + pct * clipDuration;
    if (videoRef.current) videoRef.current.currentTime = t;
  }

  const progressPct = clipDuration > 0 ? ((currentTime - clipStart) / clipDuration) * 100 : 0;
  const isCropped = edits.aspectRatio !== "original";
  const [arW, arH] = isCropped ? edits.aspectRatio.split(":").map(Number) : [16, 9];
  const cssAspectRatio = `${arW} / ${arH}`;
  const relTime = currentTime - clipStart;

  const visibleOverlayIds = new Set(
    edits.textOverlays
      .filter((t) => {
        const s = t.startSec ?? 0;
        const en = t.endSec ?? clipDuration;
        return relTime >= s && relTime <= en;
      })
      .map((t) => t.id)
  );

  const autoCount = edits.textOverlays.filter((t) => t.isAutoSubtitle).length;
  const manualCount = edits.textOverlays.filter((t) => !t.isAutoSubtitle).length;

  // ΓöÇΓöÇ Determine motion tracking display state ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const hasMotionTracking = edits.motionAnalyzed && edits.motionKeyframes && edits.motionKeyframes.length > 0 && !edits.isStaticMotion;
  const motionMessage = edits.motionMessage ?? "";

  // ΓöÇΓöÇ Overlay controls ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  function renderOverlayControls(t: TextOverlay) {
    const s = t.startSec ?? 0;
    const en = t.endSec ?? clipDuration;
    const previewPx = Math.round(t.fontSize * fontPreviewScale);

    return (
      <div className="border-t border-white/10 p-3 space-y-4">
        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Text</label>
          <input type="text" value={t.text} onChange={(e) => updateOverlay(t.id, { text: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#000000]/60 transition-colors" />
        </div>

        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Font Family</label>
          <FontPicker value={t.fontFamily || "Montserrat"} onChange={(v) => updateOverlay(t.id, { fontFamily: v })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">
              Size: {t.fontSize}
              {fontPreviewScale < 0.99 && <span className="text-white/20 ml-1">(~{previewPx}px)</span>}
            </label>
            <input type="range" min={12} max={120} value={t.fontSize} onChange={(e) => updateOverlay(t.id, { fontSize: +e.target.value })} className="w-full accent-[#000000]" />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Opacity: {Math.round((t.opacity ?? 1) * 100)}%</label>
            <input type="range" min={0} max={1} step={0.05} value={t.opacity ?? 1} onChange={(e) => updateOverlay(t.id, { opacity: +e.target.value })} className="w-full accent-[#000000]" />
          </div>
        </div>

        <ColorSwatch label="Text color" value={t.color} onChange={(v) => updateOverlay(t.id, { color: v })} />

        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Style</label>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => updateOverlay(t.id, { bold: !t.bold })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${t.bold ? "bg-[#000000]/20 border-[#000000]/40 text-[#000000]" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"}`}>
              <Bold size={11} /> Bold</button>
            <button onClick={() => updateOverlay(t.id, { italic: !t.italic })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${t.italic ? "bg-[#000000]/20 border-[#000000]/40 text-[#000000]" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"}`}>
              <Italic size={11} /> Italic</button>
            <button onClick={() => updateOverlay(t.id, { uppercase: !t.uppercase })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${t.uppercase ? "bg-[#000000]/20 border-[#000000]/40 text-[#000000]" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"}`}>
              <CaseSensitive size={11} /> CAPS</button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Alignment</label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((align) => {
              const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
              return (
                <button key={align} onClick={() => updateOverlay(t.id, { textAlign: align })}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all border ${(t.textAlign || "center") === align ? "bg-[#000000]/20 border-[#000000]/40 text-[#000000]" : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"}`}>
                  <Icon size={13} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">
            Letter Spacing: {t.letterSpacing > 0 ? "+" : ""}{t.letterSpacing}px
          </label>
          <input type="range" min={-5} max={20} step={0.5} value={t.letterSpacing ?? 0}
            onChange={(e) => updateOverlay(t.id, { letterSpacing: +e.target.value })} className="w-full accent-[#000000]" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Outline</label>
            <span className="text-[10px] text-white/30 font-mono">{t.outlineWidth}px</span>
          </div>
          <input type="range" min={0} max={8} step={0.5} value={t.outlineWidth ?? 0}
            onChange={(e) => updateOverlay(t.id, { outlineWidth: +e.target.value })} className="w-full accent-[#000000]" />
          {(t.outlineWidth ?? 0) > 0 && (
            <ColorSwatch label="Outline" value={t.outlineColor || "#000000"} onChange={(v) => updateOverlay(t.id, { outlineColor: v })} />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Drop Shadow</label>
            <button onClick={() => updateOverlay(t.id, { shadowEnabled: !t.shadowEnabled })}
              className={`p-1 rounded transition-colors ${t.shadowEnabled ? "text-[#000000]" : "text-white/20 hover:text-white/40"}`}>
              {t.shadowEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </div>
          {t.shadowEnabled && (
            <div className="space-y-2 pl-1 border-l border-white/10">
              <ColorSwatch label="Shadow" value={t.shadowColor || "#000000"} onChange={(v) => updateOverlay(t.id, { shadowColor: v })} />
              <div className="grid grid-cols-3 gap-2">
                <div><div className="text-[9px] text-white/25 mb-1">X: {t.shadowX}px</div>
                  <input type="range" min={-10} max={10} value={t.shadowX ?? 2} onChange={(e) => updateOverlay(t.id, { shadowX: +e.target.value })} className="w-full accent-[#000000]" /></div>
                <div><div className="text-[9px] text-white/25 mb-1">Y: {t.shadowY}px</div>
                  <input type="range" min={-10} max={10} value={t.shadowY ?? 2} onChange={(e) => updateOverlay(t.id, { shadowY: +e.target.value })} className="w-full accent-[#000000]" /></div>
                <div><div className="text-[9px] text-white/25 mb-1">Blur: {t.shadowBlur}px</div>
                  <input type="range" min={0} max={20} value={t.shadowBlur ?? 8} onChange={(e) => updateOverlay(t.id, { shadowBlur: +e.target.value })} className="w-full accent-[#000000]" /></div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Background Box</label>
            <button onClick={() => updateOverlay(t.id, { backgroundEnabled: !t.backgroundEnabled })}
              className={`p-1 rounded transition-colors ${t.backgroundEnabled ? "text-[#000000]" : "text-white/20 hover:text-white/40"}`}>
              {t.backgroundEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </div>
          {t.backgroundEnabled && (
            <div className="space-y-2 pl-1 border-l border-white/10">
              <ColorSwatch label="BG color" value={t.backgroundColor || "#000000"} onChange={(v) => updateOverlay(t.id, { backgroundColor: v })} />
              <div className="grid grid-cols-2 gap-2">
                <div><div className="text-[9px] text-white/25 mb-1">Opacity: {Math.round((t.backgroundOpacity ?? 0.6) * 100)}%</div>
                  <input type="range" min={0} max={1} step={0.05} value={t.backgroundOpacity ?? 0.6} onChange={(e) => updateOverlay(t.id, { backgroundOpacity: +e.target.value })} className="w-full accent-[#000000]" /></div>
                <div><div className="text-[9px] text-white/25 mb-1">Padding: {t.backgroundPadding ?? 10}px</div>
                  <input type="range" min={2} max={32} value={t.backgroundPadding ?? 10} onChange={(e) => updateOverlay(t.id, { backgroundPadding: +e.target.value })} className="w-full accent-[#000000]" /></div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Position</label>
            <button onClick={() => updateOverlay(t.id, { x: 0.5, y: 0.82 })}
              className="text-[9px] text-[#000000]/60 hover:text-[#000000] transition-colors flex items-center gap-1">
              <AlignCenter size={9} /> Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-[9px] text-white/25 mb-1">X: {Math.round(t.x * 100)}%</div>
              <input type="range" min={0} max={1} step={0.01} value={t.x} onChange={(e) => updateOverlay(t.id, { x: +e.target.value })} className="w-full accent-[#000000]" /></div>
            <div><div className="text-[9px] text-white/25 mb-1">Y: {Math.round(t.y * 100)}%</div>
              <input type="range" min={0} max={1} step={0.01} value={t.y} onChange={(e) => updateOverlay(t.id, { y: +e.target.value })} className="w-full accent-[#000000]" /></div>
          </div>
          <p className="text-[9px] text-white/20">≡ƒÆí Drag text directly on video ┬╖ snaps to center</p>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] text-white/40 font-medium uppercase tracking-wider">Duration</label>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-[9px] text-white/25 mb-1">Start: {s.toFixed(1)}s</div>
              <input type="range" min={0} max={clipDuration - 0.5} step={0.1} value={s}
                onChange={(e) => updateOverlay(t.id, { startSec: +e.target.value })} className="w-full accent-[#000000]" /></div>
            <div><div className="text-[9px] text-white/25 mb-1">End: {en.toFixed(1)}s</div>
              <input type="range" min={0.5} max={clipDuration} step={0.1} value={en}
                onChange={(e) => updateOverlay(t.id, { endSec: +e.target.value })} className="w-full accent-[#000000]" /></div>
          </div>
        </div>
      </div>
    );
  }

  // ΓöÇΓöÇ Tab icon labels for mobile bottom bar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const TABS: { id: Tab; label: string; icon: typeof Type }[] = [
    { id: "subtitle", label: "Sub",   icon: Type },
    { id: "trim",     label: "Trim",  icon: Clock },
    { id: "crop",     label: "Crop",  icon: Crop },
    { id: "color",    label: "Color", icon: Sliders },
    { id: "speed",    label: "Speed", icon: Zap },
    { id: "media",    label: "Media", icon: ImageIcon },
    { id: "intro",    label: "Intro", icon: Sparkles },
  ];

  // ΓöÇΓöÇ Right panel content ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  function renderPanelContent() {
    return (
      <>
        {/* ΓöÇΓöÇ SUBTITLE TAB ΓöÇΓöÇ */}
        {activeTab === "subtitle" && (
          <div className="flex flex-col h-full">
            <div className="flex border-b border-white/10 shrink-0">
              {(["presets", "add", "layers"] as const).map((tab) => (
                <button key={tab} onClick={() => setSubtitleSubTab(tab)}
                  className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${subtitleSubTab === tab ? "text-[#000000] border-b-2 border-[#000000]" : "text-white/30 hover:text-white/60"}`}>
                  {tab === "presets" ? "Styles" : tab === "add" ? "+ Add" : `Layers (${edits.textOverlays.length})`}
                </button>
              ))}
            </div>

            {subtitleSubTab === "presets" && (
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="rounded-xl border border-[#000000]/20 bg-[#000000]/5 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wand2 size={13} className="text-[#000000]" />
                    <span className="text-xs font-bold text-white">AI Auto Subtitle</span>
                    <span className="ml-auto text-[9px] text-[#000000]/60 font-mono">3 words/line</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    AI listens to speech in your clip and generates synced subtitles ΓÇö 3 words at a time.
                  </p>
                  {transcribeError && (
                    <p className="text-[10px] text-red-400 bg-red-500/10 rounded-lg px-2 py-1.5">{transcribeError}</p>
                  )}
                  {!hasCredits && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>Kredit habis ΓÇö tidak bisa generate subtitle. Top up dulu.</span>
                    </div>
                  )}
                  <button
                    onClick={handleAutoSubtitle}
                    disabled={isTranscribing || !onAutoSubtitle || !hasCredits}
                    className="w-full py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#000000]/20"
                  >
                    {isTranscribing ? (
                      <><Loader2 size={13} className="animate-spin" /> Transcribing speechΓÇª</>
                    ) : !hasCredits ? (
                      <><AlertCircle size={13} /> Kredit Tidak Cukup</>
                    ) : (
                      <><Sparkles size={13} /> Generate Auto Subtitles</>
                    )}
                  </button>
                  {!onAutoSubtitle && (
                    <p className="text-[9px] text-white/20 text-center">Requires OPENAI_API_KEY on backend</p>
                  )}
                  {autoCount > 0 && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#000000]/70 flex items-center gap-1"><Sparkles size={9} />{autoCount} subtitles generated</span>
                      <button onClick={clearAutoSubtitles} className="text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1">
                        <Trash2 size={10} /> Clear
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-2">Style Presets</div>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBTITLE_PRESETS.map((preset) => (
                      <PresetCard key={preset.id} preset={preset} isActive={activePresetId === preset.id} onClick={() => applyPresetToAllAuto(preset.id)} />
                    ))}
                  </div>
                  {autoCount > 0 && (
                    <p className="text-[9px] text-white/20 text-center mt-2">
                      Click a style to apply to all {autoCount} auto subtitles
                    </p>
                  )}
                </div>
              </div>
            )}

            {subtitleSubTab === "add" && (
              <div className="p-4 space-y-4">
                <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Add Manual Subtitle</div>
                <div className="flex flex-col gap-2">
                  <textarea value={newText} onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTextOverlay(); } }}
                    placeholder="Type subtitle textΓÇª" rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#000000]/50 resize-none" />
                  <button onClick={addTextOverlay}
                    className="w-full py-2 bg-[#000000]/20 border border-[#000000]/30 rounded-xl text-[#000000] text-xs font-medium hover:bg-[#000000]/30 transition-colors flex items-center justify-center gap-2">
                    <Plus size={13} />
                    Add at {formatTime(Math.max(0, currentTime - clipStart))}
                  </button>
                </div>
                <div className="text-[9px] text-white/20 leading-relaxed">
                  Uses active style preset. Edit text, timing &amp; style in the Layers tab.
                </div>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="text-[9px] text-white/25 px-3 pt-2 pb-1 uppercase tracking-wider">Active Style</div>
                  <PresetCard preset={currentPreset} isActive onClick={() => setSubtitleSubTab("presets")} />
                </div>
              </div>
            )}

            {subtitleSubTab === "layers" && (
              <div className="p-4 space-y-2 overflow-y-auto flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                    All Layers ({edits.textOverlays.length})
                  </div>
                  {edits.textOverlays.length > 0 && (
                    <button onClick={() => updateEdits({ textOverlays: [] })}
                      className="text-[9px] text-red-400/50 hover:text-red-400 transition-colors">
                      Clear all
                    </button>
                  )}
                </div>
                {edits.textOverlays.length === 0 && (
                  <div className="py-10 text-center">
                    <Type size={24} className="text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/20">No subtitles yet</p>
                    <button onClick={() => setSubtitleSubTab("presets")}
                      className="mt-2 text-[10px] text-[#000000]/60 hover:text-[#000000] transition-colors">
                      Generate auto subtitles ΓåÆ
                    </button>
                  </div>
                )}
                {edits.textOverlays.map((t) => {
                  const isSelected = selectedOverlayId === t.id;
                  const isExpanded = expandedId === t.id;
                  const s = t.startSec ?? 0;
                  const en = t.endSec ?? clipDuration;
                  return (
                    <div key={t.id}
                      className={`rounded-xl border transition-all overflow-hidden ${isSelected ? "border-[#000000]/50 bg-[#000000]/10" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
                      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                        onClick={() => { setSelectedOverlayId(t.id); setExpandedId(isExpanded ? null : t.id); }}>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {t.isAutoSubtitle
                            ? <Sparkles size={10} className="text-purple-400 shrink-0" />
                            : <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          }
                          <span className="text-xs text-white/80 truncate" style={{ fontFamily: `'${t.fontFamily || "Montserrat"}', sans-serif` }}>
                            {t.uppercase ? t.text.toUpperCase() : t.text}
                          </span>
                        </div>
                        <span className="text-[9px] text-white/25 font-mono shrink-0">{s.toFixed(1)}ΓÇô{en.toFixed(1)}s</span>
                        <button onClick={(ev) => { ev.stopPropagation(); removeOverlay(t.id); }}
                          className="p-1 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors shrink-0">
                          <Trash2 size={11} />
                        </button>
                        <div className="text-white/20">{isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</div>
                      </div>
                      {isExpanded && renderOverlayControls(t)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ΓöÇΓöÇ TRIM TAB ΓöÇΓöÇ */}
        {activeTab === "trim" && (
          <div className="p-4 space-y-5">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Trim Clip</div>
            <SliderField label="Trim Start" value={edits.trimStart}
              min={0} max={Math.max(0, Math.floor((moment.endTime - moment.startTime) * 0.8))}
              step={1} format={(v) => `+${v}s`} dark onChange={(v) => updateEdits({ trimStart: v })} />
            <SliderField label="Trim End" value={edits.trimEnd}
              min={-Math.max(0, Math.floor((moment.endTime - moment.startTime) * 0.8))} max={0}
              step={1} format={(v) => `${v}s`} dark onChange={(v) => updateEdits({ trimEnd: v })} />
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/50 space-y-1.5 border border-white/10">
              <div className="flex justify-between"><span>New Start</span><span className="font-mono text-white">{formatTime(clipStart)}</span></div>
              <div className="flex justify-between"><span>New End</span><span className="font-mono text-white">{formatTime(clipEnd)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-1.5"><span>Duration</span><span className="font-mono text-[#000000]">{Math.round(clipDuration)}s</span></div>
            </div>
          </div>
        )}

        {/* ΓöÇΓöÇ CROP TAB ΓÇö WITH MOTION TRACKING ΓöÇΓöÇ */}
        {activeTab === "crop" && (
          <div className="p-4 space-y-4">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Aspect Ratio</div>
            <div className="space-y-1.5">
              {ASPECT_RATIOS.map((ar) => (
                <button key={ar.value} onClick={() => updateEdits({ aspectRatio: ar.value })}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between ${edits.aspectRatio === ar.value
                    ? "bg-[#000000]/20 border border-[#000000]/40 text-[#000000]"
                    : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20"
                    }`}>
                  <span>{ar.label}</span>
                  <span className={`text-[10px] ${edits.aspectRatio === ar.value ? "text-[#000000]/60" : "text-white/25"}`}>{ar.desc}</span>
                </button>
              ))}
            </div>

            {/* ΓöÇΓöÇ AI Motion Tracking section (only shown when crop is active) ΓöÇΓöÇ */}
            {edits.aspectRatio !== "original" && (
              <div className="mt-2 rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    hasMotionTracking
                      ? "bg-[#000000]/20 border border-[#000000]/30"
                      : edits.isStaticMotion
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : "bg-white/5 border border-white/10"
                  }`}>
                    {isAnalyzingMotion
                      ? <Loader2 size={12} className="text-[#000000] animate-spin" />
                      : hasMotionTracking
                        ? <Activity size={12} className="text-[#000000]" />
                        : edits.isStaticMotion
                          ? <User size={12} className="text-blue-400" />
                          : <Scan size={12} className="text-white/40" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">AI Motion Tracking</p>
                    <p className="text-[9px] text-white/30 truncate">
                      {isAnalyzingMotion
                        ? "Menganalisis gerakan di videoΓÇª"
                        : edits.motionAnalyzed
                          ? motionMessage || "Analisis selesai"
                          : "Analisis otomatis saat crop dipilih"
                      }
                    </p>
                  </div>
                  {/* Re-analyze button */}
                  {!isAnalyzingMotion && onAnalyzeMotion && (
                    <button
                      onClick={runMotionAnalysis}
                      title="Ulangi analisis motion"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-[#000000] transition-colors shrink-0"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                </div>

                {/* Status & detail */}
                <div className="p-3 space-y-2">
                  {isAnalyzingMotion && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-[#000000] rounded-full animate-pulse" style={{ width: "60%" }} />
                      </div>
                      <span className="text-[10px] text-white/30 font-mono shrink-0">scanningΓÇª</span>
                    </div>
                  )}

                  {!isAnalyzingMotion && edits.motionAnalyzed && (
                    <MotionStatusBadge edits={edits} />
                  )}

                  {!isAnalyzingMotion && motionError && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">
                      <AlertCircle size={10} />
                      <span className="truncate">{motionError}</span>
                    </div>
                  )}

                  {!isAnalyzingMotion && edits.motionAnalyzed && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {hasMotionTracking && (
                        <>
                          <div className="bg-white/5 rounded-lg px-2.5 py-2">
                            <div className="text-[9px] text-white/25 mb-0.5">Keyframes</div>
                            <div className="text-xs text-[#000000] font-mono font-bold">
                              {edits.motionKeyframes?.length ?? 0}
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-lg px-2.5 py-2">
                            <div className="text-[9px] text-white/25 mb-0.5">Tracking</div>
                            <div className="text-xs text-[#000000] font-mono font-bold">Dynamic</div>
                          </div>
                        </>
                      )}
                      {edits.isStaticMotion && (
                        <>
                          <div className="bg-white/5 rounded-lg px-2.5 py-2">
                            <div className="text-[9px] text-white/25 mb-0.5">Orang</div>
                            <div className="text-xs text-blue-400 font-mono font-bold">Ditemukan</div>
                          </div>
                          <div className="bg-white/5 rounded-lg px-2.5 py-2">
                            <div className="text-[9px] text-white/25 mb-0.5">Mode</div>
                            <div className="text-xs text-blue-400 font-mono font-bold">Static Crop</div>
                          </div>
                        </>
                      )}
                      {edits.motionCropW && edits.motionCropH && (
                        <div className="col-span-2 bg-white/5 rounded-lg px-2.5 py-2">
                          <div className="text-[9px] text-white/25 mb-0.5">Crop Window</div>
                          <div className="text-[10px] text-white/60 font-mono">
                            {edits.motionCropW} ├ù {edits.motionCropH}px
                            {edits.motionVidW && edits.motionVidH && (
                              <span className="text-white/30 ml-1">
                                (src {edits.motionVidW}├ù{edits.motionVidH})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info note */}
                  <p className="text-[9px] text-white/20 leading-relaxed pt-1">
                    {hasMotionTracking
                      ? "Γ£à Kamera akan mengikuti orang yang bergerak saat export."
                      : edits.isStaticMotion
                        ? "≡ƒôî Crop dipusatkan ke wajah/orang yang diam."
                        : edits.motionAnalyzed
                          ? "Γ¼¢ Crop tengah diterapkan karena tidak ada orang terdeteksi."
                          : "≡ƒöì AI akan otomatis mendeteksi wajah & gerakan saat crop dipilih."
                    }
                  </p>

                  {!onAnalyzeMotion && (
                    <p className="text-[9px] text-yellow-400/50">
                      ΓÜá∩╕Å onAnalyzeMotion prop tidak tersambung
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ΓöÇΓöÇ COLOR TAB ΓöÇΓöÇ */}
        {activeTab === "color" && (
          <div className="p-4 space-y-5">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Color Adjustments</div>
            <SliderField label="Brightness" value={edits.brightness} min={-1} max={1} step={0.05}
              format={(v) => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`)}
              onChange={(v) => updateEdits({ brightness: v })} dark />
            <SliderField label="Contrast" value={edits.contrast} min={-1} max={1} step={0.05}
              format={(v) => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`)}
              onChange={(v) => updateEdits({ contrast: v })} dark />
            <SliderField label="Saturation" value={edits.saturation} min={-1} max={1} step={0.05}
              format={(v) => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`)}
              onChange={(v) => updateEdits({ saturation: v })} dark />
            <button onClick={() => updateEdits({ brightness: 0, contrast: 0, saturation: 0 })}
              className="w-full py-2 rounded-xl text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center gap-2">
              <RefreshCw size={12} /> Reset Colors
            </button>
          </div>
        )}

        {/* ΓöÇΓöÇ SPEED TAB ΓöÇΓöÇ */}
        {activeTab === "speed" && (
          <div className="p-4 space-y-4">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Playback Speed</div>
            <div className="grid grid-cols-3 gap-2">
              {SPEED_OPTIONS.map((s) => (
                <button key={s} onClick={() => updateEdits({ speed: s })}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-colors border ${edits.speed === s
                    ? "bg-[#000000]/30 border-[#000000]/50 text-[#000000]"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    }`}>{s}├ù</button>
              ))}
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              {edits.speed < 1 && "≡ƒÉó Slow motion effect"}
              {edits.speed === 1 && "Γû╢ Normal speed"}
              {edits.speed > 1 && "ΓÜí Timelapse / fast-forward"}
            </p>
          </div>
        )}

        {/* ΓöÇΓöÇ MEDIA TAB ΓöÇΓöÇ */}
        {activeTab === "media" && (
          <div className="p-4 space-y-4">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Insert Media Overlay</div>
            <label className="block cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) addImageOverlay(f); e.target.value = ""; }} />
              <div className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-white/15 hover:border-[#000000]/50 hover:bg-[#000000]/5 transition-all text-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <ImageIcon size={20} className="text-white/30" />
                </div>
                <p className="text-xs text-white/50 font-medium">Upload Image / Watermark</p>
                <p className="text-[10px] text-white/25">PNG ┬╖ JPG ┬╖ SVG ┬╖ WebP ┬╖ GIF</p>
              </div>
            </label>

            {(edits.imageOverlays ?? []).length === 0 ? (
              <div className="py-6 text-center">
                <ImageIcon size={24} className="text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/20">Upload an image to overlay on video</p>
                <p className="text-[10px] text-white/15 mt-1">Great for watermarks, logos &amp; stickers</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                    Layers ({(edits.imageOverlays ?? []).length})
                  </div>
                  <button onClick={() => updateEdits({ imageOverlays: [] })}
                    className="text-[9px] text-red-400/50 hover:text-red-400 transition-colors">
                    Clear all
                  </button>
                </div>
                {(edits.imageOverlays ?? []).map((img) => {
                  const isSelected = selectedImageId === img.id;
                  return (
                    <div key={img.id} className={`rounded-xl border transition-all overflow-hidden ${isSelected ? "border-[#000000]/50 bg-[#000000]/10" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
                      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                        onClick={() => setSelectedImageId(isSelected ? null : img.id)}>
                        <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-white/10 bg-black/30">
                          <img src={img.src} alt={img.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs text-white/80 truncate flex-1">{img.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); removeImageOverlay(img.id); }}
                          className="p-1 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors shrink-0">
                          <Trash2 size={11} />
                        </button>
                        <div className="text-white/20">{isSelected ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</div>
                      </div>
                      {isSelected && (
                        <div className="border-t border-white/10 p-3 space-y-3">
                          <div>
                            <div className="text-[9px] text-white/25 mb-1">Size: {Math.round(img.width * 100)}%</div>
                            <input type="range" min={0.02} max={1} step={0.01} value={img.width}
                              onChange={(e) => updateImageOverlay(img.id, { width: +e.target.value })} className="w-full accent-[#000000]" />
                          </div>
                          <div>
                            <div className="text-[9px] text-white/25 mb-1">Opacity: {Math.round(img.opacity * 100)}%</div>
                            <input type="range" min={0.05} max={1} step={0.05} value={img.opacity}
                              onChange={(e) => updateImageOverlay(img.id, { opacity: +e.target.value })} className="w-full accent-[#000000]" />
                          </div>
                          <div>
                            <div className="text-[9px] text-white/25 mb-1">Position</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-[9px] text-white/20 mb-0.5">X: {Math.round(img.x * 100)}%</div>
                                <input type="range" min={0} max={1} step={0.01} value={img.x}
                                  onChange={(e) => updateImageOverlay(img.id, { x: +e.target.value })} className="w-full accent-[#000000]" />
                              </div>
                              <div>
                                <div className="text-[9px] text-white/20 mb-0.5">Y: {Math.round(img.y * 100)}%</div>
                                <input type="range" min={0} max={1} step={0.01} value={img.y}
                                  onChange={(e) => updateImageOverlay(img.id, { y: +e.target.value })} className="w-full accent-[#000000]" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-white/25 mb-1">Visible Duration</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-[9px] text-white/20 mb-0.5">Start: {(img.startSec ?? 0).toFixed(1)}s</div>
                                <input type="range" min={0} max={Math.max(0, clipDuration - 0.5)} step={0.1}
                                  value={img.startSec ?? 0}
                                  onChange={(e) => updateImageOverlay(img.id, { startSec: +e.target.value })} className="w-full accent-[#000000]" />
                              </div>
                              <div>
                                <div className="text-[9px] text-white/20 mb-0.5">End: {(img.endSec ?? clipDuration).toFixed(1)}s</div>
                                <input type="range" min={0.5} max={clipDuration} step={0.1}
                                  value={img.endSec ?? clipDuration}
                                  onChange={(e) => updateImageOverlay(img.id, { endSec: +e.target.value })} className="w-full accent-[#000000]" />
                              </div>
                            </div>
                          </div>
                          <p className="text-[9px] text-white/20">Drag image directly on video to reposition</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* ── INTRO TEXT TAB ── */}
        {activeTab === "intro" && (
          <div className="p-4 space-y-5">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
              Intro Copywriting
            </div>

            {/* Info card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
              <p className="text-xs text-white/70 font-medium leading-snug">
                ✦ Teks headline di 4 detik pertama
              </p>
              <p className="text-[11px] text-white/35 leading-relaxed">
                Muncul langsung saat video mulai, lalu fade-out halus di detik ke-3→4.
                Font mengikuti preset subtitle yang aktif.
              </p>
            </div>

            {/* Text input */}
            <div className="space-y-2">
              <label className="text-[11px] text-white/50 font-medium">Teks Headline</label>
              <textarea
                value={edits.introText ?? ""}
                onChange={(e) => updateEdits({ introText: e.target.value })}
                placeholder={"Contoh: The moment everything changed."}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/30 transition-colors"
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/25">
                  Singkat dan padat — maks ~8 kata
                </p>
                {(edits.introText ?? "").length > 0 && (
                  <button
                    onClick={() => updateEdits({ introText: "" })}
                    className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {/* Quick picks */}
            <div className="space-y-2">
              <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Quick Pick</div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  "The moment everything changed.",
                  "You need to see this.",
                  "This changes everything.",
                  "Nobody talks about this.",
                  "Watch until the end.",
                  "This is why it works.",
                ].map((phrase) => (
                  <button
                    key={phrase}
                    onClick={() => updateEdits({ introText: phrase })}
                    className={`text-left px-3 py-2 rounded-lg text-xs transition-all border ${
                      edits.introText === phrase
                        ? "bg-white/15 border-white/30 text-white"
                        : "bg-white/5 border-white/8 text-white/45 hover:text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>

            {/* Active state indicator */}
            {(edits.introText ?? "").trim().length > 0 && (
              <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <p className="text-[11px] text-white/60">
                  Intro aktif — akan dirender saat export
                </p>
              </div>
            )}
          </div>
        )}

      </>
    );
  }

  // ─── RENDER

  // ΓöÇΓöÇΓöÇ RENDER ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center md:p-2">
      <div className="bg-[#111] border-0 md:border md:border-white/10 rounded-none md:rounded-2xl w-full h-full md:max-w-[1300px] md:h-[95vh] overflow-hidden flex flex-col shadow-2xl">

        {/* ΓöÇΓöÇ Header ΓöÇΓöÇ */}
        <div className="flex items-center justify-between px-3 md:px-5 py-2.5 md:py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={onClose} className="p-1.5 md:hidden rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-[#000000] flex items-center justify-center shrink-0">
              <Type size={11} className="text-white md:hidden" />
              <Type size={13} className="text-white hidden md:block" />
            </div>
            <div>
              <h2 className="text-xs md:text-sm font-bold text-white leading-tight truncate max-w-[150px] md:max-w-none">{moment.label}</h2>
              <p className="text-[9px] md:text-[10px] text-white/40 font-mono">
                {formatTime(clipStart)} ΓåÆ {formatTime(clipEnd)} ┬╖ {Math.round(clipDuration)}s
                {hasMotionTracking && (
                  <span className="ml-2 text-[#000000]/70 inline-flex items-center gap-0.5">
                    <Activity size={8} /> tracking
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? "bg-[#000000] text-white shadow" : "text-white/50 hover:text-white/80"}`}>
                <Icon size={11} />
                {label}
                {/* Crop tab: show motion tracking indicator dot */}
                {id === "crop" && edits.aspectRatio !== "original" && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isAnalyzingMotion ? "bg-yellow-400 animate-pulse" :
                    hasMotionTracking ? "bg-[#000000]" :
                    edits.motionAnalyzed ? "bg-blue-400" : "bg-white/20"
                  }`} />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button onClick={() => setMobileShowPanel(!mobileShowPanel)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-medium">
              <Sliders size={13} /> Edit
            </button>
            <button onClick={() => onExport(moment, edits)} disabled={isExporting || !videoSrc}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#16a085] disabled:opacity-40 transition-all shadow-lg">
              {isExporting ? <><Loader2 size={13} className="animate-spin" /><span className="hidden sm:inline">Exporting...</span></> : <><Download size={13} /><span className="hidden sm:inline">Export</span></>}
            </button>
            <button onClick={onClose} className="hidden md:flex p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ΓöÇΓöÇ Body ΓöÇΓöÇ */}
        <div className="flex flex-1 overflow-hidden min-h-0 flex-col md:flex-row">

          {/* ΓöÇΓöÇ Video area ΓöÇΓöÇ */}
          <div className={`flex flex-col min-w-0 bg-black ${mobileShowPanel ? "hidden md:flex md:flex-1" : "flex flex-1"}`}>
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {videoSrc ? (
                <div ref={videoWrapRef} className="relative"
                  style={isCropped
                    ? { aspectRatio: cssAspectRatio, maxHeight: "100%", maxWidth: "100%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" }
                    : { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }
                  }>
                  <video ref={videoRef} src={videoSrc}
                    className={isCropped ? "w-full h-full" : "max-h-full max-w-full"}
                    style={{
                      objectFit: isCropped ? "cover" : "contain",
                      filter: `brightness(${1 + edits.brightness}) contrast(${1 + edits.contrast}) saturate(${1 + edits.saturation})`,
                      userSelect: "none",
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    playsInline
                  />

                  {/* Snap guides */}
                  {snapGuides.x && (
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[#000000]/80 pointer-events-none z-20">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#000000] bg-transparent" />
                    </div>
                  )}
                  {snapGuides.y && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#000000]/80 pointer-events-none z-20">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#000000] bg-transparent" />
                    </div>
                  )}

                  {/* Image overlays on video */}
                  {(edits.imageOverlays ?? []).map((img) => {
                    const imgRelTime = currentTime - clipStart;
                    const imgStart = img.startSec ?? 0;
                    const imgEnd = img.endSec ?? clipDuration;
                    const isVisible = imgRelTime >= imgStart && imgRelTime <= imgEnd;
                    const isSelected = selectedImageId === img.id;
                    if (!isVisible && !isSelected) return null;
                    return (
                      <div key={img.id}
                        className={`absolute select-none ${draggingImageId === img.id ? "cursor-grabbing" : "cursor-grab"} ${isSelected ? "z-30" : "z-10"}`}
                        style={{
                          left: `${img.x * 100}%`, top: `${img.y * 100}%`,
                          transform: "translate(-50%, -50%)", width: `${img.width * 100}%`,
                          opacity: isVisible ? img.opacity : 0.3,
                        }}
                        onMouseDown={(e) => handleImageMouseDown(e, img.id)}
                        onClick={(e) => { e.stopPropagation(); setSelectedImageId(img.id); }}>
                        <img src={img.src} alt={img.name} className="w-full h-auto block pointer-events-none" draggable={false} />
                        {isSelected && (
                          <div className="absolute -inset-1 border border-[#000000]/70 rounded pointer-events-none" style={{ borderStyle: "dashed" }}>
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#000000] text-white text-[9px] px-2 py-0.5 rounded font-mono whitespace-nowrap">
                              {img.name} ┬╖ {Math.round(img.width * 100)}%
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Text overlays on video */}
                  {edits.textOverlays.map((t) => {
                    const isVisible = visibleOverlayIds.has(t.id);
                    const isSelected = selectedOverlayId === t.id;
                    if (!isVisible && !isSelected) return null;
                    const displayText = t.uppercase ? t.text.toUpperCase() : t.text;
                    const fontFamily = `'${t.fontFamily || "Montserrat"}', sans-serif`;
                    const scaledFontSize = t.fontSize * fontPreviewScale;
                    const scaledOutline = (t.outlineWidth ?? 0) * fontPreviewScale;
                    const scaledLetterSpace = (t.letterSpacing ?? 0) * fontPreviewScale;
                    return (
                      <div key={t.id}
                        className={`absolute select-none ${draggingTextId === t.id ? "cursor-grabbing" : "cursor-grab"} ${isSelected ? "z-30" : "z-10"}`}
                        style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, transform: "translate(-50%, -50%)", opacity: isVisible ? (t.opacity ?? 1) : 0 }}
                        onMouseDown={(e) => handleTextMouseDown(e, t.id)}
                        onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(t.id); }}>
                        {t.backgroundEnabled && (
                          <div className="absolute rounded pointer-events-none"
                            style={{
                              inset: `-${(t.backgroundPadding ?? 10) * fontPreviewScale}px`,
                              backgroundColor: hexToRgba(t.backgroundColor || "#000000", t.backgroundOpacity ?? 0.6),
                              zIndex: 0,
                            }} />
                        )}
                        <div style={{
                          position: "relative", zIndex: 1,
                          fontSize: `${scaledFontSize}px`, fontFamily,
                          color: t.color,
                          fontWeight: t.bold ? "bold" : "normal",
                          fontStyle: t.italic ? "italic" : "normal",
                          textTransform: t.uppercase ? "uppercase" : "none",
                          textAlign: t.textAlign || "center",
                          letterSpacing: `${scaledLetterSpace}px`,
                          lineHeight: t.lineHeight || 1.2,
                          WebkitTextStroke: scaledOutline > 0 ? `${scaledOutline}px ${t.outlineColor || "#000000"}` : undefined,
                          textShadow: buildTextShadow(t, fontPreviewScale),
                          whiteSpace: "nowrap",
                        }}>
                          {displayText}
                        </div>
                        {isSelected && (
                          <div className="absolute -inset-2 border border-[#000000]/70 rounded pointer-events-none" style={{ borderStyle: "dashed" }}>
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#000000] text-white text-[9px] px-2 py-0.5 rounded font-mono whitespace-nowrap flex items-center gap-1">
                              {t.isAutoSubtitle && <Sparkles size={8} />}
                              {t.fontFamily} ┬╖ {t.fontSize} ┬╖ ~{Math.round(scaledFontSize)}px
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ── Vintage Cinematic Frame Overlay ── */}
                  {/* True FILM FRAME: dark border on all 4 sides, center 100% transparent.
                      NOT a vignette (vignette = radial gradient that also darkens center).
                      Uses inset box-shadow spread so border follows border-radius at corners.
                      pointer-events:none so drag/click on video/overlays still works. */}
                  <div
                    className="absolute inset-0 select-none pointer-events-none"
                    style={{
                      zIndex: 36,
                      // Rounded corners matching film/projector gate aesthetic
                      borderRadius: isCropped ? "12px" : "6px",
                      // Center is completely transparent — video shows through with zero darkening.
                      background: "transparent",
                      // Film frame border built from layered inset shadows:
                      //  Layer 1: solid ~30px frame border (near-opaque black)
                      //  Layer 2: 37px softer fade (transition zone)
                      //  Layer 3: 44px feather to transparent (inner edge blend)
                      //  Layer 4: corner depth — subtle extra dark at corners via blur
                      //  Layer 5: inner highlight — thin white glow at frame inner edge (vintage projector light bleed)
                      boxShadow: [
                        "inset 0 0 0 30px rgba(0,0,0,0.93)",      // solid frame border
                        "inset 0 0 0 38px rgba(0,0,0,0.52)",      // transition band
                        "inset 0 0 0 46px rgba(0,0,0,0.18)",      // feather to transparent
                        "inset 0 0 10px 29px rgba(0,0,0,0.35)",   // corner/depth shadow
                        "inset 0 0 3px 29px rgba(255,255,255,0.07)", // inner film highlight
                      ].join(", "),
                    }}
                  />

                  {/* Crop & motion tracking overlay badges */}
                  {isCropped && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                      <div className="px-2 py-0.5 rounded-md bg-black/60 text-[#000000] text-[10px] font-mono border border-[#000000]/30">
                        {edits.aspectRatio}
                      </div>
                      {isAnalyzingMotion && (
                        <div className="px-2 py-0.5 rounded-md bg-black/60 text-yellow-400 text-[10px] font-mono border border-yellow-400/30 flex items-center gap-1">
                          <Loader2 size={8} className="animate-spin" /> scanning
                        </div>
                      )}
                      {!isAnalyzingMotion && hasMotionTracking && (
                        <div className="px-2 py-0.5 rounded-md bg-black/60 text-[#000000] text-[10px] font-mono border border-[#000000]/30 flex items-center gap-1">
                          <Activity size={8} /> tracking
                        </div>
                      )}
                      {!isAnalyzingMotion && edits.isStaticMotion && (
                        <div className="px-2 py-0.5 rounded-md bg-black/60 text-blue-400 text-[10px] font-mono border border-blue-400/30 flex items-center gap-1">
                          <User size={8} /> static
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-white/30 p-8"><p className="text-sm">Video tidak tersedia.</p></div>
              )}
            </div>

            {/* Playback controls */}
            <div className="shrink-0 px-3 md:px-4 py-3 bg-[#0a0a0a] border-t border-white/10">
              <div
                ref={progressBarRef}
                className={`h-2.5 md:h-2 bg-white/10 rounded-full mb-3 relative group select-none ${isDraggingProgress ? "cursor-grabbing" : "cursor-pointer"}`}
                onMouseDown={handleProgressMouseDown}
                onTouchStart={handleProgressTouchStart}
                onTouchMove={handleProgressTouchMove}
              >
                <div className="absolute inset-y-0 left-0 bg-[#000000] rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
                <div
                  className={`absolute top-1/2 w-4 h-4 rounded-full bg-[#000000] border-2 border-white shadow-lg pointer-events-none transition-opacity ${isDraggingProgress ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"}`}
                  style={{ left: `${progressPct}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <button onClick={() => seek(-5)} className="p-2 md:p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"><SkipBack size={14} /></button>
                  <button onClick={togglePlay} className="p-2.5 bg-[#000000] rounded-xl hover:bg-[#16a085] transition-colors text-white">
                    {isPlaying ? <Pause size={16} /> : <Play size={16} fill="white" />}
                  </button>
                  <button onClick={() => seek(5)} className="p-2 md:p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"><SkipForward size={14} /></button>
                  <span className="text-[11px] font-mono text-white/40 ml-1">
                    {formatTime(Math.max(0, currentTime - clipStart))} / {formatTime(clipDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
                  {autoCount > 0 && <span className="flex items-center gap-1 text-[#000000]/60"><Sparkles size={9} />{autoCount}</span>}
                  {edits.speed !== 1 && <span>{edits.speed}├ù</span>}
                  {edits.aspectRatio !== "original" && <span>{edits.aspectRatio}</span>}
                  {hasMotionTracking && <span className="flex items-center gap-0.5 text-[#000000]/60"><Activity size={9} />AI</span>}
                  {(edits.introText ?? "").trim().length > 0 && <span className="flex items-center gap-0.5 text-purple-400/70"><Sparkles size={9} />Intro</span>}
                </div>
              </div>
            </div>

            {/* Subtitle Timeline ΓÇö desktop only */}
            {activeTab === "subtitle" && (
              <div className="shrink-0 bg-[#0d0d0d] border-t border-white/10 flex-col hidden md:flex" style={{ minHeight: "120px", maxHeight: "220px" }}>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
                  <Type size={11} className="text-[#000000]" />
                  <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Subtitle Timeline</span>
                  {autoCount > 0 && (
                    <span className="flex items-center gap-1 text-[9px] text-[#000000]/60 ml-1">
                      <Sparkles size={9} />{autoCount} auto ┬╖ {manualCount} manual
                    </span>
                  )}
                </div>
                <div className="px-4 pt-1 shrink-0">
                  <div className="relative h-5">
                    {Array.from({ length: Math.ceil(clipDuration) + 1 }).map((_, i) => (
                      <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${(i / clipDuration) * 100}%` }}>
                        <div className="w-px h-2 bg-white/20" />
                        <span className="text-[8px] text-white/25 font-mono mt-0.5">{i}s</span>
                      </div>
                    ))}
                    <div className="absolute top-0 bottom-0 w-px bg-[#000000] z-10 pointer-events-none" style={{ left: `${progressPct}%` }}>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#000000]" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
                  <div ref={timelineRef} className="relative cursor-crosshair"
                    onClick={handleTimelineClick}
                    style={{ height: `${Math.max(1, edits.textOverlays.length) * 36 + 8}px` }}>
                    {edits.textOverlays.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/20">
                        Generate auto subtitles or add text ΓåÆ clips appear here
                      </div>
                    )}
                    {edits.textOverlays.map((t, index) => {
                      const s = t.startSec ?? 0;
                      const en = t.endSec ?? clipDuration;
                      const leftPct = (s / clipDuration) * 100;
                      const widthPct = ((en - s) / clipDuration) * 100;
                      const isSelected = selectedOverlayId === t.id;
                      return (
                        <div key={t.id} className="absolute"
                          style={{ top: `${index * 36 + 4}px`, left: `${leftPct}%`, width: `${widthPct}%`, height: "28px" }}>
                          <div
                            className={`relative w-full h-full rounded-md flex items-center overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${isSelected
                              ? "bg-[#000000]/30 border-[#000000] shadow-[0_0_8px_rgba(26,188,113,0.4)]"
                              : t.isAutoSubtitle
                                ? "bg-purple-500/15 border-purple-500/40 hover:bg-purple-500/25"
                                : "bg-[#000000]/15 border-[#000000]/40 hover:bg-[#000000]/25"
                              }`}
                            onMouseDown={(e) => { e.stopPropagation(); handleTimelineMouseDown(e, t.id, "move"); }}
                            onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(t.id); setExpandedId(t.id); setSubtitleSubTab("layers"); }}>
                            <div className="flex-1 px-2 truncate flex items-center gap-1">
                              {t.isAutoSubtitle && <Sparkles size={8} className="text-purple-400 shrink-0" />}
                              <span className="text-[10px] text-white/80 font-medium truncate"
                                style={{ fontFamily: `'${t.fontFamily || "Montserrat"}', sans-serif` }}>
                                {t.uppercase ? t.text.toUpperCase() : t.text}
                              </span>
                            </div>
                          </div>
                          <div className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize flex items-center justify-center z-10"
                            onMouseDown={(e) => { e.stopPropagation(); handleTimelineMouseDown(e, t.id, "left"); }}>
                            <div className="w-0.5 h-3/4 rounded-full bg-[#000000]/60 hover:bg-[#000000]" />
                          </div>
                          <div className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize flex items-center justify-center z-10"
                            onMouseDown={(e) => { e.stopPropagation(); handleTimelineMouseDown(e, t.id, "right"); }}>
                            <div className="w-0.5 h-3/4 rounded-full bg-[#000000]/60 hover:bg-[#000000]" />
                          </div>
                        </div>
                      );
                    })}
                    <div className="absolute top-0 bottom-0 w-px bg-[#000000]/60 pointer-events-none z-20" style={{ left: `${progressPct}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: Bottom tab bar */}
            <div className="md:hidden shrink-0 flex items-center bg-[#0a0a0a] border-t border-white/10 overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id}
                  onClick={() => { setActiveTab(id); setMobileShowPanel(true); }}
                  className={`flex flex-col items-center gap-1 px-4 py-2.5 text-[10px] font-medium transition-colors shrink-0 relative ${activeTab === id && mobileShowPanel ? "text-[#000000]" : "text-white/40 hover:text-white/70"}`}>
                  <Icon size={18} />
                  {label}
                  {/* Motion dot on crop tab */}
                  {id === "crop" && edits.aspectRatio !== "original" && (
                    <span className={`absolute top-2 right-3 w-1.5 h-1.5 rounded-full ${
                      isAnalyzingMotion ? "bg-yellow-400 animate-pulse" :
                      hasMotionTracking ? "bg-[#000000]" :
                      edits.motionAnalyzed ? "bg-blue-400" : "bg-white/20"
                    }`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ΓöÇΓöÇ Right panel: Desktop sidebar ΓöÇΓöÇ */}
          <div className="w-80 border-l border-white/10 flex-col overflow-hidden shrink-0 bg-[#0e0e0e] hidden md:flex">
            <div className="flex-1 overflow-y-auto">
              {renderPanelContent()}
            </div>
          </div>

          {/* ΓöÇΓöÇ Mobile: Full-screen panel overlay ΓöÇΓöÇ */}
          {mobileShowPanel && (
            <div className="md:hidden absolute inset-0 z-10 bg-[#0e0e0e] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  {(() => {
                    const tab = TABS.find(t => t.id === activeTab);
                    const Icon = tab?.icon ?? Type;
                    return (
                      <>
                        <Icon size={14} className="text-[#000000]" />
                        <span className="text-sm font-semibold text-white capitalize">{tab?.label}</span>
                        {activeTab === "crop" && edits.aspectRatio !== "original" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isAnalyzingMotion ? "text-yellow-400" :
                            hasMotionTracking ? "text-[#000000]" :
                            "text-white/30"
                          }`}>
                            {isAnalyzingMotion ? "scanningΓÇª" : hasMotionTracking ? "tracking ON" : edits.isStaticMotion ? "static" : ""}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <button onClick={() => setMobileShowPanel(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {renderPanelContent()}
              </div>
              <div className="shrink-0 flex items-center bg-[#0a0a0a] border-t border-white/10 overflow-x-auto">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`flex flex-col items-center gap-1 px-4 py-2.5 text-[10px] font-medium transition-colors shrink-0 ${activeTab === id ? "text-[#000000]" : "text-white/40 hover:text-white/70"}`}>
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}