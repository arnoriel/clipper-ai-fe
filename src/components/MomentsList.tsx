import {
  Flame, Zap, Heart, Brain, AlertTriangle, Star, Drama,
  CheckCircle2, Clock, TrendingUp, Play, Sparkles, Film, Copy, ClipboardCheck,
} from "lucide-react";
import { useState } from "react";
import type { ViralMoment, VideoAnalysisResult } from "../lib/AI";
import { formatTime } from "../lib/AI";

interface Props {
  result: VideoAnalysisResult;
  selectedIds: string[];
  onToggleSelect: (moment: ViralMoment) => void;
  onEditClip: (moment: ViralMoment) => void;
  videoFileName: string;
  videoDuration: number;
}

const CATEGORY_CONFIG = {
  funny:       { icon: Flame,         label: "Funny",       color: "text-orange-500",  bg: "bg-orange-500/10", border: "border-orange-400/30" },
  emotional:   { icon: Heart,         label: "Emotional",   color: "text-pink-500",    bg: "bg-pink-500/10",   border: "border-pink-400/30" },
  educational: { icon: Brain,         label: "Educational", color: "text-blue-400",    bg: "bg-blue-500/10",   border: "border-blue-400/30" },
  shocking:    { icon: AlertTriangle, label: "Shocking",    color: "text-yellow-500",  bg: "bg-yellow-500/10", border: "border-yellow-400/30" },
  satisfying:  { icon: Star,          label: "Satisfying",  color: "text-white",       bg: "bg-white/10",      border: "border-white/20" },
  drama:       { icon: Drama,         label: "Drama",       color: "text-red-500",     bg: "bg-red-500/10",    border: "border-red-400/30" },
  highlight:   { icon: Zap,           label: "Highlight",   color: "text-white",       bg: "bg-white/10",      border: "border-white/20" },
};

export default function MomentsList({ result, selectedIds, onToggleSelect, onEditClip, videoFileName, videoDuration }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyMomentText(moment: ViralMoment, e: React.MouseEvent) {
    e.stopPropagation();
    const text = `${moment.label}\n${formatTime(moment.startTime)} → ${formatTime(moment.endTime)}\n${moment.reason}`;
    navigator.clipboard.writeText(text).then(() => { setCopiedId(moment.id); setTimeout(() => setCopiedId(null), 1500); });
  }

  const viralBar = (score: number) => (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`h-1.5 w-2.5 rounded-sm transition-colors ${i < score ? score >= 8 ? "bg-red-500" : score >= 6 ? "bg-orange-500" : "bg-white" : "bg-white/10"}`} />
        ))}
      </div>
      <span className="font-mono text-[10px] font-bold text-white/40">{score}/10</span>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Summary card */}
      <div className="border border-white/10 bg-white/3 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
            <Film size={18} className="text-white/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={11} className="text-white/60" />
              <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">AI Analysis</span>
            </div>
            <p className="font-mono text-[10px] text-white/30 truncate mb-1">{videoFileName}</p>
            <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{result.summary}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 pt-3 border-t border-white/8 flex-wrap">
          {[
            { icon: Clock, label: "Durasi", value: formatTime(videoDuration) },
            { icon: TrendingUp, label: "Viral", value: `${result.totalViralPotential}/10` },
            { icon: Zap, label: "Momen", value: String(result.moments.length) },
            { icon: CheckCircle2, label: "Dipilih", value: String(selectedIds.length) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <item.icon size={11} className="text-white/40" />
              <span className="font-mono text-[10px] text-white/30 uppercase">{item.label}</span>
              <span className="font-mono text-xs font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tip banner */}
      <div className="flex items-center gap-3 px-4 py-3 border border-white/10 bg-white/3 rounded-xl text-xs text-white/50">
        <Sparkles size={12} className="shrink-0 text-white/50" />
        <span>Pilih momen lalu tap <strong className="text-white">Edit</strong> untuk buka editor & generate subtitle otomatis.</span>
      </div>

      {/* Moments list */}
      <div className="space-y-2">
        {result.moments.map((moment) => {
          const isSelected = selectedIds.includes(moment.id);
          const cfg = CATEGORY_CONFIG[moment.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.highlight;
          const Icon = cfg.icon;
          const duration = moment.endTime - moment.startTime;
          return (
            <div key={moment.id}
              className={`relative border rounded-xl transition-all duration-150 overflow-hidden cursor-pointer active:scale-[0.99] ${isSelected ? "border-white/30 bg-white/8" : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"}`}
              onClick={() => onToggleSelect(moment)}>

              {/* Viral score bar on top */}
              <div className="absolute top-0 left-0 h-0.5 bg-white/30 transition-all duration-300" style={{ width: `${moment.viralScore * 10}%` }} />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox — big enough for mobile */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(moment); }}
                    className={`mt-0.5 shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-all ${isSelected ? "bg-white border-white text-black" : "border-white/20 hover:border-white/40"}`}>
                    {isSelected && <span className="font-black text-[11px] text-black">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-sm text-white tracking-tight">{moment.label}</h3>
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
                        <Icon size={9} />{cfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-white/40 leading-relaxed mb-2.5 line-clamp-2">{moment.reason}</p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1 font-mono text-[10px] text-white/35">
                        <Clock size={9} />
                        <span>{formatTime(moment.startTime)} → {formatTime(moment.endTime)} ({duration}s)</span>
                      </div>
                      {viralBar(moment.viralScore)}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-1">
                    <button
                      onClick={(e) => copyMomentText(moment, e)}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/20 hover:text-white/60 transition-colors">
                      {copiedId === moment.id ? <ClipboardCheck size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                    {isSelected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditClip(moment); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/80 transition-colors active:scale-95 shadow-lg whitespace-nowrap">
                        <Play size={11} className="fill-current" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="text-center text-[10px] text-white/30 pb-2">
          {selectedIds.length} clip{selectedIds.length > 1 ? "s" : ""} dipilih — tap "Edit" untuk kustomisasi subtitle & export
        </div>
      )}
    </div>
  );
}