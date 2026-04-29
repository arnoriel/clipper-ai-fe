// src/components/VideoEditor.tsx
// CapCut-style mobile editor — video always visible, touch drag, copy transcript
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Play, Pause, SkipBack, SkipForward, Type, Crop,
  Sliders, Zap, Download, Loader2, Plus, Trash2, Clock, RefreshCw,
  AlignCenter, AlignLeft, AlignRight, Bold, Italic, ChevronDown, ChevronUp,
  Eye, EyeOff, CaseSensitive, Sparkles, Wand2, Check, Image as ImageIcon,
  ChevronLeft, Scan, Activity, User, AlertCircle, Info, Copy, ClipboardCheck,
} from "lucide-react";
import type { ViralMoment } from "../lib/AI";
import { formatTime } from "../lib/AI";
import type { ClipEdits, TextOverlay, MotionAnalysisResult } from "../lib/storage";
import {
  generateId, defaultTextOverlay, defaultImageOverlay,
  loadAllSubtitleFonts, SUBTITLE_FONTS, SUBTITLE_PRESETS, applyPresetToOverlay,
  type SubtitlePreset, type ImageOverlay,
} from "../lib/storage";

interface Props {
  moment: ViralMoment; edits: ClipEdits; videoSrc: string;
  onUpdateEdits: (edits: ClipEdits) => void;
  onExport: (moment: ViralMoment, edits: ClipEdits) => void;
  onClose: () => void; isExporting: boolean;
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
  "sans-serif": "Sans-serif", "display": "Display / Impact",
  "handwriting": "Handwriting", "serif": "Serif", "monospace": "Monospace",
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
  return `${(t.shadowX ?? 2) * scale}px ${(t.shadowY ?? 2) * scale}px 0px ${color}`;
}

// ── Font picker ────────────────────────────────────────────────────────────────
function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) { document.addEventListener("pointerdown", handler); }
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);
  const cats = ["display", "sans-serif", "serif", "handwriting", "monospace"] as const;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2.5 bg-black/40 border border-white/15 rounded-xl text-left hover:border-white/30 transition-colors">
        <span className="text-sm text-white/90 truncate" style={{ fontFamily: `'${value}', sans-serif` }}>{value}</span>
        <ChevronDown size={12} className={`text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-[#181818] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: "220px" }}>
            {cats.map((cat) => {
              const fonts = SUBTITLE_FONTS.filter((f) => f.category === cat);
              if (!fonts.length) return null;
              return (
                <div key={cat}>
                  <div className="px-3 pt-2 pb-1 text-[9px] text-white/25 font-medium uppercase tracking-widest sticky top-0 bg-[#181818]">{CATEGORY_LABELS[cat]}</div>
                  {fonts.map((font) => (
                    <button key={font.name} onClick={() => { onChange(font.name); setOpen(false); }}
                      className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/8 ${value === font.name ? "text-white bg-white/10" : "text-white/70"}`}
                      style={{ fontFamily: `'${font.name}', sans-serif` }}>{font.name}</button>
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

