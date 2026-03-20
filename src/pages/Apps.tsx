// src/pages/Apps.tsx
import { useState, useEffect, useRef } from "react";
import { BrandLogo } from "../components/BrandLogo";
import {
  Film, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Sparkles, ArrowLeft,
} from "lucide-react";
import FileUploadInput from "../components/FileUploadInput";
import MomentsList from "../components/MomentsList";
import VideoEditor from "../components/VideoEditor";
import ExportPanel from "../components/ExportPanel";
import { detectViralMomentsFromFile, formatTime, type ViralMoment } from "../lib/AI";
import {
  saveProject, defaultEdits, generateId, getApiKey,
  type Project, type ProjectClip, type ClipEdits,
} from "../lib/storage";
import {
  storeSourceVideo,
  getSourceVideoUrl,
  getSourceVideoBlob,
  uploadAndStoreExportedClip,
  listStoredExportIds,
  getExportedClip,
} from "../lib/videoDB";

const API_BASE = import.meta.env.VITE_API_BASE;

type Step = "input" | "analyzing" | "moments";

function ProgressToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-white dark:bg-black border border-black/40 dark:border-white/40 shadow-lg font-mono text-xs text-black dark:text-white whitespace-nowrap">
      <Loader2 size={13} className="animate-spin text-black dark:text-white shrink-0" />
      {message}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>("input");
  const [project, setProject] = useState<Project | null>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [editingMoment, setEditingMoment] = useState<ViralMoment | null>(null);
  const [clipEdits, setClipEdits] = useState<Record<string, ClipEdits>>({});
  const [exportedUrls, setExportedUrls] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState<"moments" | "export">("moments");

  const videoObjectUrlRef = useRef<string | null>(null);

  // Restore objectURL from IndexedDB when project loads
  useEffect(() => {
    if (!project?.id || project.localVideoUrl) return;
    (async () => {
      const url = await getSourceVideoUrl(project.id);
      if (url) {
        if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
        videoObjectUrlRef.current = url;
        setProject((p) => p ? { ...p, localVideoUrl: url } : p);
      }
    })();
  }, [project?.id]);

  // Restore exported clip objectURLs
  useEffect(() => {
    if (!project) return;
    (async () => {
      const storedIds = await listStoredExportIds();
      if (storedIds.length === 0) return;
      const momentIds = project.analysisResult.moments.map((m) => m.id);
      const relevant = storedIds.filter((id) => momentIds.includes(id));
      if (relevant.length === 0) return;

      const entries = await Promise.all(
        relevant.map(async (momentId) => {
          const result = await getExportedClip(momentId);
          return result ? ([momentId, result.url] as [string, string]) : null;
        })
      );

      const restored: Record<string, string> = {};
      for (const entry of entries) {
        if (entry) restored[entry[0]] = entry[1];
      }
      if (Object.keys(restored).length > 0) {
        setExportedUrls((prev) => ({ ...restored, ...prev }));
      }
    })();
  }, [project?.id]);

  // Revoke objectURLs on unmount
  useEffect(() => {
    return () => {
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      Object.values(exportedUrls).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  // ── STEP 1: Upload + AI analysis ──────────────────────────────────────────
  async function handleAnalyze(file: File, duration: number) {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("API key tidak ditemukan.");
      return;
    }

    setIsLoading(true);
    setError("");
    setProgressMsg("Menyimpan video ke browser…");
    setStep("analyzing");

    try {
      const projectId = generateId();

      await storeSourceVideo(projectId, file.name, file.type, file);
      const objectUrl = URL.createObjectURL(file);
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = objectUrl;

      const videoInfo = {
        fileName: file.name,
        fileSize: file.size,
        duration,
        mimeType: file.type || "video/mp4",
      };

      const result = await detectViralMomentsFromFile(
        videoInfo,
        apiKey,
        (msg) => setProgressMsg(msg)
      );

      const proj: Project = {
        id: projectId,
        videoFileName: file.name,
        videoFileSize: file.size,
        videoMimeType: file.type || "video/mp4",
        videoDuration: duration,
        localVideoUrl: objectUrl,
        analysisResult: result,
        selectedClips: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      saveProject(proj);
      setProject(proj);
      setSelectedClipIds([]);
      setClipEdits({});
      setExportedUrls({});
      setActivePanel("moments");
      setStep("moments");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
      setStep("input");
    } finally {
      setIsLoading(false);
      setProgressMsg("");
    }
  }

  // ── Toggle clip selection ─────────────────────────────────────────────────
  function handleToggleSelect(moment: ViralMoment) {
    const isSelected = selectedClipIds.includes(moment.id);
    setSelectedClipIds((prev) =>
      isSelected ? prev.filter((id) => id !== moment.id) : [...prev, moment.id]
    );
    if (!isSelected && !clipEdits[moment.id]) {
      setClipEdits((prev) => ({ ...prev, [moment.id]: defaultEdits() }));
    }
  }

  // ── Open editor ───────────────────────────────────────────────────────────
  function handleEditMoment(moment: ViralMoment) {
    if (!clipEdits[moment.id]) {
      setClipEdits((prev) => ({ ...prev, [moment.id]: defaultEdits() }));
    }
    setEditingMoment(moment);
  }

  function handleUpdateEdits(edits: ClipEdits) {
    if (!editingMoment) return;
    setClipEdits((prev) => ({ ...prev, [editingMoment.id]: edits }));
  }

  // ── Auto-subtitle: call backend Whisper endpoint ──────────────────────────
  async function handleAutoSubtitle(): Promise<{
    vtt: string;
  } | null> {
    if (!project?.id || !editingMoment) return null;

    const videoBlob = await getSourceVideoBlob(project.id);
    if (!videoBlob) {
      setError("Video tidak ditemukan di IndexedDB.");
      return null;
    }

    const edits = clipEdits[editingMoment.id] || defaultEdits();
    const startTime = editingMoment.startTime + edits.trimStart;
    const endTime = editingMoment.endTime + edits.trimEnd;
    const duration = endTime - startTime;

    const formData = new FormData();
    formData.append("video", videoBlob, "source.mp4");
    formData.append("start_sec", startTime.toString());
    formData.append("duration", duration.toString());

    const resp = await fetch(`${API_BASE}/api/generate-subtitle`, {
      method: "POST",
      body: formData,
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.detail || body.error || "Transcription failed");
    }

    return await resp.json();
  }

  // ── Auto-subtitle with Emoji: call backend emoji endpoint ─────────────────
  async function handleAutoSubtitleEmoji(): Promise<{
    vtt: string;
  } | null> {
    if (!project?.id || !editingMoment) return null;

    const videoBlob = await getSourceVideoBlob(project.id);
    if (!videoBlob) {
      setError("Video tidak ditemukan di IndexedDB.");
      return null;
    }

    const edits = clipEdits[editingMoment.id] || defaultEdits();
    const startTime = editingMoment.startTime + edits.trimStart;
    const endTime = editingMoment.endTime + edits.trimEnd;
    const duration = endTime - startTime;

    const formData = new FormData();
    formData.append("video", videoBlob, "source.mp4");
    formData.append("start_sec", startTime.toString());
    formData.append("duration", duration.toString());

    const resp = await fetch(`${API_BASE}/api/auto-subtitle-emoji`, {
      method: "POST",
      body: formData,
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.detail || body.error || "Transcription with Emoji failed");
    }

    return await resp.json();
  }


  // ── Export clip → IndexedDB ───────────────────────────────────────────────
  async function handleExportClip(moment: ViralMoment, edits: ClipEdits) {
    if (!project?.id) {
      setError("Tidak ada project aktif.");
      return;
    }

    const videoBlob = await getSourceVideoBlob(project.id);
    if (!videoBlob) {
      setError("Video tidak ditemukan di IndexedDB. Coba muat ulang halaman.");
      return;
    }

    setIsExporting(true);
    setExportingId(moment.id);
    setProgressMsg("Mengupload ke server untuk diproses…");

    try {
      const clip = {
        startTime: moment.startTime + edits.trimStart,
        endTime: moment.endTime + edits.trimEnd,
        label: moment.label,
      };

      // Pass FULL edits (all style properties) to backend for proper ffmpeg rendering
      const editsForServer = {
        aspectRatio: edits.aspectRatio,
        brightness: edits.brightness,
        contrast: edits.contrast,
        saturation: edits.saturation,
        speed: edits.speed,
        trimStart: edits.trimStart,
        trimEnd: edits.trimEnd,
        // Send complete TextOverlay objects so backend can render all styles
        textOverlays: edits.textOverlays.map((t) => ({
          id: t.id,
          text: t.text,
          x: t.x,
          y: t.y,
          fontSize: t.fontSize,
          fontFamily: t.fontFamily,
          color: t.color,
          bold: t.bold,
          italic: t.italic,
          uppercase: t.uppercase,
          textAlign: t.textAlign,
          letterSpacing: t.letterSpacing,
          opacity: t.opacity,
          outlineWidth: t.outlineWidth,
          outlineColor: t.outlineColor,
          shadowEnabled: t.shadowEnabled,
          shadowColor: t.shadowColor,
          shadowX: t.shadowX,
          shadowY: t.shadowY,
          shadowBlur: t.shadowBlur,
          backgroundEnabled: t.backgroundEnabled,
          backgroundColor: t.backgroundColor,
          backgroundOpacity: t.backgroundOpacity,
          backgroundPadding: t.backgroundPadding,
          startSec: t.startSec,
          endSec: t.endSec,
        })),
      };

      setProgressMsg("Server memproses clip, harap tunggu…");

      const objectUrl = await uploadAndStoreExportedClip(
        `${API_BASE}/api/export-clip`,
        videoBlob,
        moment.id,
        clip,
        editsForServer
      );

      setExportedUrls((prev) => ({ ...prev, [moment.id]: objectUrl }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExporting(false);
      setExportingId(null);
      setProgressMsg("");
    }
  }

  // ── Derived clips ─────────────────────────────────────────────────────────
  const selectedClips: ProjectClip[] = selectedClipIds
    .map((id) => {
      const moment = project?.analysisResult.moments.find((m) => m.id === id);
      if (!moment) return null;
      return { momentId: id, moment, edits: clipEdits[id] || defaultEdits() };
    })
    .filter(Boolean) as ProjectClip[];

  // ── Render: Input / Analyzing ─────────────────────────────────────────────
  if (step === "input" || step === "analyzing") {
    return (
      <>
        <FileUploadInput onAnalyze={handleAnalyze} isLoading={isLoading} error={error} />
        {progressMsg && <ProgressToast message={progressMsg} />}
      </>
    );
  }

  if (!project) return null;

  // ── Render: Main workspace ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
      <div className="h-px bg-black dark:bg-white" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-black/10 dark:border-white/10 shrink-0 bg-white dark:bg-black">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setStep("input"); setProject(null); setSelectedClipIds([]); setClipEdits({}); setExportedUrls({}); setError(""); }}
            className="p-1.5 border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
            title="Kembali ke home">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
              <BrandLogo size={14} className="fill-current stroke-current" style={{ color: 'inherit' }} />
            </div>
            <span className="font-black text-xs uppercase tracking-widest text-black dark:text-white">TryKlip</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden md:block min-w-0">
          <div className="flex items-center gap-2 font-mono text-xs text-black/40 dark:text-white/30 truncate">
            <Film size={11} className="text-black dark:text-white shrink-0" />
            <span className="truncate">{project.videoFileName}</span>
            <span className="shrink-0 font-mono">· {formatTime(project.videoDuration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-black dark:text-white">
            <CheckCircle2 size={11} />
            <span className="hidden sm:inline">Video siap</span>
          </div>
          {selectedClipIds.length > 0 && (
            <button onClick={() => setActivePanel("export")}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">
              <Film size={11} />
              Export {selectedClipIds.length} Clip{selectedClipIds.length > 1 ? "s" : ""}
              <ChevronRight size={11} />
            </button>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 p-3 border border-red-400/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-mono text-xs">
          <AlertCircle size={13} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left sidebar */}
        <aside className="w-72 border-r border-black/10 dark:border-white/10 overflow-y-auto p-5 hidden lg:flex flex-col shrink-0 bg-gray-50 dark:bg-black">
          <div className="border border-black/10 dark:border-white/10 p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 border border-black/40 dark:border-white/40 bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Film size={16} className="text-black dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-bold text-black dark:text-white truncate">{project.videoFileName}</p>
                <p className="font-mono text-[10px] text-black/40 dark:text-white/30 mt-0.5">
                  {formatTime(project.videoDuration)} · {(project.videoFileSize / 1_048_576).toFixed(0)}MB
                </p>
              </div>
            </div>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 dark:text-white/30 mb-2">
            {project.analysisResult.moments.length} momen terdeteksi
          </p>

          <div className="space-y-2 mb-6">
            {[
              { label: "Upload Video", done: true },
              { label: "Analisis AI", done: true },
              { label: "Pilih Moments", done: selectedClipIds.length > 0 },
              {
                label: "Edit & Subtitle", done: Object.values(clipEdits).some(
                  (e) => e.aspectRatio !== "original" || e.textOverlays.length > 0 ||
                    e.trimStart !== 0 || e.trimEnd !== 0 || e.speed !== 1
                )
              },
              { label: "Export & Download", done: Object.keys(exportedUrls).length > 0 },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 flex items-center justify-center border font-mono text-[10px] font-bold shrink-0 ${s.done ? "border-black/5 dark:border-white/50 bg-black/15 dark:bg-white/15 text-black dark:text-white" : "border-black/15 dark:border-white/15 text-black/30 dark:text-white/20"}`}>
                  {s.done ? "✓" : i + 1}
                </div>
                <span className={`font-mono text-xs ${s.done ? "text-black dark:text-white" : "text-black/40 dark:text-white/30"}`}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-5 border-t border-black/10 dark:border-white/10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 dark:text-white/30 mb-2">AI Summary</p>
            <p className="font-mono text-xs text-black/60 dark:text-white/50 leading-relaxed">{project.analysisResult.summary}</p>
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-white dark:bg-black">
          <div className="sticky top-0 z-10 flex items-center gap-0 px-6 py-3 bg-white/95 dark:bg-black/95 backdrop-blur border-b border-black/10 dark:border-white/10">
            <button onClick={() => setActivePanel("moments")}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${activePanel === "moments" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white"}`}>
              <Sparkles size={11} />
              Momen Viral ({project.analysisResult.moments.length})
            </button>
            <button onClick={() => setActivePanel("export")}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${activePanel === "export" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white"}`}>
              <Film size={11} />
              Clips Dipilih ({selectedClipIds.length})
            </button>
          </div>

          <div className="p-6">
            {activePanel === "moments" && (
              <MomentsList
                result={project.analysisResult}
                selectedIds={selectedClipIds}
                onToggleSelect={handleToggleSelect}
                onEditClip={handleEditMoment}
                videoFileName={project.videoFileName}
                videoDuration={project.videoDuration}
              />
            )}
            {activePanel === "export" && (
              <ExportPanel
                clips={selectedClips}
                exportedUrls={exportedUrls}
                exportingId={exportingId}
                onExportClip={(clip) => handleExportClip(clip.moment, clip.edits)}
                onEditClip={(clip) => handleEditMoment(clip.moment)}
                onRemoveClip={(id) => setSelectedClipIds((prev) => prev.filter((x) => x !== id))}
              />
            )}
          </div>
        </main>
      </div>

      {progressMsg && <ProgressToast message={progressMsg} />}

      {editingMoment && (
        <VideoEditor
          moment={editingMoment}
          edits={clipEdits[editingMoment.id] || defaultEdits()}
          videoSrc={project.localVideoUrl || ""}
          onUpdateEdits={handleUpdateEdits}
          onExport={handleExportClip}
          onClose={() => setEditingMoment(null)}
          isExporting={isExporting && exportingId === editingMoment.id}
          onAutoSubtitle={handleAutoSubtitle}
          onAutoSubtitleEmoji={handleAutoSubtitleEmoji}
        />
      )}
    </div>
  );
}