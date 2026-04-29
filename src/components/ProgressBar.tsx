// src/components/ProgressBar.tsx
// Real-time 3-stage progress overlay: Loading AI → AI Generating Moments → AI Creating Subtitles

import { useEffect, useRef, useState } from "react";
import { Brain, Sparkles, Captions, CheckCircle2, Loader2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export type ProgressStage = "idle" | "loading" | "analyzing" | "subtitles" | "processing" | "done";

export interface ProgressState {
  pct:   number;        // 0-100
  stage: ProgressStage;
  msg:   string;
}

interface Props {
  progress:   ProgressState;
  /** true = show all 3 stages (auto mode), false = show only stages 1-2 (manual) */
  hasSubtitles?: boolean;
}

// ── Stage config ─────────────────────────────────────────────────────────────

const STAGES_FULL = [
  { id: "loading",   label: "Loading AI",             icon: Brain,    pctRange: [0,  20]  },
  { id: "analyzing", label: "AI Generating Moments",  icon: Sparkles, pctRange: [20, 65]  },
  { id: "subtitles", label: "AI Creating Subtitles",  icon: Captions, pctRange: [65, 100] },
] as const;

const STAGES_MANUAL = [
  { id: "loading",   label: "Loading AI",             icon: Brain,    pctRange: [0,  20]  },
  { id: "analyzing", label: "AI Generating Moments",  icon: Sparkles, pctRange: [20, 100] },
] as const;

// ── Helper: which stage is active / done ─────────────────────────────────────

function getStageStatus(
  stageId: string,
  currentStage: ProgressStage,
  pct: number,
  hasSubtitles: boolean,
): "done" | "active" | "pending" {
  const stages = hasSubtitles ? STAGES_FULL : STAGES_MANUAL;
  const idx     = stages.findIndex((s) => s.id === stageId);
  const current = stages.findIndex((s) => s.id === currentStage);

  if (idx < 0) return "pending";
  if (pct >= 100) return "done";
  if (idx < current) return "done";
  if (idx === current) return "active";
  return "pending";
}

// ── Animated counter hook ────────────────────────────────────────────────────

function useAnimatedPct(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const rafRef  = useRef<number>(0);
  const prevRef = useRef(target);

  useEffect(() => {
    const from  = prevRef.current;
    const to    = target;
    const start = performance.now();

    cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProgressBar({ progress, hasSubtitles = false }: Props) {
  const { pct, stage, msg } = progress;
  const displayPct           = useAnimatedPct(pct);
  const stages               = hasSubtitles ? STAGES_FULL : STAGES_MANUAL;

  // Stage label to show (human-readable active stage)
  const activeStageLabel =
    stages.find(
      (s) =>
        s.id === stage ||
        (stage === "processing" && s.id === "analyzing")
    )?.label ?? "Processing...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize:  "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4 flex flex-col items-center gap-8">

        {/* ── Percentage counter ── */}
        <div className="text-center">
          <div
            className="font-mono font-black tabular-nums leading-none tracking-tighter"
            style={{ fontSize: "clamp(4rem, 12vw, 6rem)", color: "#000" }}
          >
            {displayPct}
            <span className="text-[0.4em] font-bold opacity-50">%</span>
          </div>
          <p className="mt-2 text-sm font-mono text-black/50 tracking-wide uppercase">
            {activeStageLabel}
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div className="w-full">
          <div className="relative h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
            {/* Track */}
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
              style={{
                width:      `${displayPct}%`,
                background: "linear-gradient(90deg, #000 0%, #333 100%)",
              }}
            />
            {/* Shimmer */}
            <div
              className="absolute inset-y-0 w-24 rounded-full opacity-30"
              style={{
                left:       `calc(${displayPct}% - 96px)`,
                background: "linear-gradient(90deg, transparent, #fff, transparent)",
                animation:  "shimmer 1.2s linear infinite",
                transition: "left 700ms ease-out",
              }}
            />
          </div>
        </div>

        {/* ── Stage indicators ── */}
        <div className="w-full flex items-start justify-between gap-2">
          {stages.map((s, i) => {
            const status = getStageStatus(s.id, stage, pct, hasSubtitles);
            const Icon   = s.icon;

            return (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                {/* Connector line (before stage, except first) */}
                <div className="w-full flex items-center gap-1">
                  {i > 0 && (
                    <div
                      className="flex-1 h-px transition-all duration-500"
                      style={{
                        background: status === "pending" ? "#e5e7eb" : "#000",
                      }}
                    />
                  )}

                  {/* Icon bubble */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500"
                    style={{
                      background:
                        status === "done"
                          ? "#000"
                          : status === "active"
                          ? "#fff"
                          : "#f3f4f6",
                      border:
                        status === "active"
                          ? "2px solid #000"
                          : "2px solid transparent",
                      boxShadow:
                        status === "active"
                          ? "0 0 0 4px rgba(0,0,0,0.08)"
                          : "none",
                    }}
                  >
                    {status === "done" ? (
                      <CheckCircle2 size={16} className="text-white" />
                    ) : status === "active" ? (
                      <Loader2 size={16} className="text-black animate-spin" />
                    ) : (
                      <Icon
                        size={15}
                        className="text-black/30"
                      />
                    )}
                  </div>

                  {i < stages.length - 1 && (
                    <div
                      className="flex-1 h-px transition-all duration-500"
                      style={{
                        background:
                          getStageStatus(stages[i + 1].id, stage, pct, hasSubtitles) !== "pending"
                            ? "#000"
                            : "#e5e7eb",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <p
                  className="text-center font-mono text-[10px] leading-tight transition-all duration-300 px-1"
                  style={{
                    color:
                      status === "done"
                        ? "#000"
                        : status === "active"
                        ? "#000"
                        : "#9ca3af",
                    fontWeight: status === "active" ? 700 : 400,
                  }}
                >
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Status message ── */}
        <div className="text-center min-h-[2rem]">
          <p className="text-xs font-mono text-black/40 animate-pulse">
            {msg || "Memproses..."}
          </p>
        </div>
      </div>

      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%);  }
        }
      `}</style>
    </div>
  );
}
