// src/components/VideoEditor.tsx
// CapCut-style video editor with subtitle/text overlay timeline system
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Play, Pause, SkipBack, SkipForward, Type, Crop,
  Sliders, Zap, Download, Loader2, Plus, Trash2, Clock, RefreshCw,
  AlignCenter, Bold, ChevronDown, ChevronUp,
} from "lucide-react";
import type { ViralMoment } from "../lib/AI";
import { formatTime } from "../lib/AI";
import type { ClipEdits, TextOverlay } from "../lib/storage";
import { generateId } from "../lib/storage";

interface Props {
  moment: ViralMoment;
  edits: ClipEdits;
  videoSrc: string;
  onUpdateEdits: (edits: ClipEdits) => void;
  onExport: (moment: ViralMoment, edits: ClipEdits) => void;
  onClose: () => void;
  isExporting: boolean;
}

type Tab = "trim" | "crop" | "subtitle" | "color" | "speed";

const ASPECT_RATIOS: { label: string; value: ClipEdits["aspectRatio"]; desc: string }[] = [
  { label: "Original",      value: "original", desc: "Keep source dimensions" },
  { label: "9:16 Vertical", value: "9:16",     desc: "TikTok / Reels / Shorts" },
  { label: "16:9 Wide",     value: "16:9",     desc: "YouTube / Landscape" },
  { label: "1:1 Square",    value: "1:1",      desc: "Instagram feed" },
  { label: "4:3 Classic",   value: "4:3",      desc: "Classic TV ratio" },
];

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Snap threshold for center alignment (normalized 0-1)
const SNAP_THRESHOLD = 0.03;

