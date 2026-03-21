// src/components/ExportPanel.tsx
import { Download, CheckCircle2, Loader2, Film, Trash2, Zap, Sparkles, Activity, User } from "lucide-react";
import type { ProjectClip } from "../lib/storage";
import { formatTime } from "../lib/AI";

interface Props {
  clips: ProjectClip[];
  exportedUrls: Record<string, string>;
  exportingId: string | null;
  onExportClip: (clip: ProjectClip) => void;
  onEditClip: (clip: ProjectClip) => void;
  onRemoveClip: (momentId: string) => void;
}

const AR_LABELS: Record<string, string> = {
  "9:16": "9:16 VERTICAL",
  "16:9": "16:9 WIDE",
  "1:1":  "1:1 SQUARE",
  "4:3":  "4:3 CLASSIC",
};

export default function ExportPanel({
  clips, exportedUrls, exportingId, onExportClip, onEditClip, onRemoveClip,
}: Props) {
  if (clips.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 border border-black/15 dark:border-white/15 flex items-center justify-center mx-auto mb-4">
          <Film size={28} className="text-black/20 dark:text-white/20" />
        </div>
        <p className="font-mono text-sm text-black/40 dark:text-white/30">TIDAK ADA CLIP DIPILIH</p>
        <p className="font-mono text-xs text-black/25 dark:text-white/20 mt-1">Kembali dan pilih momen viral yang ingin di-export.</p>
      </div>
    );
  }

  function downloadFile(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  const exportedCount = Object.keys(exportedUrls).length;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-black/40 dark:text-white/30">
          {clips.length} Clip{clips.length > 1 ? "s" : ""} Siap Export
        </span>
        {exportedCount > 0 && (
          <span className="flex items-center gap-1.5 font-mono text-xs text-black dark:text-white">
            <CheckCircle2 size={11} />{exportedCount} exported
          </span>
        )}
      </div>

      {clips.map((clip) => {
        const isExporting = exportingId === clip.momentId;
        const exportedUrl = exportedUrls[clip.momentId];
        const effectiveStart = clip.moment.startTime + clip.edits.trimStart;
        const effectiveEnd = clip.moment.endTime + clip.edits.trimEnd;
        const duration = effectiveEnd - effectiveStart;
        const autoSubCount = clip.edits.textOverlays.filter((t) => t.isAutoSubtitle).length;
        const manualSubCount = clip.edits.textOverlays.filter((t) => !t.isAutoSubtitle).length;
        const imageCount     = (clip.edits.imageOverlays ?? []).length;

        // Motion tracking state
        const hasMotionTracking = clip.edits.motionAnalyzed &&
          clip.edits.motionKeyframes &&
          clip.edits.motionKeyframes.length > 0 &&
          !clip.edits.isStaticMotion;
        const hasStaticFaceCrop = clip.edits.motionAnalyzed && clip.edits.isStaticMotion;

        return (
          <div key={clip.momentId} className={`border p-4 space-y-3 ${exportedUrl ? "border-black/40 dark:border-white/40 bg-black/5 dark:bg-white/5" : "border-black/10 dark:border-white/10 bg-white dark:bg-black"}`}>
            {/* Clip info */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 border border-black/40 dark:border-white/40 bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Film size={13} className="text-black dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase text-black dark:text-white truncate tracking-tight">{clip.moment.label}</p>
                <p className="font-mono text-[10px] text-black/40 dark:text-white/30 mt-0.5">
                  {formatTime(effectiveStart)} → {formatTime(effectiveEnd)}
                  <span className="ml-2">({Math.round(duration)}s)</span>
                </p>
              </div>
              <button onClick={() => onRemoveClip(clip.momentId)}
                className="text-black/20 dark:text-white/20 hover:text-red-500 transition-colors p-1 shrink-0" title="Remove clip">
                <Trash2 size={13} />
              </button>
            </div>

            {/* Edits badges */}
            <div className="flex flex-wrap gap-1.5">
              {clip.edits.aspectRatio !== "original" && (
                <span className="font-mono text-[10px] px-2 py-0.5 border border-black/30 dark:border-white/30 text-black dark:text-white">
                  {AR_LABELS[clip.edits.aspectRatio] ?? clip.edits.aspectRatio}
                </span>
              )}

              {/* Motion tracking badge */}
              {hasMotionTracking && (
                <span className="px-2 py-0.5 rounded-md bg-[#1ABC71]/10 text-[#1ABC71] text-[10px] border border-[#1ABC71]/20 flex items-center gap-1">
                  <Activity size={8} />
                  AI tracking · {clip.edits.motionKeyframes?.length ?? 0} kf
                </span>
              )}

              {/* Static face crop badge */}
              {hasStaticFaceCrop && !hasMotionTracking && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[10px] border border-blue-200 flex items-center gap-1">
                  <User size={8} />
                  face crop
                </span>
              )}

              {clip.edits.speed !== 1 && (
                <span className="font-mono text-[10px] px-2 py-0.5 border border-orange-400/30 text-orange-500">
                  {clip.edits.speed}× SPEED
                </span>
              )}
              {autoSubCount > 0 && (
                <span className="font-mono text-[10px] px-2 py-0.5 border border-black/30 dark:border-white/30 text-black dark:text-white flex items-center gap-1">
                  <Sparkles size={8} />{autoSubCount} AUTO SUB
                </span>
              )}
              {manualSubCount > 0 && (
                <span className="font-mono text-[10px] px-2 py-0.5 border border-black/15 dark:border-white/15 text-black/50 dark:text-white/40">
                  {manualSubCount} MANUAL TEXT
                </span>
              )}
              {imageCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-500 text-[10px] border border-indigo-200">
                  {imageCount} image{imageCount > 1 ? "s" : ""}
                </span>
              )}
              {(clip.edits.brightness !== 0 || clip.edits.contrast !== 0 || clip.edits.saturation !== 0) && (
                <span className="font-mono text-[10px] px-2 py-0.5 border border-yellow-400/30 text-yellow-600 dark:text-yellow-400">
                  COLOR ADJUSTED
                </span>
              )}
              {(clip.edits.trimStart !== 0 || clip.edits.trimEnd !== 0) && (
                <span className="font-mono text-[10px] px-2 py-0.5 border border-pink-400/30 text-pink-500">
                  TRIMMED
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={() => onEditClip(clip)}
                className="flex-1 py-2 font-mono text-[10px] uppercase tracking-widest border border-black/15 dark:border-white/15 text-black/50 dark:text-white/40 hover:border-black/30 dark:hover:border-white/30 hover:text-black dark:hover:text-white transition-colors">
                Edit
              </button>

              {exportedUrl ? (
                <button
                  onClick={() => downloadFile(exportedUrl, `${clip.moment.label.replace(/\s+/g, "_")}.mp4`)}
                  className="flex-1 py-2 font-mono text-[10px] uppercase tracking-widest border border-black/40 dark:border-white/40 bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5">
                  <Download size={11} /> Download
                </button>
              ) : (
                <button onClick={() => onExportClip(clip)} disabled={isExporting}
                  className="flex-1 py-2 font-mono text-[10px] uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black font-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-1.5">
                  {isExporting
                    ? <><Loader2 size={11} className="animate-spin" /> Processing...</>
                    : <><Zap size={11} /> Export Clip</>
                  }
                </button>
              )}
            </div>

            {exportedUrl && (
              <div className="flex items-center gap-2 font-mono text-[10px] text-black dark:text-white bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 px-3 py-2">
                <CheckCircle2 size={11} className="shrink-0" />
                <span>Exported — klik Download untuk simpan ke perangkat</span>
              </div>
            )}
          </div>
        );
      })}

      {clips.length > 1 && exportedCount < clips.length && (
        <p className="text-center font-mono text-[10px] text-black/30 dark:text-white/20 pb-2">
          Export setiap clip satu per satu, lalu download
        </p>
      )}
    </div>
  );
}