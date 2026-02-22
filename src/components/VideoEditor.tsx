// /Users/haimac/Project/clipper-ai-fe/src/components/VideoEditor.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Play, Pause, Type, Crop,
  Sliders, Download, Loader2, Plus, Trash2, Clock, 
  Layers
} from "lucide-react";
import { Rnd } from "react-rnd";
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

type Tab = "trim" | "crop" | "text" | "color" | "speed";

const ASPECT_RATIOS: { label: string; value: ClipEdits["aspectRatio"]; desc: string }[] = [
  { label: "Original",      value: "original", desc: "Keep source dimensions" },
  { label: "9:16 Vertical", value: "9:16",     desc: "TikTok / Reels / Shorts" },
  { label: "16:9 Wide",     value: "16:9",     desc: "YouTube / Landscape" },
  { label: "1:1 Square",    value: "1:1",      desc: "Instagram feed" },
  { label: "4:3 Classic",   value: "4:3",      desc: "Classic TV ratio" },
];

const PX_PER_SECOND = 40; 
const TIMELINE_LEFT_OFFSET = 160; // Lebar kolom label layer di kiri

export default function VideoEditor({
  moment, edits, videoSrc, onUpdateEdits, onExport, onClose, isExporting,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [newText, setNewText] = useState("");
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const clipStart = moment.startTime + edits.trimStart;
  const clipEnd = moment.endTime + edits.trimEnd;
  const clipDuration = Math.max(0.1, clipEnd - clipStart);

  // --- LOGIC: TOGGLE PLAY/PAUSE ---
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      if (v.currentTime >= clipEnd) v.currentTime = clipStart;
      v.play();
      setIsPlaying(true);
    }
  }, [isPlaying, clipStart, clipEnd]);

  // --- LOGIC: KEYBOARD SHORTCUT (SPACEBAR) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Jangan jalankan shortcut jika user sedang mengetik di input/textarea
      if (
        document.activeElement instanceof HTMLInputElement || 
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  // --- LOGIC: SYNC VIDEO TIME ---
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;
    
    v.currentTime = clipStart;
    setCurrentTime(0);

    const onTime = () => {
      if (isDraggingPlayhead) return; // Jangan update state jika sedang di-drag manual
      const relative = v.currentTime - clipStart;
      setCurrentTime(relative);
      
      if (v.currentTime >= clipEnd) {
        v.pause();
        v.currentTime = clipStart;
        setIsPlaying(false);
      }
    };

    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [videoSrc, clipStart, clipEnd, isDraggingPlayhead]);

  // --- LOGIC: SEEKING ---
  function seekRelative(time: number) {
    const v = videoRef.current;
    if (!v) return;
    const boundedTime = Math.min(Math.max(time, 0), clipDuration);
    const newTime = clipStart + boundedTime;
    v.currentTime = newTime;
    setCurrentTime(boundedTime);
  }

  // --- LOGIC: DRAGGABLE PLAYHEAD ---
  const handlePlayheadMove = useCallback((clientX: number) => {
    if (!timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const x = clientX - rect.left - TIMELINE_LEFT_OFFSET;
    seekRelative(x / PX_PER_SECOND);
  }, [clipDuration]);

  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const onMouseMove = (e: MouseEvent) => handlePlayheadMove(e.clientX);
    const onMouseUp = () => setIsDraggingPlayhead(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingPlayhead, handlePlayheadMove]);

  // --- LOGIC: EDITS ---
  function updateEdits(partial: Partial<ClipEdits>) {
    onUpdateEdits({ ...edits, ...partial });
  }

  function addTextOverlay() {
    if (!newText.trim()) return;
    const overlay: TextOverlay = {
      id: generateId(), 
      text: newText.trim(),
      x: 0.35, y: 0.5,
      fontSize: 32,
      color: "#FFFFFF", 
      startSec: 0, 
      endSec: clipDuration > 5 ? 5 : clipDuration, 
      bold: true,
    };
    updateEdits({ textOverlays: [...edits.textOverlays, overlay] });
    setNewText("");
  }

  function updateTextOverlay(id: string, changes: Partial<TextOverlay>) {
    updateEdits({
      textOverlays: edits.textOverlays.map((t) => t.id === id ? { ...t, ...changes } : t),
    });
  }

  function removeTextOverlay(id: string) {
    updateEdits({ textOverlays: edits.textOverlays.filter((t) => t.id !== id) });
  }

  const isCropped = edits.aspectRatio !== "original";
  const [arW, arH] = isCropped ? edits.aspectRatio.split(":").map(Number) : [16, 9];
  const cssAspectRatio = `${arW} / ${arH}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0c10] border border-white/10 rounded-[32px] w-full max-w-6xl h-[92vh] overflow-hidden flex flex-col shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="bg-violet-500/20 p-2 rounded-xl">
              <Layers size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">{moment.label}</h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                CLIP: {formatTime(clipStart)} - {formatTime(clipEnd)} ({Math.round(clipDuration)}s)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* MAIN AREA */}
          <div className="flex-1 flex flex-col bg-black/40 min-w-0">
            
            {/* 1. Preview Area */}
            <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
              <div
                ref={previewContainerRef}
                className="relative shadow-2xl overflow-hidden bg-black"
                style={
                  isCropped
                    ? { aspectRatio: cssAspectRatio, maxHeight: "100%", maxWidth: "100%" }
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
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {edits.textOverlays.map((t) => {
                  const isVisible = currentTime >= (t.startSec || 0) && currentTime <= (t.endSec || clipDuration);
                  if (!isVisible) return null;

                  return (
                    <Rnd
                      key={t.id}
                      bounds="parent"
                      enableResizing={false}
                      position={{ 
                        x: t.x * (previewContainerRef.current?.offsetWidth || 0), 
                        y: t.y * (previewContainerRef.current?.offsetHeight || 0) 
                      }}
                      onDragStop={(_, data) => {
                        const parent = previewContainerRef.current;
                        if (parent) {
                          updateTextOverlay(t.id, { 
                            x: data.x / parent.offsetWidth, 
                            y: data.y / parent.offsetHeight 
                          });
                        }
                      }}
                    >
                      <div
                        className="cursor-move select-none p-2 border-2 border-transparent hover:border-violet-500/50 hover:bg-violet-500/10 transition-all group"
                        style={{
                          fontSize: isCropped ? `${t.fontSize * 0.6}px` : `${t.fontSize}px`,
                          color: t.color,
                          fontWeight: t.bold ? "bold" : "normal",
                          textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.text}
                      </div>
                    </Rnd>
                  );
                })}
              </div>
            </div>

            {/* 2. Timeline Area */}
            <div className="h-72 bg-[#0a0a0e] border-t border-white/10 flex flex-col">
              {/* Timeline Ruler / Scrubber Area */}
              <div 
                className="h-10 border-b border-white/[0.05] bg-white/[0.01] relative cursor-ew-resize select-none"
                onMouseDown={(e) => {
                  setIsDraggingPlayhead(true);
                  handlePlayheadMove(e.clientX);
                }}
              >
                <div className="absolute inset-0 flex items-center px-4 gap-4 pointer-events-none">
                  <button className="p-1.5 bg-white/10 rounded-md text-white">
                    {isPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" />}
                  </button>
                  <div className="text-[10px] font-mono text-violet-400">
                    {formatTime(currentTime)} / {formatTime(clipDuration)}
                  </div>
                </div>
              </div>

              {/* Scrollable Tracks Area */}
              <div className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar scroll-smooth" ref={timelineTrackRef}>
                
                {/* Playhead (Garis Merah Dinamis) */}
                <div 
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                  style={{ 
                    left: `${TIMELINE_LEFT_OFFSET + (currentTime * PX_PER_SECOND)}px`,
                    height: '100%' // Memanjang penuh ke bawah area scroll
                  }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-lg" />
                </div>

                <div className="min-w-max min-h-full">
                  {edits.textOverlays.map((t, idx) => (
                    <div key={t.id} className="flex h-12 border-b border-white/[0.03] group relative">
                      {/* Label Layer (Kiri) */}
                      <div className="w-40 sticky left-0 bg-[#0a0a0e] z-40 border-r border-white/10 px-4 flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Type size={12} className="text-zinc-500 shrink-0" />
                          <span className="text-[10px] text-zinc-400 font-medium truncate">Teks {idx + 1}</span>
                        </div>
                        <button onClick={() => removeTextOverlay(t.id)} className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Track Area (Kanan) */}
                      <div 
                        className="relative h-full flex items-center bg-white/[0.01]" 
                        style={{ width: (clipDuration * PX_PER_SECOND) + 100 }}
                        onClick={(e) => {
                          if (e.target === e.currentTarget) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            seekRelative((e.clientX - rect.left) / PX_PER_SECOND);
                          }
                        }}
                      >
                        <Rnd
                          dragAxis="x"
                          bounds="parent"
                          enableResizing={{ left: true, right: true }}
                          position={{ x: (t.startSec || 0) * PX_PER_SECOND, y: 8 }}
                          size={{ width: ((t.endSec || clipDuration) - (t.startSec || 0)) * PX_PER_SECOND, height: 32 }}
                          onDragStop={(_, d) => {
                            const newStart = d.x / PX_PER_SECOND;
                            const dur = (t.endSec || clipDuration) - (t.startSec || 0);
                            updateTextOverlay(t.id, { startSec: newStart, endSec: newStart + dur });
                          }}
                          onResizeStop={(_, __, ref, ___, pos) => {
                            updateTextOverlay(t.id, { 
                              startSec: pos.x / PX_PER_SECOND, 
                              endSec: (pos.x + ref.offsetWidth) / PX_PER_SECOND 
                            });
                          }}
                          className="z-10"
                        >
                          <div className="w-full h-full bg-violet-500/30 border border-violet-400/50 rounded-md flex items-center px-3 cursor-move hover:bg-violet-500/40 transition-colors overflow-hidden">
                            <span className="text-[9px] text-white font-bold truncate select-none">{t.text}</span>
                          </div>
                        </Rnd>
                      </div>
                    </div>
                  ))}

                  {edits.textOverlays.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 opacity-20">
                      <Layers size={32} className="mb-2" />
                      <p className="text-xs">Tarik playhead atau klik panel Text untuk menambah caption</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-80 border-l border-white/10 flex flex-col bg-[#0c0c10] shrink-0">
            <div className="flex border-b border-white/[0.05]">
              {([
                { id: "text",  icon: Type,    label: "Text"  },
                { id: "trim",  icon: Clock,   label: "Trim"  },
                { id: "crop",  icon: Crop,    label: "Crop"  },
                { id: "color", icon: Sliders, label: "Color" },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === id ? "text-violet-400 bg-violet-400/5 shadow-[inset_0_-2px_0_0_#a78bfa]" : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              {activeTab === "text" && (
                <div className="space-y-5">
                  <div className="relative">
                    <input
                      value={newText} 
                      onChange={(e) => setNewText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTextOverlay()}
                      placeholder="Tambahkan caption baru..."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                    />
                    <button 
                      onClick={addTextOverlay}
                      className="absolute right-2 top-2 p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-colors shadow-lg"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Edit Layers</h3>
                    {edits.textOverlays.map((t) => (
                      <div key={t.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          {/* INPUT UNTUK EDIT TEXT */}
                          <input 
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-violet-500/50 w-full"
                            value={t.text}
                            onChange={(e) => updateTextOverlay(t.id, { text: e.target.value })}
                          />
                          <button onClick={() => removeTextOverlay(t.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-zinc-500">Font Size</label>
                            <input type="range" min={12} max={100} value={t.fontSize} onChange={(e) => updateTextOverlay(t.id, { fontSize: +e.target.value })} className="w-full accent-violet-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-zinc-500">Warna</label>
                            <input type="color" value={t.color} onChange={(e) => updateTextOverlay(t.id, { color: e.target.value })} className="w-full h-8 rounded-md bg-transparent border-none cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "trim" && (
                <div className="space-y-6">
                  <SliderField label="Trim Awal" value={edits.trimStart} min={0} max={Math.floor(clipDuration * 0.8)} step={0.5} format={(v) => `+${v}s`} onChange={(v) => updateEdits({ trimStart: v })} />
                  <SliderField label="Trim Akhir" value={edits.trimEnd} min={-Math.floor(clipDuration * 0.8)} max={0} step={0.5} format={(v) => `${v}s`} onChange={(v) => updateEdits({ trimEnd: v })} />
                </div>
              )}

              {activeTab === "crop" && (
                <div className="space-y-2">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.value}
                      onClick={() => updateEdits({ aspectRatio: ar.value })}
                      className={`w-full px-4 py-3.5 rounded-2xl text-[11px] font-bold text-left transition-all border ${
                        edits.aspectRatio === ar.value
                          ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                          : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "color" && (
                <div className="space-y-6">
                  <SliderField label="Brightness" value={edits.brightness} min={-0.5} max={0.5} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => updateEdits({ brightness: v })} />
                  <SliderField label="Contrast"   value={edits.contrast}   min={-0.5} max={0.5} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => updateEdits({ contrast: v })} />
                  <button onClick={() => updateEdits({ brightness: 0, contrast: 0, saturation: 0 })} className="w-full py-3 rounded-xl text-[10px] font-bold text-zinc-500 border border-white/5 hover:bg-white/5 transition-all">
                    RESET WARNA
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/10 bg-white/[0.01]">
              <button
                onClick={() => onExport(moment, edits)}
                disabled={isExporting || !videoSrc}
                className="w-full py-4 rounded-2xl font-black text-xs tracking-widest bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-900/20"
              >
                {isExporting ? <><Loader2 size={16} className="animate-spin" /> EXPORTING...</> : <><Download size={16} /> EXPORT CLIP</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{label}</label>
        <span className="text-xs font-mono text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded">{format(value)}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500" 
      />
    </div>
  );
}