export default function VideoEditor({
  moment, edits, videoSrc, onUpdateEdits, onExport, onClose, isExporting,
}: Props) {
  const videoRef       = useRef<HTMLVideoElement>(null);
  const videoWrapRef   = useRef<HTMLDivElement>(null);
  const timelineRef    = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying]       = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [activeTab, setActiveTab]       = useState<Tab>("subtitle");
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [newText, setNewText]           = useState("");
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  // Drag state for text position on video
  const [draggingTextId, setDraggingTextId]   = useState<string | null>(null);
  const [snapGuides, setSnapGuides]           = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; textX: number; textY: number } | null>(null);

  // Timeline drag state
  const [draggingTimelineId, setDraggingTimelineId]     = useState<string | null>(null);
  const [draggingTimelineEdge, setDraggingTimelineEdge] = useState<"left" | "right" | "move" | null>(null);
  const timelineDragRef = useRef<{ startX: number; origStart: number; origEnd: number } | null>(null);

  const clipStart    = moment.startTime + edits.trimStart;
  const clipEnd      = moment.endTime   + edits.trimEnd;
  const clipDuration = clipEnd - clipStart;

  // ── Video time sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;
    v.currentTime = clipStart;
    setCurrentTime(clipStart);

    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (v.currentTime >= clipEnd) {
        v.pause(); v.currentTime = clipStart; setIsPlaying(false);
      }
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

  function updateEdits(partial: Partial<ClipEdits>) {
    onUpdateEdits({ ...edits, ...partial });
  }

  // ── Text overlay CRUD ────────────────────────────────────────────────────
  function addTextOverlay() {
    if (!newText.trim()) return;
    const relCurrentTime = currentTime - clipStart;
    const overlay: TextOverlay = {
      id: generateId(),
      text: newText.trim(),
      x: 0.5, y: 0.85,
      fontSize: 36,
      color: "#FFFFFF",
      startSec: Math.max(0, relCurrentTime),
      endSec: Math.min(clipDuration, relCurrentTime + 3),
      bold: true,
    };
    const updated = [...edits.textOverlays, overlay];
    updateEdits({ textOverlays: updated });
    setSelectedOverlayId(overlay.id);
    setExpandedId(overlay.id);
    setNewText("");
  }

  function updateOverlay(id: string, changes: Partial<TextOverlay>) {
    updateEdits({
      textOverlays: edits.textOverlays.map((t) => t.id === id ? { ...t, ...changes } : t),
    });
  }

  function removeOverlay(id: string) {
    updateEdits({ textOverlays: edits.textOverlays.filter((t) => t.id !== id) });
    if (selectedOverlayId === id) setSelectedOverlayId(null);
    if (expandedId === id) setExpandedId(null);
  }

  // ── Drag text on video ───────────────────────────────────────────────────
  const handleTextMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingTextId(id);
    setSelectedOverlayId(id);
    const overlay = edits.textOverlays.find((t) => t.id === id);
    if (!overlay) return;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      textX: overlay.x,
      textY: overlay.y,
    };
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

    const onMouseUp = () => {
      setDraggingTextId(null);
      setSnapGuides({ x: false, y: false });
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggingTextId]);

  // ── Timeline drag ────────────────────────────────────────────────────────
  const handleTimelineMouseDown = useCallback((
    e: React.MouseEvent,
    id: string,
    edge: "left" | "right" | "move"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const overlay = edits.textOverlays.find((t) => t.id === id);
    if (!overlay) return;
    setDraggingTimelineId(id);
    setDraggingTimelineEdge(edge);
    setSelectedOverlayId(id);
    timelineDragRef.current = {
      startX: e.clientX,
      origStart: overlay.startSec ?? 0,
      origEnd: overlay.endSec ?? clipDuration,
    };
  }, [edits.textOverlays, clipDuration]);

  useEffect(() => {
    if (!draggingTimelineId || !draggingTimelineEdge) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!timelineDragRef.current || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const pxPerSec = rect.width / clipDuration;
      const dSec = (e.clientX - timelineDragRef.current.startX) / pxPerSec;
      const { origStart, origEnd } = timelineDragRef.current;

      let newStart = origStart;
      let newEnd = origEnd;

      if (draggingTimelineEdge === "left") {
        newStart = Math.min(Math.max(0, origStart + dSec), origEnd - 0.5);
      } else if (draggingTimelineEdge === "right") {
        newEnd = Math.max(Math.min(clipDuration, origEnd + dSec), origStart + 0.5);
      } else {
        const dur = origEnd - origStart;
        newStart = Math.min(Math.max(0, origStart + dSec), clipDuration - dur);
        newEnd = newStart + dur;
      }

      updateOverlay(draggingTimelineId, { startSec: newStart, endSec: newEnd });
    };

    const onMouseUp = () => {
      setDraggingTimelineId(null);
      setDraggingTimelineEdge(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggingTimelineId, draggingTimelineEdge, clipDuration]);

  // ── Timeline click to seek ────────────────────────────────────────────────
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

  // Which overlays are visible at current time
  const relTime = currentTime - clipStart;
  const visibleOverlayIds = new Set(
    edits.textOverlays
      .filter((t) => {
        const s = t.startSec ?? 0;
        const e = t.endSec ?? clipDuration;
        return relTime >= s && relTime <= e;
      })
      .map((t) => t.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-[1300px] h-[95vh] overflow-hidden flex flex-col shadow-2xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1ABC71] flex items-center justify-center">
              <Type size={13} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">{moment.label}</h2>
              <p className="text-[10px] text-white/40 font-mono">
                {formatTime(clipStart)} → {formatTime(clipEnd)} · {Math.round(clipDuration)}s
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {([
              { id: "subtitle", label: "Subtitle", icon: Type },
              { id: "trim",     label: "Trim",     icon: Clock },
              { id: "crop",     label: "Crop",     icon: Crop },
              { id: "color",    label: "Color",    icon: Sliders },
              { id: "speed",    label: "Speed",    icon: Zap },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === id
                    ? "bg-[#1ABC71] text-white shadow"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport(moment, edits)}
              disabled={isExporting || !videoSrc}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1ABC71] text-white text-xs font-bold hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isExporting
                ? <><Loader2 size={13} className="animate-spin" /> Exporting...</>
                : <><Download size={13} /> Export</>}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── Video area ────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 bg-black">

            {/* Video canvas */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {videoSrc ? (
                <div
                  ref={videoWrapRef}
                  className="relative"
                  style={isCropped
                    ? { aspectRatio: cssAspectRatio, maxHeight: "100%", maxWidth: "100%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" }
                    : { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }
                  }
                >
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    className={isCropped ? "w-full h-full" : "max-h-full max-w-full"}
                    style={{
                      objectFit: isCropped ? "cover" : "contain",
                      filter: `brightness(${1 + edits.brightness}) contrast(${1 + edits.contrast}) saturate(${1 + edits.saturation})`,
                      userSelect: "none",
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Snap guides */}
                  {snapGuides.x && (
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[#1ABC71]/80 pointer-events-none z-20">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#1ABC71] bg-transparent" />
                    </div>
                  )}
                  {snapGuides.y && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#1ABC71]/80 pointer-events-none z-20">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#1ABC71] bg-transparent" />
                    </div>
                  )}

                  {/* Text overlays on video */}
                  {edits.textOverlays.map((t) => {
                    const isVisible = visibleOverlayIds.has(t.id);
                    const isSelected = selectedOverlayId === t.id;
                    if (!isVisible && !isSelected) return null;
                    return (
                      <div
                        key={t.id}
                        className={`absolute select-none ${draggingTextId === t.id ? "cursor-grabbing" : "cursor-grab"} ${isSelected ? "z-30" : "z-10"}`}
                        style={{
                          left: `${t.x * 100}%`,
                          top: `${t.y * 100}%`,
                          transform: "translate(-50%, -50%)",
                          opacity: isVisible ? 1 : 0,
                        }}
                        onMouseDown={(e) => handleTextMouseDown(e, t.id)}
                        onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(t.id); }}
                      >
                        <div
                          style={{
                            fontSize: `${t.fontSize}px`,
                            color: t.color,
                            fontWeight: t.bold ? "bold" : "normal",
                            textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)",
                            whiteSpace: "nowrap",
                            fontFamily: "'Syne', sans-serif",
                            lineHeight: 1.2,
                          }}
                        >
                          {t.text}
                        </div>
                        {isSelected && (
                          <div className="absolute -inset-2 border border-[#1ABC71]/70 rounded pointer-events-none" style={{ borderStyle: "dashed" }}>
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1ABC71] text-white text-[9px] px-2 py-0.5 rounded font-mono whitespace-nowrap">
                              x:{Math.round(t.x * 100)}% y:{Math.round(t.y * 100)}%
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isCropped && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[#1ABC71] text-[10px] font-mono border border-[#1ABC71]/30 pointer-events-none">
                      {edits.aspectRatio}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-white/30 p-8">
                  <p className="text-sm">Video tidak tersedia.</p>
                </div>
              )}
            </div>

            {/* ── Playback controls ──────────────────────────────────── */}
            <div className="shrink-0 px-4 py-3 bg-[#0a0a0a] border-t border-white/10">
              {/* Progress bar / timeline scrubber */}
              <div
                className="h-1 bg-white/10 rounded-full mb-3 cursor-pointer relative group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct  = (e.clientX - rect.left) / rect.width;
                  const t    = clipStart + pct * clipDuration;
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-[#1ABC71] rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#1ABC71] border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progressPct}%`, transform: "translate(-50%,-50%)" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => seek(-5)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                    <SkipBack size={14} />
                  </button>
                  <button onClick={togglePlay} className="p-2.5 bg-[#1ABC71] rounded-xl hover:bg-[#16a085] transition-colors text-white">
                    {isPlaying ? <Pause size={16} /> : <Play size={16} fill="white" />}
                  </button>
                  <button onClick={() => seek(5)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                    <SkipForward size={14} />
                  </button>
                  <span className="text-[11px] font-mono text-white/40 ml-1">
                    {formatTime(Math.max(0, currentTime - clipStart))} / {formatTime(clipDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
                  <span>{edits.speed !== 1 && `${edits.speed}×`}</span>
                  <span>{edits.aspectRatio !== "original" && edits.aspectRatio}</span>
                </div>
              </div>
            </div>

            {/* ── Subtitle Timeline ──────────────────────────────────── */}
            {activeTab === "subtitle" && (
              <div className="shrink-0 bg-[#0d0d0d] border-t border-white/10" style={{ minHeight: "120px" }}>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                  <Type size={11} className="text-[#1ABC71]" />
                  <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Subtitle Timeline</span>
                  <span className="text-[10px] text-white/20">· drag to reposition, resize handles to trim</span>
                </div>

                {/* Timeline ruler */}
                <div className="px-4 pb-2">
                  {/* Time ruler */}
                  <div className="relative h-5 mb-1">
                    {Array.from({ length: Math.ceil(clipDuration) + 1 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 flex flex-col items-center"
                        style={{ left: `${(i / clipDuration) * 100}%` }}
                      >
                        <div className="w-px h-2 bg-white/20" />
                        <span className="text-[8px] text-white/25 font-mono mt-0.5">{i}s</span>
                      </div>
                    ))}
                    {/* Playhead */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-[#1ABC71] z-10 pointer-events-none"
                      style={{ left: `${progressPct}%` }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#1ABC71]" />
                    </div>
                  </div>

                  {/* Timeline track area */}
                  <div
                    ref={timelineRef}
                    className="relative cursor-crosshair"
                    onClick={handleTimelineClick}
                    style={{ minHeight: `${Math.max(1, edits.textOverlays.length) * 36 + 8}px` }}
                  >
                    {edits.textOverlays.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/20">
                        Add subtitle text above → it will appear here as a draggable clip
                      </div>
                    )}

                    {edits.textOverlays.map((t, index) => {
                      const s = t.startSec ?? 0;
                      const e = t.endSec ?? clipDuration;
                      const leftPct = (s / clipDuration) * 100;
                      const widthPct = ((e - s) / clipDuration) * 100;
                      const isSelected = selectedOverlayId === t.id;
                      const row = index;

                      return (
                        <div
                          key={t.id}
                          className="absolute"
                          style={{
                            top: `${row * 36 + 4}px`,
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            height: "28px",
                          }}
                        >
                          {/* Main bar */}
                          <div
                            className={`relative w-full h-full rounded-md flex items-center overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${
                              isSelected
                                ? "bg-[#1ABC71]/30 border-[#1ABC71] shadow-[0_0_8px_rgba(26,188,113,0.4)]"
                                : "bg-[#1ABC71]/15 border-[#1ABC71]/40 hover:bg-[#1ABC71]/25"
                            }`}
                            onMouseDown={(e) => { e.stopPropagation(); handleTimelineMouseDown(e, t.id, "move"); }}
                            onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(t.id); setExpandedId(t.id); }}
                          >
                            <div className="flex-1 px-2 truncate">
                              <span className="text-[10px] text-[#1ABC71] font-medium">{t.text}</span>
                            </div>
                          </div>

                          {/* Left resize handle */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize flex items-center justify-center z-10"
                            onMouseDown={(e) => { e.stopPropagation(); handleTimelineMouseDown(e, t.id, "left"); }}
                          >
                            <div className="w-0.5 h-3/4 rounded-full bg-[#1ABC71]/60 hover:bg-[#1ABC71]" />
                          </div>

                          {/* Right resize handle */}
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize flex items-center justify-center z-10"
                            onMouseDown={(e) => { e.stopPropagation(); handleTimelineMouseDown(e, t.id, "right"); }}
                          >
                            <div className="w-0.5 h-3/4 rounded-full bg-[#1ABC71]/60 hover:bg-[#1ABC71]" />
                          </div>
                        </div>
                      );
                    })}

                    {/* Playhead overlay on timeline */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-[#1ABC71]/60 pointer-events-none z-20"
                      style={{ left: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel ───────────────────────────────────────────── */}
          <div className="w-72 border-l border-white/10 flex flex-col overflow-hidden shrink-0 bg-[#0e0e0e]">
            <div className="flex-1 overflow-y-auto">

              {/* ── SUBTITLE TAB ─────────────────────────────────────── */}
              {activeTab === "subtitle" && (
                <div className="p-4 space-y-4">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Add Subtitle</div>

                  {/* Add text input */}
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTextOverlay(); } }}
                      placeholder="Type subtitle text..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#1ABC71]/50 resize-none"
                    />
                    <button
                      onClick={addTextOverlay}
                      className="w-full py-2 bg-[#1ABC71]/20 border border-[#1ABC71]/30 rounded-xl text-[#1ABC71] text-xs font-medium hover:bg-[#1ABC71]/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={13} />
                      Add Subtitle at {formatTime(Math.max(0, currentTime - clipStart))}
                    </button>
                  </div>

                  {/* Overlay list */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                      Layers ({edits.textOverlays.length})
                    </div>

                    {edits.textOverlays.length === 0 && (
                      <div className="py-8 text-center">
                        <Type size={24} className="text-white/10 mx-auto mb-2" />
                        <p className="text-xs text-white/20">No subtitles yet</p>
                        <p className="text-[10px] text-white/10 mt-1">Add text above to get started</p>
                      </div>
                    )}

                    {edits.textOverlays.map((t) => {
                      const isSelected = selectedOverlayId === t.id;
                      const isExpanded = expandedId === t.id;
                      const s = t.startSec ?? 0;
                      const e = t.endSec ?? clipDuration;

                      return (
                        <div
                          key={t.id}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isSelected
                              ? "border-[#1ABC71]/50 bg-[#1ABC71]/10"
                              : "border-white/10 bg-white/3 hover:border-white/20"
                          }`}
                        >
                          {/* Layer header */}
                          <div
                            className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                            onClick={() => {
                              setSelectedOverlayId(t.id);
                              setExpandedId(isExpanded ? null : t.id);
                            }}
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: t.color }}
                              />
                              <span className="text-xs text-white/80 truncate">{t.text}</span>
                            </div>
                            <span className="text-[9px] text-white/25 font-mono shrink-0">
                              {s.toFixed(1)}s–{e.toFixed(1)}s
                            </span>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); removeOverlay(t.id); }}
                              className="p-1 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors shrink-0"
                            >
                              <Trash2 size={11} />
                            </button>
                            <div className="text-white/20">
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </div>
                          </div>

                          {/* Expanded controls */}
                          {isExpanded && (
                            <div className="border-t border-white/10 p-3 space-y-3">

                              {/* Text edit */}
                              <div>
                                <label className="block text-[10px] text-white/40 mb-1.5">Text Content</label>
                                <input
                                  type="text"
                                  value={t.text}
                                  onChange={(e) => updateOverlay(t.id, { text: e.target.value })}
                                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1ABC71]/50"
                                />
                              </div>

                              {/* Font size + color */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-white/40 mb-1.5">Size: {t.fontSize}px</label>
                                  <input
                                    type="range" min={14} max={80} value={t.fontSize}
                                    onChange={(e) => updateOverlay(t.id, { fontSize: +e.target.value })}
                                    className="w-full accent-[#1ABC71]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-white/40 mb-1.5">Color</label>
                                  <input
                                    type="color" value={t.color}
                                    onChange={(e) => updateOverlay(t.id, { color: e.target.value })}
                                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border border-white/10"
                                  />
                                </div>
                              </div>

                              {/* Bold */}
                              <button
                                onClick={() => updateOverlay(t.id, { bold: !t.bold })}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors border w-full ${
                                  t.bold
                                    ? "bg-[#1ABC71]/20 border-[#1ABC71]/40 text-[#1ABC71]"
                                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                                }`}
                              >
                                <Bold size={11} />
                                Bold
                              </button>

                              {/* Position (X/Y) */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-[10px] text-white/40">Position</label>
                                  <button
                                    onClick={() => updateOverlay(t.id, { x: 0.5, y: 0.5 })}
                                    className="text-[9px] text-[#1ABC71]/60 hover:text-[#1ABC71] transition-colors flex items-center gap-1"
                                  >
                                    <AlignCenter size={9} /> Center
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-[9px] text-white/25 mb-1">X: {Math.round(t.x * 100)}%</div>
                                    <input
                                      type="range" min={0} max={1} step={0.01} value={t.x}
                                      onChange={(e) => updateOverlay(t.id, { x: +e.target.value })}
                                      className="w-full accent-[#1ABC71]"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[9px] text-white/25 mb-1">Y: {Math.round(t.y * 100)}%</div>
                                    <input
                                      type="range" min={0} max={1} step={0.01} value={t.y}
                                      onChange={(e) => updateOverlay(t.id, { y: +e.target.value })}
                                      className="w-full accent-[#1ABC71]"
                                    />
                                  </div>
                                </div>
                                <p className="text-[9px] text-white/20 mt-1">💡 Drag text directly on video · snaps to center</p>
                              </div>

                              {/* Time range */}
                              <div>
                                <label className="block text-[10px] text-white/40 mb-1.5">Duration on screen</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-[9px] text-white/25 mb-1">Start: {(t.startSec ?? 0).toFixed(1)}s</div>
                                    <input
                                      type="range" min={0} max={clipDuration - 0.5} step={0.1}
                                      value={t.startSec ?? 0}
                                      onChange={(e) => updateOverlay(t.id, { startSec: +e.target.value })}
                                      className="w-full accent-[#1ABC71]"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[9px] text-white/25 mb-1">End: {(t.endSec ?? clipDuration).toFixed(1)}s</div>
                                    <input
                                      type="range" min={0.5} max={clipDuration} step={0.1}
                                      value={t.endSec ?? clipDuration}
                                      onChange={(e) => updateOverlay(t.id, { endSec: +e.target.value })}
                                      className="w-full accent-[#1ABC71]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── TRIM TAB ─────────────────────────────────────────── */}
              {activeTab === "trim" && (
                <div className="p-4 space-y-5">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Trim Clip</div>
                  <SliderField
                    label="Trim Start" value={edits.trimStart}
                    min={0} max={Math.max(0, Math.floor((moment.endTime - moment.startTime) * 0.8))}
                    step={1} format={(v) => `+${v}s`}
                    onChange={(v) => updateEdits({ trimStart: v })}
                  />
                  <SliderField
                    label="Trim End" value={edits.trimEnd}
                    min={-Math.max(0, Math.floor((moment.endTime - moment.startTime) * 0.8))} max={0}
                    step={1} format={(v) => `${v}s`}
                    onChange={(v) => updateEdits({ trimEnd: v })}
                  />
                  <div className="bg-white/5 rounded-xl p-3 text-xs text-white/50 space-y-1.5 border border-white/10">
                    <div className="flex justify-between"><span>New Start</span><span className="font-mono text-white">{formatTime(clipStart)}</span></div>
                    <div className="flex justify-between"><span>New End</span><span className="font-mono text-white">{formatTime(clipEnd)}</span></div>
                    <div className="flex justify-between border-t border-white/10 pt-1.5"><span>Duration</span><span className="font-mono text-[#1ABC71]">{Math.round(clipDuration)}s</span></div>
                  </div>
                </div>
              )}

              {/* ── CROP TAB ─────────────────────────────────────────── */}
              {activeTab === "crop" && (
                <div className="p-4 space-y-4">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Aspect Ratio</div>
                  <div className="space-y-1.5">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar.value}
                        onClick={() => updateEdits({ aspectRatio: ar.value })}
                        className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between ${
                          edits.aspectRatio === ar.value
                            ? "bg-[#1ABC71]/20 border border-[#1ABC71]/40 text-[#1ABC71]"
                            : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <span>{ar.label}</span>
                        <span className={`text-[10px] ${edits.aspectRatio === ar.value ? "text-[#1ABC71]/60" : "text-white/25"}`}>{ar.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── COLOR TAB ────────────────────────────────────────── */}
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
                  <button
                    onClick={() => updateEdits({ brightness: 0, contrast: 0, saturation: 0 })}
                    className="w-full py-2 rounded-xl text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={12} /> Reset Colors
                  </button>
                </div>
              )}

              {/* ── SPEED TAB ────────────────────────────────────────── */}
              {activeTab === "speed" && (
                <div className="p-4 space-y-4">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Playback Speed</div>
                  <div className="grid grid-cols-3 gap-2">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s} onClick={() => updateEdits({ speed: s })}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-colors border ${
                          edits.speed === s
                            ? "bg-[#1ABC71]/30 border-[#1ABC71]/50 text-[#1ABC71]"
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                        }`}
                      >{s}×</button>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed">
                    {edits.speed < 1 && "🐢 Slow motion effect"}
                    {edits.speed === 1 && "▶ Normal speed"}
                    {edits.speed > 1 && "⚡ Timelapse / fast-forward"}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
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
        <span className="text-xs font-mono text-[#1ABC71]">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#1ABC71]"
      />
    </div>
  );
}