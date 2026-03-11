// src/components/MomentsList.tsx
import { useState } from "react";
import {
  Flame, Zap, Heart, Brain, AlertTriangle, Star, Drama,
  CheckCircle2, Circle, Clock, TrendingUp, Play, Sparkles, Film,
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
  funny:       { icon: Flame,         color: "text-orange-500",  bg: "bg-orange-50",   border: "border-orange-200",  label: "Funny" },
  emotional:   { icon: Heart,         color: "text-pink-500",    bg: "bg-pink-50",     border: "border-pink-200",    label: "Emotional" },
  educational: { icon: Brain,         color: "text-blue-500",    bg: "bg-blue-50",     border: "border-blue-200",    label: "Educational" },
  shocking:    { icon: AlertTriangle, color: "text-yellow-500",  bg: "bg-yellow-50",   border: "border-yellow-200",  label: "Shocking" },
  satisfying:  { icon: Star,          color: "text-emerald-500", bg: "bg-emerald-50",  border: "border-emerald-200", label: "Satisfying" },
  drama:       { icon: Drama,         color: "text-red-500",     bg: "bg-red-50",      border: "border-red-200",     label: "Drama" },
  highlight:   { icon: Zap,           color: "text-[#1ABC71]",   bg: "bg-[#1ABC71]/10",border: "border-[#1ABC71]/20",label: "Highlight" },
};

export default function MomentsList({
  result, selectedIds, onToggleSelect, onEditClip, videoFileName, videoDuration,
}: Props) {
  const [, setHoveredId] = useState<string | null>(null);

  const viralBar = (score: number) => (
    <div className="flex items-center gap-1.5 md:gap-2">
      {/* Mobile: compact dots */}
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`h-1.5 w-2 md:w-3 rounded-full transition-colors ${
            i < score ? score >= 8 ? "bg-red-500" : score >= 6 ? "bg-orange-500" : "bg-[#1ABC71]" : "bg-gray-200"
          }`} />
        ))}
      </div>
      <span className="text-xs font-bold text-gray-500">{score}/10</span>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary card */}
      <div className="bg-gradient-to-br from-[#1ABC71]/10 to-[#1ABC71]/5 border border-[#1ABC71]/20 rounded-2xl p-4 md:p-5">
        {/* Mobile layout: stacked; Desktop: side by side */}
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-14 h-10 md:w-20 md:h-14 rounded-lg bg-[#1ABC71]/10 border border-[#1ABC71]/20 flex items-center justify-center shrink-0">
            <Film size={20} className="text-[#1ABC71] md:hidden" />
            <Film size={24} className="text-[#1ABC71] hidden md:block" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-[#1ABC71]" />
              <span className="text-xs font-mono text-[#1ABC71] uppercase tracking-wider">AI Analysis</span>
            </div>
            <p className="text-xs text-gray-500 truncate font-mono mb-1">{videoFileName}</p>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{result.summary}</p>
          </div>
        </div>

        <div className="mt-3 md:mt-4 flex items-center gap-4 md:gap-6 pt-3 md:pt-4 border-t border-[#1ABC71]/10 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-[#1ABC71]" />
            <span className="text-xs text-gray-500">Durasi</span>
            <span className="text-xs md:text-sm font-bold text-black font-mono">{formatTime(videoDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-[#1ABC71]" />
            <span className="text-xs text-gray-500">Viral</span>
            <span className="text-xs md:text-sm font-bold text-black">{result.totalViralPotential}/10</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-[#1ABC71]" />
            <span className="text-xs text-gray-500">Momen</span>
            <span className="text-xs md:text-sm font-bold text-black">{result.moments.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-[#1ABC71]" />
            <span className="text-xs text-gray-500">Dipilih</span>
            <span className="text-xs md:text-sm font-bold text-black">{selectedIds.length}</span>
          </div>
        </div>
      </div>

      {/* Auto-subtitle hint */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-400">
        <Sparkles size={13} className="shrink-0 mt-0.5" />
        <span>
          Setelah memilih momen dan klik <strong>Edit</strong>, gunakan fitur <strong>AI Auto Subtitle</strong> di tab Subtitle untuk generate subtitle otomatis 3 kata per baris.
        </span>
      </div>

      {/* Moments grid */}
      <div className="space-y-2 md:space-y-3">
        {result.moments.map((moment) => {
          const isSelected = selectedIds.includes(moment.id);
          const cfg = CATEGORY_CONFIG[moment.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.highlight;
          const Icon = cfg.icon;
          const duration = moment.endTime - moment.startTime;

          return (
            <div key={moment.id}
              onMouseEnter={() => setHoveredId(moment.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                isSelected
                  ? "bg-[#1ABC71]/10 border-[#1ABC71]/40 shadow-lg shadow-[#1ABC71]/10"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
              }`}
              onClick={() => onToggleSelect(moment)}>

              {/* Viral score bar */}
              <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-[#1ABC71] to-[#16a085] transition-all duration-300"
                style={{ width: `${moment.viralScore * 10}%` }} />

              <div className="p-3 md:p-4">
                <div className="flex items-start gap-2 md:gap-3">
                  {/* Checkbox — larger tap target on mobile */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(moment); }}
                    className="mt-0.5 shrink-0 p-0.5"
                  >
                    {isSelected
                      ? <CheckCircle2 size={20} className="text-[#1ABC71]" />
                      : <Circle size={20} className="text-gray-400 group-hover:text-gray-600" />
                    }
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Title + category badge */}
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-black">{moment.label}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.border} ${cfg.color} border shrink-0`}>
                        <Icon size={10} />{cfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed mb-2 md:mb-3 line-clamp-2">{moment.reason}</p>

                    {/* Time + viral score row */}
                    <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={11} />
                        <span className="font-mono">{formatTime(moment.startTime)} → {formatTime(moment.endTime)}</span>
                        <span className="text-gray-400 hidden sm:inline">({duration}s)</span>
                      </div>
                      {viralBar(moment.viralScore)}
                    </div>
                  </div>

                  {/* Edit button — only when selected */}
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditClip(moment); }}
                      className="shrink-0 flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-xl bg-[#1ABC71]/20 border border-[#1ABC71]/30 text-[#1ABC71] text-xs font-medium hover:bg-[#1ABC71]/30 transition-colors active:scale-95">
                      <Play size={12} className="fill-current" />
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
        <div className="text-center text-xs text-gray-500 pb-2 px-4">
          {selectedIds.length} clip{selectedIds.length > 1 ? "s" : ""} dipilih — klik "Edit" untuk mengkustomisasi subtitle &amp; export
        </div>
      )}
    </div>
  );
}