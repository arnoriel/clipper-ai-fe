// /Users/haimac/Project/clipper-ai-fe/src/components/VideoEditor.tsx
// src/components/VideoEditor.tsx
// No changes needed — already works generically with moment/edits data
// (same file as before, just ensuring it's in the output)
import { useState, useRef, useEffect } from "react";
import {
  X, Play, Pause, SkipBack, SkipForward, Type, Crop,
  Sliders, Zap, Download, Loader2, Plus, Trash2, Clock, RefreshCw,
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

type Tab = "trim" | "crop" | "text" | "color" | "speed";

const ASPECT_RATIOS: { label: string; value: ClipEdits["aspectRatio"]; desc: string }[] = [
  { label: "Original",      value: "original", desc: "Keep source dimensions" },
  { label: "9:16 Vertical", value: "9:16",     desc: "TikTok / Reels / Shorts" },
  { label: "16:9 Wide",     value: "16:9",     desc: "YouTube / Landscape" },
  { label: "1:1 Square",    value: "1:1",      desc: "Instagram feed" },
  { label: "4:3 Classic",   value: "4:3",      desc: "Classic TV ratio" },
];

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function VideoEditor({
  moment, edits, videoSrc, onUpdateEdits, onExport, onClose, isExporting,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab]     = useState<Tab>("trim");
  const [newText, setNewText]         = useState("");

  const clipStart    = moment.startTime + edits.trimStart;
  const clipEnd      = moment.endTime   + edits.trimEnd;
  const clipDuration = clipEnd - clipStart;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;
    v.currentTime = clipStart;
    setCurrentTime(clipStart);

    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (v.currentTime >= clipEnd) {
        v.pause();
        v.currentTime = clipStart;
        setIsPlaying(false);
      }
    };

    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [videoSrc, clipStart, clipEnd]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause(); setIsPlaying(false);
    } else {
      if (v.currentTime >= clipEnd) v.currentTime = clipStart;
      v.play(); setIsPlaying(true);
    }
  }

  function seek(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + delta, clipStart), clipEnd);
  }

  function updateEdits(partial: Partial<ClipEdits>) {
    onUpdateEdits({ ...edits, ...partial });
  }

  function addTextOverlay() {
    if (!newText.trim()) return;
    const overlay: TextOverlay = {
      id: generateId(), text: newText.trim(),
      x: 0.5, y: 0.85, fontSize: 36,
      color: "#000000", startSec: null, endSec: null, bold: true,
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

  const progressPct = clipDuration > 0 ? ((currentTime - clipStart) / clipDuration) * 100 : 0;
  const isCropped = edits.aspectRatio !== "original";
  const [arW, arH] = isCropped ? edits.aspectRatio.split(":").map(Number) : [16, 9];
  const cssAspectRatio = `${arW} / ${arH}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-black">{moment.label}</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {formatTime(clipStart)} → {formatTime(clipEnd)} · {Math.round(clipDuration)}s
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Video Preview */}
          <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
              {videoSrc ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div
                    className="relative overflow-hidden"
                    style={
                      isCropped
                        ? { aspectRatio: cssAspectRatio, maxHeight: "100%", maxWidth: "100%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }
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

                    {edits.textOverlays.map((t) => (
                      <div
                        key={t.id}
                        className="absolute pointer-events-none"
                        style={{
                          left: `${t.x * 100}%`, top: `${t.y * 100}%`,
                          transform: "translate(-50%, -50%)",
                          fontSize: isCropped ? `${t.fontSize * 0.5}px` : `${t.fontSize}px`,
                          color: t.color,
                          fontWeight: t.bold ? "bold" : "normal",
                          textShadow: "2px 2px 4px rgba(255,255,255,0.8)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.text}
                      </div>
                    ))}

                    {isCropped && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[#1ABC71] text-[10px] font-mono border border-[#1ABC71]/30 pointer-events-none">
                        {edits.aspectRatio}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 p-8">
                  <p className="text-sm">Video tidak tersedia.</p>
                  <p className="text-xs mt-1">Coba muat ulang halaman.</p>
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
              <div
                className="h-1.5 bg-gray-200 rounded-full mb-4 cursor-pointer relative overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct  = (e.clientX - rect.left) / rect.width;
                  const t    = clipStart + pct * clipDuration;
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-[#1ABC71] rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => seek(-5)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-black">
                    <SkipBack size={16} />
                  </button>
                  <button onClick={togglePlay} className="p-3 bg-[#1ABC71] rounded-xl hover:bg-[#16a085] transition-colors text-white">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} fill="white" />}
                  </button>
                  <button onClick={() => seek(5)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-black">
                    <SkipForward size={16} />
                  </button>
                </div>
                <span className="text-xs font-mono text-gray-500">
                  {formatTime(Math.max(0, currentTime - clipStart))} / {formatTime(clipDuration)}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Panel */}
          <div className="w-72 border-l border-gray-200 flex flex-col overflow-hidden shrink-0 bg-white">

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 shrink-0">
              {([
                { id: "trim",  icon: Clock,   label: "Trim"  },
                { id: "crop",  icon: Crop,    label: "Crop"  },
                { id: "text",  icon: Type,    label: "Text"  },
                { id: "color", icon: Sliders, label: "Color" },
                { id: "speed", icon: Zap,     label: "Speed" },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as Tab)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-[10px] font-medium transition-colors border-b-2 ${
                    activeTab === id
                      ? "text-[#1ABC71] border-[#1ABC71]"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">

              {activeTab === "trim" && (
                <>
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
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1.5 border border-gray-200">
                    <div className="flex justify-between"><span>New Start</span><span className="font-mono text-black">{formatTime(clipStart)}</span></div>
                    <div className="flex justify-between"><span>New End</span><span className="font-mono text-black">{formatTime(clipEnd)}</span></div>
                    <div className="flex justify-between border-t border-gray-200 pt-1.5"><span>Duration</span><span className="font-mono text-[#1ABC71]">{Math.round(clipDuration)}s</span></div>
                  </div>
                </>
              )}

              {activeTab === "crop" && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-xs text-gray-600 font-medium">Aspect Ratio</label>
                      <span className="text-[10px] text-gray-400">· center crop</span>
                    </div>
                    <div className="space-y-1.5">
                      {ASPECT_RATIOS.map((ar) => (
                        <button
                          key={ar.value}
                          onClick={() => updateEdits({ aspectRatio: ar.value })}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between ${
                            edits.aspectRatio === ar.value
                              ? "bg-[#1ABC71]/20 border border-[#1ABC71]/40 text-[#1ABC71]"
                              : "bg-gray-50 border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300"
                          }`}
                        >
                          <span>{ar.label}</span>
                          <span className={`text-[10px] ${edits.aspectRatio === ar.value ? "text-[#1ABC71]/70" : "text-gray-400"}`}>{ar.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#1ABC71]/5 border border-[#1ABC71]/20 rounded-xl p-3">
                    <p className="text-[10px] text-[#1ABC71] font-medium mb-1">How it works</p>
                    <p className="text-[10px] text-gray-600 leading-relaxed">Crops dari <strong className="text-gray-700">tengah</strong> frame — tanpa stretching. Preview terupdate langsung.</p>
                  </div>
                </>
              )}

              {activeTab === "text" && (
                <>
                  <div className="flex gap-2">
                    <input
                      value={newText} onChange={(e) => setNewText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTextOverlay()}
                      placeholder="Add text overlay..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-black placeholder-gray-400 focus:outline-none focus:border-[#1ABC71]/40"
                    />
                    <button onClick={addTextOverlay} className="p-2 bg-[#1ABC71]/20 border border-[#1ABC71]/30 rounded-xl text-[#1ABC71] hover:bg-[#1ABC71]/30 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {edits.textOverlays.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No text overlays yet</p>
                    )}
                    {edits.textOverlays.map((t) => (
                      <div key={t.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-black font-medium truncate flex-1">{t.text}</span>
                          <button onClick={() => removeTextOverlay(t.id)} className="ml-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Size</label>
                            <input type="range" min={16} max={80} value={t.fontSize} onChange={(e) => updateTextOverlay(t.id, { fontSize: +e.target.value })} className="w-full accent-[#1ABC71]" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Color</label>
                            <input type="color" value={t.color} onChange={(e) => updateTextOverlay(t.id, { color: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border border-gray-200" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">X ({Math.round(t.x * 100)}%)</label>
                            <input type="range" min={0} max={1} step={0.01} value={t.x} onChange={(e) => updateTextOverlay(t.id, { x: +e.target.value })} className="w-full accent-[#1ABC71]" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Y ({Math.round(t.y * 100)}%)</label>
                            <input type="range" min={0} max={1} step={0.01} value={t.y} onChange={(e) => updateTextOverlay(t.id, { y: +e.target.value })} className="w-full accent-[#1ABC71]" />
                          </div>
                        </div>
                        <button
                          onClick={() => updateTextOverlay(t.id, { bold: !t.bold })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors border ${t.bold ? "bg-[#1ABC71]/20 border-[#1ABC71]/40 text-[#1ABC71]" : "bg-gray-50 border-gray-200 text-gray-500"}`}
                        >Bold</button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "color" && (
                <>
                  <SliderField label="Brightness" value={edits.brightness} min={-1} max={1} step={0.05} format={(v) => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`)} onChange={(v) => updateEdits({ brightness: v })} />
                  <SliderField label="Contrast"   value={edits.contrast}   min={-1} max={1} step={0.05} format={(v) => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`)} onChange={(v) => updateEdits({ contrast: v })} />
                  <SliderField label="Saturation" value={edits.saturation} min={-1} max={1} step={0.05} format={(v) => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`)} onChange={(v) => updateEdits({ saturation: v })} />
                  <button onClick={() => updateEdits({ brightness: 0, contrast: 0, saturation: 0 })} className="w-full py-2 rounded-xl text-xs text-gray-500 hover:text-black border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw size={12} /> Reset Colors
                  </button>
                </>
              )}

              {activeTab === "speed" && (
                <div>
                  <label className="block text-xs text-gray-600 mb-3">Playback Speed</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s} onClick={() => updateEdits({ speed: s })}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-colors ${edits.speed === s ? "bg-[#1ABC71]/30 border border-[#1ABC71]/50 text-[#1ABC71]" : "bg-gray-50 border border-gray-200 text-gray-500 hover:text-black"}`}
                      >{s}×</button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    {edits.speed < 1 && "🐢 Slow motion effect"}
                    {edits.speed === 1 && "▶ Normal speed"}
                    {edits.speed > 1 && "⚡ Timelapse / fast-forward"}
                  </p>
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 text-[10px] text-gray-500 leading-relaxed border border-gray-200">
                    Audio pitch dipertahankan secara otomatis (atempo filter).
                  </div>
                </div>
              )}
            </div>

            {/* Export button */}
            <div className="p-4 border-t border-gray-200 shrink-0">
              <button
                onClick={() => onExport(moment, edits)}
                disabled={isExporting || !videoSrc}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#1ABC71] text-white hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1ABC71]/20"
              >
                {isExporting ? <><Loader2 size={16} className="animate-spin" /> Exporting...</> : <><Download size={16} /> Export Clip</>}
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
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-xs text-gray-600">{label}</label>
        <span className="text-xs font-mono text-[#1ABC71]">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-[#1ABC71]" />
    </div>
  );
}