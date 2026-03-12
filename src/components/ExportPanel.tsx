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
  "9:16": "9:16 Vertical",
  "16:9": "16:9 Wide",
  "1:1":  "1:1 Square",
  "4:3":  "4:3 Classic",
};

export default function ExportPanel({
  clips, exportedUrls, exportingId, onExportClip, onEditClip, onRemoveClip,
}: Props) {
  if (clips.length === 0) {
    return (
      <div className="text-center py-12 md:py-16 text-gray-400 px-4">
        <Film size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No clips selected yet.</p>
        <p className="text-xs mt-1">Go back and select some viral moments.</p>
      </div>
    );
  }

  function downloadFile(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const exportedCount = Object.keys(exportedUrls).length;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {clips.length} Clip{clips.length > 1 ? "s" : ""} Ready
        </h3>
        {exportedCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-[#1ABC71]">
            <CheckCircle2 size={12} />{exportedCount} exported
          </span>
        )}
      </div>

      {clips.map((clip) => {
        const isExporting    = exportingId === clip.momentId;
        const exportedUrl    = exportedUrls[clip.momentId];
        const effectiveStart = clip.moment.startTime + clip.edits.trimStart;
        const effectiveEnd   = clip.moment.endTime   + clip.edits.trimEnd;
        const duration       = effectiveEnd - effectiveStart;
        const autoSubCount   = clip.edits.textOverlays.filter((t) => t.isAutoSubtitle).length;
        const manualSubCount = clip.edits.textOverlays.filter((t) => !t.isAutoSubtitle).length;
        const imageCount     = (clip.edits.imageOverlays ?? []).length;

        // Motion tracking state
        const hasMotionTracking = clip.edits.motionAnalyzed &&
          clip.edits.motionKeyframes &&
          clip.edits.motionKeyframes.length > 0 &&
          !clip.edits.isStaticMotion;
        const hasStaticFaceCrop = clip.edits.motionAnalyzed && clip.edits.isStaticMotion;

        return (
          <div key={clip.momentId} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4 space-y-3">
            {/* Clip info */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1ABC71]/10 border border-[#1ABC71]/20 flex items-center justify-center shrink-0">
                <Film size={14} className="text-[#1ABC71]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">{clip.moment.label}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {formatTime(effectiveStart)} → {formatTime(effectiveEnd)}
                  <span className="ml-2 text-gray-400">({Math.round(duration)}s)</span>
                </p>
              </div>
              <button onClick={() => onRemoveClip(clip.momentId)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 shrink-0 active:scale-90" title="Remove clip">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Edits badges */}
            <div className="flex flex-wrap gap-1.5">
              {clip.edits.aspectRatio !== "original" && (
                <span className="px-2 py-0.5 rounded-md bg-[#1ABC71]/10 text-[#1ABC71] text-[10px] border border-[#1ABC71]/20">
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
                <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-500 text-[10px] border border-orange-200">
                  {clip.edits.speed}× speed
                </span>
              )}
              {autoSubCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-500 text-[10px] border border-purple-200 flex items-center gap-1">
                  <Sparkles size={8} />
                  {autoSubCount} auto subtitle{autoSubCount > 1 ? "s" : ""}
                </span>
              )}
              {manualSubCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-[#1ABC71]/10 text-[#1ABC71] text-[10px] border border-[#1ABC71]/20">
                  {manualSubCount} manual text{manualSubCount > 1 ? "s" : ""}
                </span>
              )}
              {imageCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-500 text-[10px] border border-indigo-200">
                  {imageCount} image{imageCount > 1 ? "s" : ""}
                </span>
              )}
              {(clip.edits.brightness !== 0 || clip.edits.contrast !== 0 || clip.edits.saturation !== 0) && (
                <span className="px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-600 text-[10px] border border-yellow-200">
                  color adjusted
                </span>
              )}
              {(clip.edits.trimStart !== 0 || clip.edits.trimEnd !== 0) && (
                <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-500 text-[10px] border border-pink-200">
                  trimmed
                </span>
              )}
            </div>

            {/* Action buttons — full width on mobile */}
            <div className="flex gap-2 pt-1">
              <button onClick={() => onEditClip(clip)}
                className="flex-1 py-2.5 md:py-2 rounded-xl text-xs border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300 transition-colors active:scale-95">
                Edit
              </button>

              {exportedUrl ? (
                <button
                  onClick={() => downloadFile(exportedUrl, `${clip.moment.label.replace(/\s+/g, "_")}.mp4`)}
                  className="flex-1 py-2.5 md:py-2 rounded-xl text-xs bg-[#1ABC71]/20 border border-[#1ABC71]/30 text-[#1ABC71] hover:bg-[#1ABC71]/30 transition-colors flex items-center justify-center gap-1.5 active:scale-95">
                  <Download size={12} /> Download
                </button>
              ) : (
                <button onClick={() => onExportClip(clip)} disabled={isExporting}
                  className="flex-1 py-2.5 md:py-2 rounded-xl text-xs bg-[#1ABC71] text-white hover:bg-[#16a085] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 active:scale-95">
                  {isExporting
                    ? <><Loader2 size={12} className="animate-spin" /> Processing...</>
                    : <><Zap size={12} /> Export</>
                  }
                </button>
              )}
            </div>

            {exportedUrl && (
              <div className="flex items-center gap-2 text-xs text-[#1ABC71]/70 bg-[#1ABC71]/5 rounded-lg px-3 py-2">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>Exported — click Download to save to your device</span>
              </div>
            )}
          </div>
        );
      })}

      {clips.length > 1 && exportedCount < clips.length && (
        <p className="text-center text-[10px] text-gray-400 pb-2">
          Export each clip individually, then download
        </p>
      )}
    </div>
  );
}