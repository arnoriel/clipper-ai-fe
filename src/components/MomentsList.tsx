// src/components/MomentsList.tsx
import {
  Flame, Zap, Heart, Brain, AlertTriangle, Star, Drama,
  CheckCircle2, Clock, TrendingUp, Play, Sparkles, Film,
} from "lucide-react";
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
  funny:       { icon: Flame,         code: "CAT_001", label: "Funny",       color: "text-orange-500",  border: "border-orange-400/30" },
  emotional:   { icon: Heart,         code: "CAT_002", label: "Emotional",   color: "text-pink-500",    border: "border-pink-400/30" },
  educational: { icon: Brain,         code: "CAT_003", label: "Educational", color: "text-blue-400",    border: "border-blue-400/30" },
  shocking:    { icon: AlertTriangle, code: "CAT_004", label: "Shocking",    color: "text-yellow-500",  border: "border-yellow-400/30" },
  satisfying:  { icon: Star,          code: "CAT_005", label: "Satisfying",  color: "text-black dark:text-white",   border: "border-black/30 dark:border-white/30" },
  drama:       { icon: Drama,         code: "CAT_006", label: "Drama",       color: "text-red-500",     border: "border-red-400/30" },
  highlight:   { icon: Zap,           code: "CAT_007", label: "Highlight",   color: "text-black dark:text-white",   border: "border-black/30 dark:border-white/30" },
};

export default function MomentsList({
  result, selectedIds, onToggleSelect, onEditClip, videoFileName, videoDuration,
}: Props) {

  const viralBar = (score: number) => (
    <div className="flex items-center gap-1.5 md:gap-2">
      {/* Mobile: compact dots */}
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`h-1 w-2.5 transition-colors ${
            i < score
              ? score >= 8 ? "bg-red-500" : score >= 6 ? "bg-orange-500" : "bg-black dark:bg-white"
              : "bg-black/10 dark:bg-white/10"
          }`} />
        ))}
      </div>
      <span className="font-mono text-[10px] font-bold text-black/40 dark:text-white/30">{score}/10</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="border border-black/40 dark:border-white/40 bg-black/5 dark:bg-white/5 p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-12 border border-black/40 dark:border-white/40 bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
            <Film size={20} className="text-black dark:text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-black dark:text-white" />
              <span className="font-mono text-[10px] text-black dark:text-white uppercase tracking-widest">AI Analysis</span>
            </div>
            <p className="font-mono text-[10px] text-black/40 dark:text-white/30 truncate mb-1">{videoFileName}</p>
            <p className="font-mono text-xs text-black/60 dark:text-white/50 leading-relaxed">{result.summary}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 pt-4 border-t border-black/15 dark:border-white/15 flex-wrap">
          {[
            { icon: Clock, label: "Durasi", value: formatTime(videoDuration) },
            { icon: TrendingUp, label: "Viral Score", value: `${result.totalViralPotential}/10` },
            { icon: Zap, label: "Momen", value: String(result.moments.length) },
            { icon: CheckCircle2, label: "Dipilih", value: String(selectedIds.length) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <item.icon size={12} className="text-black dark:text-white" />
              <span className="font-mono text-[10px] text-black/40 dark:text-white/30 uppercase">{item.label}</span>
              <span className="font-mono text-xs font-bold text-black dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-subtitle hint */}
      <div className="flex items-center gap-3 px-4 py-3 border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 font-mono text-xs text-black dark:text-white/70">
        <Sparkles size={12} className="shrink-0 text-black dark:text-white" />
        <span>
          Setelah memilih momen dan klik <strong className="text-black dark:text-white">Edit</strong>, gunakan <strong className="text-black dark:text-white">AI Auto Subtitle</strong> di tab Subtitle untuk generate subtitle otomatis.
        </span>
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
              className={`group relative border transition-all duration-150 overflow-hidden cursor-pointer ${
                isSelected
                  ? "border-black/5 dark:border-white/50 bg-black/5 dark:bg-white/5"
                  : "border-black/10 dark:border-white/10 bg-white dark:bg-black hover:border-black/20 dark:hover:border-white/20"
              }`}
              onClick={() => onToggleSelect(moment)}>

              {/* Score bar */}
              <div className="absolute top-0 left-0 h-0.5 bg-black dark:bg-white transition-all duration-300"
                style={{ width: `${moment.viralScore * 10}%` }} />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(moment); }}
                    className="mt-0.5 shrink-0 w-5 h-5 border border-black/20 dark:border-white/20 flex items-center justify-center transition-colors"
                    style={isSelected ? { background: "#000000", borderColor: "#000000" } : {}}>
                    {isSelected && <span className="text-black font-black text-[10px]">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-black text-sm uppercase text-black dark:text-white tracking-tight">{moment.label}</h3>
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 border ${cfg.border} ${cfg.color}`}>
                        <Icon size={10} />{cfg.label}
                      </span>
                    </div>

                    <p className="font-mono text-xs text-black/50 dark:text-white/40 leading-relaxed mb-3 line-clamp-2">{moment.reason}</p>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-black/40 dark:text-white/30">
                        <Clock size={10} />
                        <span>{formatTime(moment.startTime)} → {formatTime(moment.endTime)}</span>
                        <span>({duration}s)</span>
                      </div>
                      {viralBar(moment.viralScore)}
                    </div>
                  </div>

                  {/* Edit button — only when selected */}
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditClip(moment); }}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 border border-black/40 dark:border-white/40 bg-black/10 dark:bg-white/10 text-black dark:text-white font-mono text-[10px] uppercase tracking-widest hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                      <Play size={11} className="fill-current" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="text-center font-mono text-[10px] text-black/40 dark:text-white/30 pb-2">
          {selectedIds.length} clip{selectedIds.length > 1 ? "s" : ""} dipilih — klik "Edit" untuk kustomisasi subtitle & export
        </div>
      )}
    </div>
  );
}