function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-white/40 shrink-0 w-16">{label}</label>
      <div className="relative flex-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="h-8 rounded-lg border border-white/20 flex items-center px-2 gap-2 cursor-pointer" style={{ backgroundColor: hexToRgba(value, 0.3) }}>
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: value }} />
          <span className="text-[10px] font-mono text-white/60">{value.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

function PresetCard({ preset, isActive, onClick }: { preset: SubtitlePreset; isActive: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative w-full rounded-xl overflow-hidden border transition-all duration-200 text-left ${isActive ? "border-white/50 shadow-[0_0_12px_rgba(255,255,255,0.15)]" : "border-white/10 hover:border-white/25"}`}>
      <div className="h-14 flex items-center justify-center px-2" style={{ backgroundColor: preset.previewBg }}>
        <span className="text-center leading-tight" style={{
          fontFamily: `'${preset.overrides.fontFamily ?? "Montserrat"}', sans-serif`, fontSize: "13px",
          fontWeight: preset.overrides.bold ? "bold" : "normal", color: preset.previewText,
          textTransform: preset.overrides.uppercase ? "uppercase" : "none",
          letterSpacing: `${(preset.overrides.letterSpacing ?? 0) * 0.3}px`,
          textShadow: preset.overrides.shadowEnabled ? `${preset.overrides.shadowX ?? 2}px ${preset.overrides.shadowY ?? 2}px ${preset.overrides.shadowBlur ?? 8}px ${preset.previewAccent}40` : "none",
          WebkitTextStroke: (preset.overrides.outlineWidth ?? 0) > 0 ? `${Math.min(1.5, preset.overrides.outlineWidth ?? 0)}px ${preset.overrides.outlineColor ?? "#000"}` : undefined,
          paintOrder: (preset.overrides.outlineWidth ?? 0) > 0 ? "stroke fill" : undefined,
          ...(preset.overrides.backgroundEnabled ? { background: hexToRgba(preset.overrides.backgroundColor ?? "#000", preset.overrides.backgroundOpacity ?? 0.8), padding: "2px 8px", borderRadius: "4px" } : {}),
        }}>{preset.emoji} {preset.name}</span>
      </div>
      <div className={`px-2 py-1.5 ${isActive ? "bg-white/10" : "bg-[#111]"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white/80 truncate">{preset.name}</span>
          {isActive && <Check size={10} className="text-white shrink-0" />}
        </div>
      </div>
    </button>
  );
}

function SliderField({ label, value, min, max, step, format, onChange, dark }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; dark?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className={`text-xs ${dark ? "text-white/50" : "text-gray-600"}`}>{label}</label>
        <span className="text-xs font-mono text-white/80">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 accent-white" style={{ touchAction: "none" }} />
    </div>
  );
}

function MotionStatusBadge({ edits }: { edits: ClipEdits }) {
  if (!edits.motionAnalyzed) return null;
  if (!edits.motionAvailable) return <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px]"><AlertCircle size={10} /><span>OpenCV tidak tersedia di server</span></div>;
  if (edits.motionKeyframes && edits.motionKeyframes.length > 1 && !edits.isStaticMotion) return <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-[10px]"><Activity size={10} className="shrink-0" /><span>AI Tracking aktif · {edits.motionKeyframes.length} keyframes</span></div>;
  if (edits.isStaticMotion) return <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px]"><User size={10} className="shrink-0" /><span>Wajah ditemukan · crop statis</span></div>;
  return <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[10px]"><Info size={10} className="shrink-0" /><span>Tidak ada orang terdeteksi · center crop</span></div>;
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function VideoEditor({ moment, edits, videoSrc, onUpdateEdits, onExport, onClose, isExporting, onAutoSubtitle, onAnalyzeMotion, credits }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hasCredits = (credits ?? 1) > 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("subtitle");
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mobileShowPanel, setMobileShowPanel] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState("");
  const [subtitleSubTab, setSubtitleSubTab] = useState<"presets" | "layers" | "add">("presets");
  const [isAnalyzingMotion, setIsAnalyzingMotion] = useState(false);
  const [motionError, setMotionError] = useState("");
  const lastAnalyzedRatioRef = useRef<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const dragStartRef = useRef<{ startX: number; startY: number; textX: number; textY: number } | null>(null);
  const imageDragStartRef = useRef<{ startX: number; startY: number; imgX: number; imgY: number } | null>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [draggingTimelineId, setDraggingTimelineId] = useState<string | null>(null);
  const [draggingTimelineEdge, setDraggingTimelineEdge] = useState<"left" | "right" | "move" | null>(null);
  const timelineDragRef = useRef<{ startX: number; origStart: number; origEnd: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const el = videoWrapRef.current; if (!el) return;
    const obs = new ResizeObserver(([e]) => setPreviewWidth(e.contentRect.width));
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const clipStart = moment.startTime + edits.trimStart;
  const clipEnd = moment.endTime + edits.trimEnd;
  const clipDuration = clipEnd - clipStart;
  const activePresetId = edits.activePresetId ?? "bold-impact";
  const fontPreviewScale = previewWidth > 0 ? previewWidth / FONT_REFERENCE_WIDTH : 1;
  const progressPct = clipDuration > 0 ? ((currentTime - clipStart) / clipDuration) * 100 : 0;
  const isCropped = edits.aspectRatio !== "original";
  const [arW, arH] = isCropped ? edits.aspectRatio.split(":").map(Number) : [16, 9];
  const cssAspectRatio = `${arW} / ${arH}`;
  const relTime = currentTime - clipStart;
  const visibleOverlayIds = new Set(edits.textOverlays.filter((t) => { const s = t.startSec ?? 0; const en = t.endSec ?? clipDuration; return relTime >= s && relTime <= en; }).map((t) => t.id));
  const autoCount = edits.textOverlays.filter((t) => t.isAutoSubtitle).length;
  const manualCount = edits.textOverlays.filter((t) => !t.isAutoSubtitle).length;
  const hasMotionTracking = edits.motionAnalyzed && edits.motionKeyframes && edits.motionKeyframes.length > 0 && !edits.isStaticMotion;
  const motionMessage = edits.motionMessage ?? "";
  const currentPreset = SUBTITLE_PRESETS.find((p) => p.id === activePresetId) ?? SUBTITLE_PRESETS[0];

  useEffect(() => { loadAllSubtitleFonts(); }, []);

  useEffect(() => {
    const ratio = edits.aspectRatio;
    if (ratio === "original") { lastAnalyzedRatioRef.current = null; return; }
    if (!onAnalyzeMotion || (edits.motionAnalyzed && lastAnalyzedRatioRef.current === ratio) || isAnalyzingMotion) return;
    lastAnalyzedRatioRef.current = ratio;
    runMotionAnalysis();
  }, [edits.aspectRatio]);

  async function runMotionAnalysis() {
    if (!onAnalyzeMotion || isAnalyzingMotion) return;
    setIsAnalyzingMotion(true); setMotionError("");
    try { await onAnalyzeMotion(); } catch (e: any) { setMotionError(e.message || "Motion analysis failed"); }
    finally { setIsAnalyzingMotion(false); }
  }

  function updateEdits(partial: Partial<ClipEdits>) { onUpdateEdits({ ...edits, ...partial }); }

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
    updateEdits({ imageOverlays: (edits.imageOverlays ?? []).map((img) => img.id === id ? { ...img, ...changes } : img) });
  }
  function removeImageOverlay(id: string) {
    updateEdits({ imageOverlays: (edits.imageOverlays ?? []).filter((img) => img.id !== id) });
    if (selectedImageId === id) setSelectedImageId(null);
  }

  // ── Pointer (mouse + touch) drag for image overlays ───────────────────────
  const handleImagePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingImageId(id); setSelectedImageId(id);
    const img = (edits.imageOverlays ?? []).find((i) => i.id === id);
    if (!img) return;
    imageDragStartRef.current = { startX: e.clientX, startY: e.clientY, imgX: img.x, imgY: img.y };
  }, [edits.imageOverlays]);

  const handleImagePointerMove = useCallback((e: React.PointerEvent, id: string) => {
    if (draggingImageId !== id || !imageDragStartRef.current || !videoWrapRef.current) return;
    const rect = videoWrapRef.current.getBoundingClientRect();
    updateImageOverlay(id, {
      x: Math.min(1, Math.max(0, imageDragStartRef.current.imgX + (e.clientX - imageDragStartRef.current.startX) / rect.width)),
      y: Math.min(1, Math.max(0, imageDragStartRef.current.imgY + (e.clientY - imageDragStartRef.current.startY) / rect.height)),
    });
  }, [draggingImageId]);

  const handleImagePointerUp = useCallback(() => { setDraggingImageId(null); imageDragStartRef.current = null; }, []);

  // Video sync
  useEffect(() => {
    const v = videoRef.current; if (!v || !videoSrc) return;
    v.currentTime = clipStart; setCurrentTime(clipStart);
    const onTime = () => { setCurrentTime(v.currentTime); if (v.currentTime >= clipEnd) { v.pause(); v.currentTime = clipStart; setIsPlaying(false); } };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [videoSrc, clipStart, clipEnd]);

  function togglePlay() {
    const v = videoRef.current; if (!v) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else { if (v.currentTime >= clipEnd) v.currentTime = clipStart; v.play(); setIsPlaying(true); }
  }
  function seek(delta: number) { const v = videoRef.current; if (!v) return; v.currentTime = Math.min(Math.max(v.currentTime + delta, clipStart), clipEnd); }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { const tag = (e.target as HTMLElement).tagName; if (tag === "INPUT" || tag === "TEXTAREA") return; if (e.code === "Space") { e.preventDefault(); togglePlay(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying]);

  // ── Progress bar (Pointer API) ────────────────────────────────────────────
  function seekToClientX(clientX: number) {
    const bar = progressBarRef.current; if (!bar || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    videoRef.current.currentTime = clipStart + Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * clipDuration;
  }
  const handleProgressPointerDown = (e: React.PointerEvent) => { e.preventDefault(); (e.target as Element).setPointerCapture(e.pointerId); setIsDraggingProgress(true); seekToClientX(e.clientX); };
  const handleProgressPointerMove = (e: React.PointerEvent) => { if (isDraggingProgress) seekToClientX(e.clientX); };
  const handleProgressPointerUp = () => setIsDraggingProgress(false);

  // ── Text overlay CRUD ─────────────────────────────────────────────────────
  function applyPresetToAllAuto(presetId: string) {
    const preset = SUBTITLE_PRESETS.find((p) => p.id === presetId); if (!preset) return;
    updateEdits({ textOverlays: edits.textOverlays.map((t) => t.isAutoSubtitle ? applyPresetToOverlay(t, preset) : t), activePresetId: presetId });
  }
  async function handleAutoSubtitle() {
    if (!onAutoSubtitle) return; setIsTranscribing(true); setTranscribeError("");
    try {
      const result = await onAutoSubtitle();
      if (!result) { setTranscribeError("No response from server."); return; }
      const chunks = (result as any).chunks as { text: string; start: number; end: number }[] | undefined;
      if (!chunks || chunks.length === 0) { setTranscribeError("No speech detected."); return; }
      const preset = SUBTITLE_PRESETS.find((p) => p.id === activePresetId) ?? SUBTITLE_PRESETS[0];
      const manual = edits.textOverlays.filter((t) => !t.isAutoSubtitle);
      const newOverlays: TextOverlay[] = chunks.map((chunk) => applyPresetToOverlay(defaultTextOverlay({ id: generateId(), text: chunk.text, startSec: parseFloat(chunk.start.toFixed(3)), endSec: parseFloat(chunk.end.toFixed(3)), isAutoSubtitle: true }), preset));
      updateEdits({ textOverlays: [...manual, ...newOverlays] }); setSubtitleSubTab("layers");
    } catch (e: any) { setTranscribeError(e.message || "Transcription failed"); }
    finally { setIsTranscribing(false); }
  }
  function clearAutoSubtitles() { updateEdits({ textOverlays: edits.textOverlays.filter((t) => !t.isAutoSubtitle) }); }
  function addTextOverlay() {
    if (!newText.trim()) return;
    const preset = SUBTITLE_PRESETS.find((p) => p.id === activePresetId) ?? SUBTITLE_PRESETS[0];
    const base = defaultTextOverlay({ id: generateId(), text: newText.trim(), startSec: Math.max(0, currentTime - clipStart), endSec: Math.min(clipDuration, currentTime - clipStart + 3) });
    const overlay = applyPresetToOverlay(base, preset);
    updateEdits({ textOverlays: [...edits.textOverlays, overlay] }); setSelectedOverlayId(overlay.id); setExpandedId(overlay.id); setNewText("");
  }
  function updateOverlay(id: string, changes: Partial<TextOverlay>) { updateEdits({ textOverlays: edits.textOverlays.map((t) => t.id === id ? { ...t, ...changes } : t) }); }
  function removeOverlay(id: string) { updateEdits({ textOverlays: edits.textOverlays.filter((t) => t.id !== id) }); if (selectedOverlayId === id) setSelectedOverlayId(null); if (expandedId === id) setExpandedId(null); }

  // ── Text drag (Pointer API) ──────────────────────────────────────────────
  const handleTextPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault(); e.stopPropagation(); (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingTextId(id); setSelectedOverlayId(id);
    const overlay = edits.textOverlays.find((t) => t.id === id); if (!overlay) return;
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, textX: overlay.x, textY: overlay.y };
  }, [edits.textOverlays]);

  const handleTextPointerMove = useCallback((e: React.PointerEvent, id: string) => {
    if (draggingTextId !== id || !dragStartRef.current || !videoWrapRef.current) return;
    const rect = videoWrapRef.current.getBoundingClientRect();
    let newX = Math.min(1, Math.max(0, dragStartRef.current.textX + (e.clientX - dragStartRef.current.startX) / rect.width));
    let newY = Math.min(1, Math.max(0, dragStartRef.current.textY + (e.clientY - dragStartRef.current.startY) / rect.height));
    const snapX = Math.abs(newX - 0.5) < SNAP_THRESHOLD; const snapY = Math.abs(newY - 0.5) < SNAP_THRESHOLD;
    if (snapX) newX = 0.5; if (snapY) newY = 0.5;
    setSnapGuides({ x: snapX, y: snapY }); updateOverlay(id, { x: newX, y: newY });
  }, [draggingTextId]);

  const handleTextPointerUp = useCallback(() => { setDraggingTextId(null); setSnapGuides({ x: false, y: false }); dragStartRef.current = null; }, []);

  // ── Timeline drag (Pointer API) ───────────────────────────────────────────
  const handleTimelinePointerDown = useCallback((e: React.PointerEvent, id: string, edge: "left" | "right" | "move") => {
    e.preventDefault(); e.stopPropagation(); (e.target as Element).setPointerCapture(e.pointerId);
    const overlay = edits.textOverlays.find((t) => t.id === id); if (!overlay) return;
    setDraggingTimelineId(id); setDraggingTimelineEdge(edge); setSelectedOverlayId(id);
    timelineDragRef.current = { startX: e.clientX, origStart: overlay.startSec ?? 0, origEnd: overlay.endSec ?? clipDuration };
  }, [edits.textOverlays, clipDuration]);

  const handleTimelinePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingTimelineId || !draggingTimelineEdge || !timelineDragRef.current || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const dSec = (e.clientX - timelineDragRef.current.startX) / (rect.width / clipDuration);
    const { origStart, origEnd } = timelineDragRef.current;
    let newStart = origStart, newEnd = origEnd;
    if (draggingTimelineEdge === "left") newStart = Math.min(Math.max(0, origStart + dSec), origEnd - 0.5);
    else if (draggingTimelineEdge === "right") newEnd = Math.max(Math.min(clipDuration, origEnd + dSec), origStart + 0.5);
    else { const dur = origEnd - origStart; newStart = Math.min(Math.max(0, origStart + dSec), clipDuration - dur); newEnd = newStart + dur; }
    updateOverlay(draggingTimelineId, { startSec: newStart, endSec: newEnd });
  }, [draggingTimelineId, draggingTimelineEdge, clipDuration]);

  const handleTimelinePointerUp = useCallback(() => { setDraggingTimelineId(null); setDraggingTimelineEdge(null); }, []);

  function handleTimelineClick(e: React.MouseEvent) {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    if (videoRef.current) videoRef.current.currentTime = clipStart + ((e.clientX - rect.left) / rect.width) * clipDuration;
  }

  // ── Copy transcript ───────────────────────────────────────────────────────
  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); });
  }
  function copyAllTranscript() { copyText(edits.textOverlays.map((t) => t.text).join("\n"), "all"); }

  // ── Overlay controls ──────────────────────────────────────────────────────
  function renderOverlayControls(t: TextOverlay) {
    const s = t.startSec ?? 0; const en = t.endSec ?? clipDuration;
    const previewPx = Math.round(t.fontSize * fontPreviewScale);
    return (
      <div className="border-t border-white/10 p-3 space-y-4">
        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Text</label>
          <input type="text" value={t.text} onChange={(e) => updateOverlay(t.id, { text: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Font Family</label>
          <FontPicker value={t.fontFamily || "Montserrat"} onChange={(v) => updateOverlay(t.id, { fontFamily: v })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Size: {t.fontSize}{fontPreviewScale < 0.99 && <span className="text-white/20 ml-1">(~{previewPx}px)</span>}</label>
            <input type="range" min={12} max={120} value={t.fontSize} onChange={(e) => updateOverlay(t.id, { fontSize: +e.target.value })} className="w-full accent-white" />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Opacity: {Math.round((t.opacity ?? 1) * 100)}%</label>
            <input type="range" min={0} max={1} step={0.05} value={t.opacity ?? 1} onChange={(e) => updateOverlay(t.id, { opacity: +e.target.value })} className="w-full accent-white" />
          </div>
        </div>
        <ColorSwatch label="Text color" value={t.color} onChange={(v) => updateOverlay(t.id, { color: v })} />
        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Style</label>
          <div className="flex gap-1.5 flex-wrap">
            {[{ key: "bold", icon: <Bold size={11} />, label: "Bold", val: t.bold }, { key: "italic", icon: <Italic size={11} />, label: "Italic", val: t.italic }, { key: "uppercase", icon: <CaseSensitive size={11} />, label: "CAPS", val: t.uppercase }].map(({ key, icon, label, val }) => (
              <button key={key} onClick={() => updateOverlay(t.id, { [key]: !val })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all border ${val ? "bg-white/20 border-white/40 text-white" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"}`}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Alignment</label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((align) => {
              const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
              return (
                <button key={align} onClick={() => updateOverlay(t.id, { textAlign: align })}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all border ${(t.textAlign || "center") === align ? "bg-white/20 border-white/40 text-white" : "bg-white/5 border-white/10 text-white/40"}`}>
                  <Icon size={13} />
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Letter Spacing: {t.letterSpacing > 0 ? "+" : ""}{t.letterSpacing}px</label>
          <input type="range" min={-5} max={20} step={0.5} value={t.letterSpacing ?? 0} onChange={(e) => updateOverlay(t.id, { letterSpacing: +e.target.value })} className="w-full accent-white" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Outline: {t.outlineWidth}px</label>
          </div>
          <input type="range" min={0} max={8} step={0.5} value={t.outlineWidth ?? 0} onChange={(e) => updateOverlay(t.id, { outlineWidth: +e.target.value })} className="w-full accent-white" />
          {(t.outlineWidth ?? 0) > 0 && <ColorSwatch label="Outline" value={t.outlineColor || "#000000"} onChange={(v) => updateOverlay(t.id, { outlineColor: v })} />}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Drop Shadow</label>
            <button onClick={() => updateOverlay(t.id, { shadowEnabled: !t.shadowEnabled })} className={`p-1 rounded ${t.shadowEnabled ? "text-white" : "text-white/20 hover:text-white/40"}`}>{t.shadowEnabled ? <Eye size={12} /> : <EyeOff size={12} />}</button>
          </div>
          {t.shadowEnabled && (
            <div className="space-y-2 pl-1 border-l border-white/10">
              <ColorSwatch label="Shadow" value={t.shadowColor || "#000000"} onChange={(v) => updateOverlay(t.id, { shadowColor: v })} />
              <div className="grid grid-cols-3 gap-2">
                {[{ k: "shadowX", l: "X", v: t.shadowX ?? 2, min: -10, max: 10 }, { k: "shadowY", l: "Y", v: t.shadowY ?? 2, min: -10, max: 10 }, { k: "shadowBlur", l: "Blur", v: t.shadowBlur ?? 8, min: 0, max: 20 }].map(({ k, l, v, min, max }) => (
                  <div key={k}><div className="text-[9px] text-white/25 mb-1">{l}: {v}px</div><input type="range" min={min} max={max} value={v} onChange={(e) => updateOverlay(t.id, { [k]: +e.target.value })} className="w-full accent-white" /></div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Background Box</label>
            <button onClick={() => updateOverlay(t.id, { backgroundEnabled: !t.backgroundEnabled })} className={`p-1 rounded ${t.backgroundEnabled ? "text-white" : "text-white/20 hover:text-white/40"}`}>{t.backgroundEnabled ? <Eye size={12} /> : <EyeOff size={12} />}</button>
          </div>
          {t.backgroundEnabled && (
            <div className="space-y-2 pl-1 border-l border-white/10">
              <ColorSwatch label="BG color" value={t.backgroundColor || "#000000"} onChange={(v) => updateOverlay(t.id, { backgroundColor: v })} />
              <div className="grid grid-cols-2 gap-2">
                <div><div className="text-[9px] text-white/25 mb-1">Opacity: {Math.round((t.backgroundOpacity ?? 0.6) * 100)}%</div><input type="range" min={0} max={1} step={0.05} value={t.backgroundOpacity ?? 0.6} onChange={(e) => updateOverlay(t.id, { backgroundOpacity: +e.target.value })} className="w-full accent-white" /></div>
                <div><div className="text-[9px] text-white/25 mb-1">Padding: {t.backgroundPadding ?? 10}px</div><input type="range" min={2} max={32} value={t.backgroundPadding ?? 10} onChange={(e) => updateOverlay(t.id, { backgroundPadding: +e.target.value })} className="w-full accent-white" /></div>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Position</label>
            <button onClick={() => updateOverlay(t.id, { x: 0.5, y: 0.82 })} className="text-[9px] text-white/40 hover:text-white transition-colors flex items-center gap-1"><AlignCenter size={9} /> Reset</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-[9px] text-white/25 mb-1">X: {Math.round(t.x * 100)}%</div><input type="range" min={0} max={1} step={0.01} value={t.x} onChange={(e) => updateOverlay(t.id, { x: +e.target.value })} className="w-full accent-white" /></div>
            <div><div className="text-[9px] text-white/25 mb-1">Y: {Math.round(t.y * 100)}%</div><input type="range" min={0} max={1} step={0.01} value={t.y} onChange={(e) => updateOverlay(t.id, { y: +e.target.value })} className="w-full accent-white" /></div>
          </div>
          <p className="text-[9px] text-white/20">👆 Drag teks langsung di video · snap ke tengah</p>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] text-white/40 font-medium uppercase tracking-wider">Duration</label>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-[9px] text-white/25 mb-1">Start: {s.toFixed(1)}s</div><input type="range" min={0} max={clipDuration - 0.5} step={0.1} value={s} onChange={(e) => updateOverlay(t.id, { startSec: +e.target.value })} className="w-full accent-white" /></div>
            <div><div className="text-[9px] text-white/25 mb-1">End: {en.toFixed(1)}s</div><input type="range" min={0.5} max={clipDuration} step={0.1} value={en} onChange={(e) => updateOverlay(t.id, { endSec: +e.target.value })} className="w-full accent-white" /></div>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof Type }[] = [
    { id: "subtitle", label: "Sub", icon: Type }, { id: "trim", label: "Trim", icon: Clock },
    { id: "crop", label: "Crop", icon: Crop }, { id: "color", label: "Color", icon: Sliders },
    { id: "speed", label: "Speed", icon: Zap }, { id: "media", label: "Media", icon: ImageIcon },
    { id: "intro", label: "Intro", icon: Sparkles },
  ];

  function renderPanelContent() {
    return (
      <>
        {/* SUBTITLE */}
        {activeTab === "subtitle" && (
          <div className="flex flex-col h-full">
            <div className="flex border-b border-white/10 shrink-0">
              {(["presets", "add", "layers"] as const).map((tab) => (
                <button key={tab} onClick={() => setSubtitleSubTab(tab)}
                  className={`flex-1 py-3 text-[11px] font-semibold uppercase tracking-wider transition-colors ${subtitleSubTab === tab ? "text-white border-b-2 border-white" : "text-white/30 hover:text-white/60"}`}>
                  {tab === "presets" ? "Styles" : tab === "add" ? "+ Add" : `Layers (${edits.textOverlays.length})`}
                </button>
              ))}
            </div>
            {subtitleSubTab === "presets" && (
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="rounded-xl border border-white/20 bg-white/5 p-3 space-y-3">
                  <div className="flex items-center gap-2"><Wand2 size={13} className="text-white" /><span className="text-xs font-bold text-white">AI Auto Subtitle</span><span className="ml-auto text-[9px] text-white/40 font-mono">3 words/line</span></div>
                  <p className="text-[10px] text-white/40 leading-relaxed">AI mendengar ucapan di clip dan buat subtitle sync otomatis.</p>
                  {transcribeError && <p className="text-[10px] text-red-400 bg-red-500/10 rounded-lg px-2 py-1.5">{transcribeError}</p>}
                  {!hasCredits && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"><AlertCircle size={12} className="shrink-0" /><span>Kredit habis — tidak bisa generate subtitle.</span></div>}
                  <button onClick={handleAutoSubtitle} disabled={isTranscribing || !onAutoSubtitle || !hasCredits}
                    className="w-full py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg">
                    {isTranscribing ? <><Loader2 size={13} className="animate-spin" /> Transcribing…</> : !hasCredits ? <><AlertCircle size={13} /> Kredit Tidak Cukup</> : <><Sparkles size={13} /> Generate Auto Subtitles</>}
                  </button>
                  {autoCount > 0 && <div className="flex items-center justify-between text-[10px]"><span className="text-white/50 flex items-center gap-1"><Sparkles size={9} />{autoCount} subtitles</span><button onClick={clearAutoSubtitles} className="text-red-400/60 hover:text-red-400 flex items-center gap-1"><Trash2 size={10} /> Clear</button></div>}
                </div>
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-2">Style Presets</div>
                  <div className="grid grid-cols-2 gap-2">{SUBTITLE_PRESETS.map((preset) => <PresetCard key={preset.id} preset={preset} isActive={activePresetId === preset.id} onClick={() => applyPresetToAllAuto(preset.id)} />)}</div>
                </div>
              </div>
            )}
            {subtitleSubTab === "add" && (
              <div className="p-4 space-y-4">
                <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Add Manual Subtitle</div>
                <textarea value={newText} onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTextOverlay(); } }}
                  placeholder="Type subtitle text…" rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none" />
                <button onClick={addTextOverlay} className="w-full py-3 bg-white/20 border border-white/30 rounded-xl text-white text-sm font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2">
                  <Plus size={14} /> Add at {formatTime(Math.max(0, currentTime - clipStart))}
                </button>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="text-[9px] text-white/25 px-3 pt-2 pb-1 uppercase tracking-wider">Active Style</div>
                  <PresetCard preset={currentPreset} isActive onClick={() => setSubtitleSubTab("presets")} />
                </div>
              </div>
            )}
            {subtitleSubTab === "layers" && (
              <div className="p-4 space-y-2 overflow-y-auto flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">All Layers ({edits.textOverlays.length})</div>
                  <div className="flex items-center gap-2">
                    {edits.textOverlays.length > 0 && (
                      <button onClick={copyAllTranscript} className="flex items-center gap-1 text-[9px] text-white/40 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
                        {copiedId === "all" ? <ClipboardCheck size={11} className="text-green-400" /> : <Copy size={11} />}
                        {copiedId === "all" ? "Copied!" : "Copy All"}
                      </button>
                    )}
                    {edits.textOverlays.length > 0 && <button onClick={() => updateEdits({ textOverlays: [] })} className="text-[9px] text-red-400/50 hover:text-red-400">Clear all</button>}
                  </div>
                </div>
                {edits.textOverlays.length === 0 && <div className="py-10 text-center"><Type size={24} className="text-white/10 mx-auto mb-2" /><p className="text-xs text-white/20">No subtitles yet</p><button onClick={() => setSubtitleSubTab("presets")} className="mt-2 text-[10px] text-white/40 hover:text-white">Generate auto subtitles</button></div>}
                {edits.textOverlays.map((t) => {
                  const isSelected = selectedOverlayId === t.id; const isExpanded = expandedId === t.id;
                  const s = t.startSec ?? 0; const en = t.endSec ?? clipDuration;
                  return (
                    <div key={t.id} className={`rounded-xl border transition-all overflow-hidden ${isSelected ? "border-white/40 bg-white/8" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
                      <div className="flex items-center gap-2 px-3 py-3 cursor-pointer" onClick={() => { setSelectedOverlayId(t.id); setExpandedId(isExpanded ? null : t.id); }}>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {t.isAutoSubtitle ? <Sparkles size={10} className="text-purple-400 shrink-0" /> : <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />}
                          <span className="text-xs text-white/80 truncate" style={{ fontFamily: `'${t.fontFamily || "Montserrat"}', sans-serif` }}>{t.uppercase ? t.text.toUpperCase() : t.text}</span>
                        </div>
                        <span className="text-[9px] text-white/25 font-mono shrink-0">{s.toFixed(1)}–{en.toFixed(1)}s</span>
                        <button onClick={(ev) => { ev.stopPropagation(); copyText(t.text, t.id); }} className="p-1.5 rounded hover:bg-white/10 text-white/20 hover:text-white/60 shrink-0">
                          {copiedId === t.id ? <ClipboardCheck size={11} className="text-green-400" /> : <Copy size={11} />}
                        </button>
                        <button onClick={(ev) => { ev.stopPropagation(); removeOverlay(t.id); }} className="p-1.5 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 shrink-0"><Trash2 size={11} /></button>
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

        {/* TRIM */}
        {activeTab === "trim" && (
          <div className="p-4 space-y-5">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Trim Clip</div>
            <SliderField label="Trim Start" value={edits.trimStart} min={0} max={Math.max(0, Math.floor((moment.endTime - moment.startTime) * 0.8))} step={1} format={(v) => `+${v}s`} dark onChange={(v) => updateEdits({ trimStart: v })} />
            <SliderField label="Trim End" value={edits.trimEnd} min={-Math.max(0, Math.floor((moment.endTime - moment.startTime) * 0.8))} max={0} step={1} format={(v) => `${v}s`} dark onChange={(v) => updateEdits({ trimEnd: v })} />
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/50 space-y-1.5 border border-white/10">
              {[["New Start", formatTime(clipStart)], ["New End", formatTime(clipEnd)]].map(([l, v]) => <div key={l} className="flex justify-between"><span>{l}</span><span className="font-mono text-white">{v}</span></div>)}
              <div className="flex justify-between border-t border-white/10 pt-1.5"><span>Duration</span><span className="font-mono text-white">{Math.round(clipDuration)}s</span></div>
            </div>
          </div>
        )}

        {/* CROP */}
        {activeTab === "crop" && (
          <div className="p-4 space-y-4">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Aspect Ratio</div>
            <div className="space-y-1.5">
              {ASPECT_RATIOS.map((ar) => (
                <button key={ar.value} onClick={() => updateEdits({ aspectRatio: ar.value })}
                  className={`w-full px-3 py-3 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between ${edits.aspectRatio === ar.value ? "bg-white/20 border border-white/40 text-white" : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20"}`}>
                  <span>{ar.label}</span><span className="text-[10px] opacity-60">{ar.desc}</span>
                </button>
              ))}
            </div>
            {edits.aspectRatio !== "original" && (
              <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-white/5 border border-white/10">
                    {isAnalyzingMotion ? <Loader2 size={12} className="text-white animate-spin" /> : hasMotionTracking ? <Activity size={12} className="text-white" /> : edits.isStaticMotion ? <User size={12} className="text-blue-400" /> : <Scan size={12} className="text-white/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">AI Motion Tracking</p>
                    <p className="text-[9px] text-white/30 truncate">{isAnalyzingMotion ? "Menganalisis gerakan…" : edits.motionAnalyzed ? motionMessage || "Analisis selesai" : "Analisis otomatis saat crop dipilih"}</p>
                  </div>
                  {!isAnalyzingMotion && onAnalyzeMotion && <button onClick={runMotionAnalysis} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white shrink-0"><RefreshCw size={12} /></button>}
                </div>
                <div className="p-3 space-y-2">
                  {isAnalyzingMotion && <div className="flex items-center gap-2 py-2"><div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-white rounded-full animate-pulse" style={{ width: "60%" }} /></div><span className="text-[10px] text-white/30 font-mono shrink-0">scanning…</span></div>}
                  {!isAnalyzingMotion && edits.motionAnalyzed && <MotionStatusBadge edits={edits} />}
                  {!isAnalyzingMotion && motionError && <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]"><AlertCircle size={10} /><span className="truncate">{motionError}</span></div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COLOR */}
        {activeTab === "color" && (
          <div className="p-4 space-y-5">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Color Adjustments</div>
            {[{ label: "Brightness", key: "brightness", val: edits.brightness }, { label: "Contrast", key: "contrast", val: edits.contrast }, { label: "Saturation", key: "saturation", val: edits.saturation }].map(({ label, key, val }) => (
              <SliderField key={key} label={label} value={val} min={-1} max={1} step={0.05} format={(v) => v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`} onChange={(v) => updateEdits({ [key]: v } as any)} dark />
            ))}
            <button onClick={() => updateEdits({ brightness: 0, contrast: 0, saturation: 0 })} className="w-full py-2.5 rounded-xl text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center gap-2"><RefreshCw size={12} /> Reset Colors</button>
          </div>
        )}

        {/* SPEED */}
        {activeTab === "speed" && (
          <div className="p-4 space-y-4">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Playback Speed</div>
            <div className="grid grid-cols-3 gap-2">
              {SPEED_OPTIONS.map((s) => (
                <button key={s} onClick={() => updateEdits({ speed: s })}
                  className={`py-3 rounded-xl text-sm font-bold transition-colors border ${edits.speed === s ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40 hover:text-white"}`}>
                  {s}×
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30">{edits.speed < 1 ? "🎞 Slow motion" : edits.speed === 1 ? "○ Normal" : "⚡ Fast forward"}</p>
          </div>
        )}

        {/* MEDIA */}
        {activeTab === "media" && (
          <div className="p-4 space-y-4">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Insert Media Overlay</div>
            <label className="block cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addImageOverlay(f); e.target.value = ""; }} />
              <div className="flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-white/15 hover:border-white/40 hover:bg-white/5 transition-all text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center"><ImageIcon size={22} className="text-white/30" /></div>
                <p className="text-xs text-white/50 font-medium">Upload Image / Watermark</p>
                <p className="text-[10px] text-white/25">PNG · JPG · SVG · WebP · GIF</p>
              </div>
            </label>
            {(edits.imageOverlays ?? []).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Layers ({(edits.imageOverlays ?? []).length})</div>
                  <button onClick={() => updateEdits({ imageOverlays: [] })} className="text-[9px] text-red-400/50 hover:text-red-400">Clear all</button>
                </div>
                {(edits.imageOverlays ?? []).map((img) => {
                  const isSel = selectedImageId === img.id;
                  return (
                    <div key={img.id} className={`rounded-xl border transition-all overflow-hidden ${isSel ? "border-white/40 bg-white/8" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
                      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setSelectedImageId(isSel ? null : img.id)}>
                        <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-white/10 bg-black/30"><img src={img.src} alt={img.name} className="w-full h-full object-contain" /></div>
                        <span className="text-xs text-white/80 truncate flex-1">{img.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); removeImageOverlay(img.id); }} className="p-1.5 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 shrink-0"><Trash2 size={11} /></button>
                        <div className="text-white/20">{isSel ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</div>
                      </div>
                      {isSel && (
                        <div className="border-t border-white/10 p-3 space-y-3">
                          <div><div className="text-[9px] text-white/25 mb-1">Size: {Math.round(img.width * 100)}%</div><input type="range" min={0.02} max={1} step={0.01} value={img.width} onChange={(e) => updateImageOverlay(img.id, { width: +e.target.value })} className="w-full accent-white" /></div>
                          <div><div className="text-[9px] text-white/25 mb-1">Opacity: {Math.round(img.opacity * 100)}%</div><input type="range" min={0.05} max={1} step={0.05} value={img.opacity} onChange={(e) => updateImageOverlay(img.id, { opacity: +e.target.value })} className="w-full accent-white" /></div>
                          <p className="text-[9px] text-white/20">Drag gambar di video untuk pindah posisi</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* INTRO */}
        {activeTab === "intro" && (
          <div className="p-4 space-y-5">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Intro Copywriting</div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3"><p className="text-xs text-white/70 font-medium">✦ Teks headline di 4 detik pertama</p><p className="text-[11px] text-white/35 mt-1">Muncul langsung saat video mulai, fade-out halus di detik ke-3→4.</p></div>
            <div className="space-y-2">
              <label className="text-[11px] text-white/50 font-medium">Teks Headline</label>
              <textarea value={edits.introText ?? ""} onChange={(e) => updateEdits({ introText: e.target.value })} placeholder="Contoh: The moment everything changed." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/30 transition-colors" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/25">Singkat dan padat — maks ~8 kata</p>
                {(edits.introText ?? "").length > 0 && <button onClick={() => updateEdits({ introText: "" })} className="text-[10px] text-white/30 hover:text-white/60">Hapus</button>}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Quick Pick</div>
              <div className="grid grid-cols-1 gap-1.5">
                {["The moment everything changed.", "You need to see this.", "This changes everything.", "Nobody talks about this.", "Watch until the end.", "This is why it works."].map((phrase) => (
                  <button key={phrase} onClick={() => updateEdits({ introText: phrase })}
                    className={`text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${edits.introText === phrase ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/8 text-white/45 hover:text-white/80 hover:bg-white/10"}`}>
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
            {(edits.introText ?? "").trim().length > 0 && <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" /><p className="text-[11px] text-white/60">Intro aktif — akan dirender saat export</p></div>}
          </div>
        )}
      </>
    );
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:items-center md:justify-center md:bg-black/70 md:backdrop-blur-sm md:p-2">
      <div className="bg-[#111] w-full h-full md:max-w-[1300px] md:h-[95vh] md:rounded-2xl md:border md:border-white/10 overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-3 md:px-5 py-2.5 md:py-3 border-b border-white/10 shrink-0 bg-[#111]">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 md:hidden rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Type size={12} className="text-white" /></div>
            <div>
              <h2 className="text-xs md:text-sm font-bold text-white leading-tight truncate max-w-[140px] md:max-w-none">{moment.label}</h2>
              <p className="text-[9px] text-white/40 font-mono">{formatTime(clipStart)}–{formatTime(clipEnd)} · {Math.round(clipDuration)}s{hasMotionTracking && <span className="ml-2 text-white/40 inline-flex items-center gap-0.5"><Activity size={8} /> tracking</span>}</p>
            </div>
          </div>

          {/* Desktop tab bar */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? "bg-white text-black shadow" : "text-white/50 hover:text-white/80"}`}>
                <Icon size={11} /> {label}
                {id === "crop" && edits.aspectRatio !== "original" && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAnalyzingMotion ? "bg-yellow-400 animate-pulse" : hasMotionTracking ? "bg-white" : edits.motionAnalyzed ? "bg-blue-400" : "bg-white/20"}`} />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {credits !== undefined && (
              <div className={`md:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${credits === 0 ? "bg-red-500/20 text-red-400" : credits <= 3 ? "bg-orange-500/20 text-orange-400" : "bg-white/10 text-white/60"}`}>
                {credits} cr
              </div>
            )}
            <button onClick={() => onExport(moment, edits)} disabled={isExporting || !videoSrc}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/80 disabled:opacity-40 transition-all shadow-lg">
              {isExporting ? <><Loader2 size={13} className="animate-spin" /><span className="hidden sm:inline">Exporting…</span></> : <><Download size={13} />Export</>}
            </button>
            <button onClick={onClose} className="hidden md:flex p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0 flex-col md:flex-row">

          {/* Video area — always visible on mobile */}
          <div className={`flex flex-col bg-black ${mobileShowPanel ? "shrink-0" : "flex-1"} md:flex-1`}
            style={mobileShowPanel ? { height: "clamp(140px, 38vw, 260px)" } : undefined}>

            {/* Video viewport */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0">
              {videoSrc ? (
                <div ref={videoWrapRef} className="relative"
                  style={isCropped ? { aspectRatio: cssAspectRatio, maxHeight: "100%", maxWidth: "100%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" } : { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <video ref={videoRef} src={videoSrc}
                    className={isCropped ? "w-full h-full" : "max-h-full max-w-full"}
                    style={{ objectFit: isCropped ? "cover" : "contain", filter: `brightness(${1 + edits.brightness}) contrast(${1 + edits.contrast}) saturate(${1 + edits.saturation})`, userSelect: "none" }}
                    onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} playsInline />

                  {snapGuides.x && <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/80 pointer-events-none z-20" />}
                  {snapGuides.y && <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/80 pointer-events-none z-20" />}

                  {/* Image overlays */}
                  {(edits.imageOverlays ?? []).map((img) => {
                    const imgRelTime = currentTime - clipStart;
                    const isVisible = imgRelTime >= (img.startSec ?? 0) && imgRelTime <= (img.endSec ?? clipDuration);
                    const isSel = selectedImageId === img.id;
                    if (!isVisible && !isSel) return null;
                    return (
                      <div key={img.id}
                        className={`absolute select-none touch-none ${draggingImageId === img.id ? "cursor-grabbing" : "cursor-grab"} ${isSel ? "z-30" : "z-10"}`}
                        style={{ left: `${img.x * 100}%`, top: `${img.y * 100}%`, transform: "translate(-50%, -50%)", width: `${img.width * 100}%`, opacity: isVisible ? img.opacity : 0.3 }}
                        onPointerDown={(e) => handleImagePointerDown(e, img.id)}
                        onPointerMove={(e) => handleImagePointerMove(e, img.id)}
                        onPointerUp={handleImagePointerUp}
                        onClick={(e) => { e.stopPropagation(); setSelectedImageId(img.id); }}>
                        <img src={img.src} alt={img.name} className="w-full h-auto block pointer-events-none" draggable={false} />
                        {isSel && <div className="absolute -inset-1 border border-white/70 rounded pointer-events-none" style={{ borderStyle: "dashed" }} />}
                      </div>
                    );
                  })}

                  {/* Text overlays */}
                  {edits.textOverlays.map((t) => {
                    const isVisible = visibleOverlayIds.has(t.id); const isSel = selectedOverlayId === t.id;
                    if (!isVisible && !isSel) return null;
                    const scaledFontSize = t.fontSize * fontPreviewScale;
                    const scaledOutline = (t.outlineWidth ?? 0) * fontPreviewScale;
                    return (
                      <div key={t.id}
                        className={`absolute select-none touch-none ${draggingTextId === t.id ? "cursor-grabbing" : "cursor-grab"} ${isSel ? "z-30" : "z-10"}`}
                        style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, transform: "translate(-50%, -50%)", opacity: isVisible ? (t.opacity ?? 1) : 0 }}
                        onPointerDown={(e) => handleTextPointerDown(e, t.id)}
                        onPointerMove={(e) => handleTextPointerMove(e, t.id)}
                        onPointerUp={handleTextPointerUp}
                        onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(t.id); }}>
                        {t.backgroundEnabled && <div className="absolute rounded pointer-events-none" style={{ inset: `-${(t.backgroundPadding ?? 10) * fontPreviewScale}px`, backgroundColor: hexToRgba(t.backgroundColor || "#000000", t.backgroundOpacity ?? 0.6), zIndex: 0 }} />}
                        <div style={{ position: "relative", zIndex: 1, fontSize: `${scaledFontSize}px`, fontFamily: `'${t.fontFamily || "Montserrat"}', sans-serif`, color: t.color, fontWeight: t.bold ? "bold" : "normal", fontStyle: t.italic ? "italic" : "normal", textTransform: t.uppercase ? "uppercase" : "none", textAlign: t.textAlign || "center", letterSpacing: `${(t.letterSpacing ?? 0) * fontPreviewScale}px`, lineHeight: t.lineHeight || 1.2, WebkitTextStroke: scaledOutline > 0 ? `${scaledOutline}px ${t.outlineColor || "#000000"}` : undefined, paintOrder: scaledOutline > 0 ? "stroke fill" : undefined, textShadow: buildTextShadow(t, fontPreviewScale), whiteSpace: "nowrap" }}>
                          {t.uppercase ? t.text.toUpperCase() : t.text}
                        </div>
                        {isSel && <div className="absolute -inset-2 border border-white/70 rounded pointer-events-none" style={{ borderStyle: "dashed" }} />}
                      </div>
                    );
                  })}

                  {/* Watermark */}
                  {edits.watermarkType === "text" && edits.watermarkText?.trim() && (
                    <div className="absolute select-none pointer-events-none"
                      style={{ left: `${(edits.watermarkX ?? 0.88) * 100}%`, top: `${(edits.watermarkY ?? 0.06) * 100}%`, transform: "translate(-50%, -50%)", opacity: edits.watermarkOpacity ?? 0.85, fontSize: `${(edits.watermarkFontSize ?? 0.04) * previewWidth}px`, fontFamily: `'${edits.watermarkFontFamily ?? "Montserrat"}', sans-serif`, fontWeight: edits.watermarkBold ? 700 : 400, color: edits.watermarkTextColor ?? "#FFFFFF", WebkitTextStroke: `${Math.max(1, Math.round(fontPreviewScale * 2))}px rgba(0,0,0,${Math.min(edits.watermarkOpacity ?? 0.85, 0.7)})`, paintOrder: "stroke fill", textShadow: `${2 * fontPreviewScale}px ${2 * fontPreviewScale}px 0px rgba(0,0,0,0.47)`, whiteSpace: "nowrap", zIndex: 35 }}>
                      {edits.watermarkText}
                    </div>
                  )}

                  {/* Film frame */}
                  <div className="absolute inset-0 select-none pointer-events-none" style={{ zIndex: 36, borderRadius: isCropped ? "12px" : "6px", background: "transparent", boxShadow: ["inset 0 0 0 30px rgba(0,0,0,0.93)", "inset 0 0 0 38px rgba(0,0,0,0.52)", "inset 0 0 0 46px rgba(0,0,0,0.18)", "inset 0 0 10px 29px rgba(0,0,0,0.35)", "inset 0 0 3px 29px rgba(255,255,255,0.07)"].join(", ") }} />

                  {isCropped && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                      <div className="px-2 py-0.5 rounded-md bg-black/60 text-white/50 text-[10px] font-mono">{edits.aspectRatio}</div>
                      {isAnalyzingMotion && <div className="px-2 py-0.5 rounded-md bg-black/60 text-yellow-400 text-[10px] font-mono flex items-center gap-1"><Loader2 size={8} className="animate-spin" /> scanning</div>}
                      {!isAnalyzingMotion && hasMotionTracking && <div className="px-2 py-0.5 rounded-md bg-black/60 text-white/50 text-[10px] font-mono flex items-center gap-1"><Activity size={8} /> tracking</div>}
                    </div>
                  )}
                </div>
              ) : <div className="text-center text-white/30 p-8"><p className="text-sm">Video tidak tersedia.</p></div>}
            </div>

            {/* Playback controls */}
            <div className="shrink-0 px-3 md:px-4 py-2.5 md:py-3 bg-[#0a0a0a] border-t border-white/10">
              {/* Progress bar — tall hit target on mobile */}
              <div ref={progressBarRef} className="relative mb-2 select-none" style={{ height: "28px", touchAction: "none", cursor: isDraggingProgress ? "grabbing" : "pointer" }}
                onPointerDown={handleProgressPointerDown} onPointerMove={handleProgressPointerMove} onPointerUp={handleProgressPointerUp}>
                <div className="absolute inset-y-1/2 -translate-y-1/2 left-0 right-0 h-1.5 md:h-1 bg-white/10 rounded-full pointer-events-none">
                  <div className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="absolute w-5 h-5 rounded-full bg-white shadow-lg" style={{ left: `${progressPct}%`, transform: "translate(-50%, -50%)", top: "50%", pointerEvents: "none" }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <button onClick={() => seek(-5)} className="p-2.5 md:p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"><SkipBack size={16} /></button>
                  <button onClick={togglePlay} className="p-3 md:p-2.5 bg-white rounded-xl hover:bg-white/80 transition-colors text-black">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} fill="black" />}
                  </button>
                  <button onClick={() => seek(5)} className="p-2.5 md:p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"><SkipForward size={16} /></button>
                  <span className="text-[11px] font-mono text-white/40 ml-1">{formatTime(Math.max(0, currentTime - clipStart))} / {formatTime(clipDuration)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
                  {autoCount > 0 && <span className="flex items-center gap-1 text-white/40"><Sparkles size={9} />{autoCount}</span>}
                  {edits.speed !== 1 && <span>{edits.speed}×</span>}
                  {edits.aspectRatio !== "original" && <span>{edits.aspectRatio}</span>}
                </div>
              </div>
            </div>

            {/* Subtitle timeline — desktop only */}
            {activeTab === "subtitle" && (
              <div className="shrink-0 bg-[#0d0d0d] border-t border-white/10 flex-col hidden md:flex" style={{ minHeight: "120px", maxHeight: "220px" }}>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
                  <Type size={11} className="text-white/40" /><span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Subtitle Timeline</span>
                  {autoCount > 0 && <span className="flex items-center gap-1 text-[9px] text-white/30 ml-1"><Sparkles size={9} />{autoCount} auto · {manualCount} manual</span>}
                </div>
                <div className="px-4 pt-1 shrink-0">
                  <div className="relative h-5">
                    {Array.from({ length: Math.ceil(clipDuration) + 1 }).map((_, i) => (
                      <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${(i / clipDuration) * 100}%` }}>
                        <div className="w-px h-2 bg-white/20" /><span className="text-[8px] text-white/25 font-mono mt-0.5">{i}s</span>
                      </div>
                    ))}
                    <div className="absolute top-0 bottom-0 w-px bg-white z-10 pointer-events-none" style={{ left: `${progressPct}%` }}><div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" /></div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
                  <div ref={timelineRef} className="relative cursor-crosshair"
                    onClick={handleTimelineClick} onPointerMove={handleTimelinePointerMove} onPointerUp={handleTimelinePointerUp}
                    style={{ height: `${Math.max(1, edits.textOverlays.length) * 36 + 8}px`, touchAction: "none" }}>
                    {edits.textOverlays.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/20">Generate auto subtitles or add text — clips appear here</div>}
                    {edits.textOverlays.map((t, index) => {
                      const s = t.startSec ?? 0; const en = t.endSec ?? clipDuration; const isSel = selectedOverlayId === t.id;
                      return (
                        <div key={t.id} className="absolute" style={{ top: `${index * 36 + 4}px`, left: `${(s / clipDuration) * 100}%`, width: `${((en - s) / clipDuration) * 100}%`, height: "28px" }}>
                          <div className={`relative w-full h-full rounded-md flex items-center overflow-hidden border transition-all cursor-grab ${isSel ? "bg-white/30 border-white" : t.isAutoSubtitle ? "bg-purple-500/15 border-purple-500/40 hover:bg-purple-500/25" : "bg-white/15 border-white/40"}`}
                            onPointerDown={(e) => { e.stopPropagation(); handleTimelinePointerDown(e, t.id, "move"); }}
                            onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(t.id); setExpandedId(t.id); setSubtitleSubTab("layers"); }}>
                            <div className="flex-1 px-2 truncate flex items-center gap-1">
                              {t.isAutoSubtitle && <Sparkles size={8} className="text-purple-400 shrink-0" />}
                              <span className="text-[10px] text-white/80 font-medium truncate" style={{ fontFamily: `'${t.fontFamily || "Montserrat"}', sans-serif` }}>{t.uppercase ? t.text.toUpperCase() : t.text}</span>
                            </div>
                          </div>
                          <div className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center z-10" onPointerDown={(e) => { e.stopPropagation(); handleTimelinePointerDown(e, t.id, "left"); }}><div className="w-0.5 h-3/4 rounded-full bg-white/60 hover:bg-white" /></div>
                          <div className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center z-10" onPointerDown={(e) => { e.stopPropagation(); handleTimelinePointerDown(e, t.id, "right"); }}><div className="w-0.5 h-3/4 rounded-full bg-white/60 hover:bg-white" /></div>
                        </div>
                      );
                    })}
                    <div className="absolute top-0 bottom-0 w-px bg-white/60 pointer-events-none z-20" style={{ left: `${progressPct}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile bottom tab bar */}
            <div className="md:hidden shrink-0 flex bg-[#0a0a0a] border-t border-white/10 overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setActiveTab(id); setMobileShowPanel(true); }}
                  className={`flex flex-col items-center gap-1 flex-1 min-w-[50px] py-3 text-[10px] font-medium transition-colors relative ${activeTab === id && mobileShowPanel ? "text-white" : "text-white/35"}`}>
                  <Icon size={20} />
                  <span>{label}</span>
                  {activeTab === id && mobileShowPanel && <div className="absolute top-0 inset-x-0 h-0.5 bg-white rounded-full" />}
                  {id === "crop" && edits.aspectRatio !== "original" && <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isAnalyzingMotion ? "bg-yellow-400 animate-pulse" : hasMotionTracking ? "bg-white" : edits.motionAnalyzed ? "bg-blue-400" : "bg-white/20"}`} />}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="w-80 border-l border-white/10 flex-col overflow-hidden shrink-0 bg-[#0e0e0e] hidden md:flex">
            <div className="flex-1 overflow-y-auto">{renderPanelContent()}</div>
          </div>

          {/* Mobile: panel below video */}
          {mobileShowPanel && (
            <div className="md:hidden flex-1 flex flex-col bg-[#0e0e0e] border-t border-white/10 overflow-hidden min-h-0">
              <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-white/8">
                <div className="flex items-center gap-2">
                  {(() => { const tab = TABS.find(t => t.id === activeTab); const Icon = tab?.icon ?? Type; return <><Icon size={13} className="text-white/50" /><span className="text-xs font-semibold text-white/80 capitalize">{tab?.label}</span></>; })()}
                </div>
                <button onClick={() => setMobileShowPanel(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"><X size={15} /></button>
              </div>
              <div className="flex-1 overflow-y-auto">{renderPanelContent()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}