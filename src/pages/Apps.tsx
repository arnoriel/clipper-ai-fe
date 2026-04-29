// src/pages/Apps.tsx  — CREDIT SYSTEM additions
// ════════════════════════════════════════════════════════════════════════════
// Changes vs original:
//  1. Import CreditModal + credit helpers from Auth
//  2. `credits` state (local + backend-synced)
//  3. Credits badge in header (clickable → opens CreditModal)
//  4. After analyze-video success → sync credits_remaining
//  5. After auto-subtitle success → sync credits_remaining
//  6. INSUFFICIENT_CREDITS error shows friendly modal / message
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { BrandLogo } from "../components/BrandLogo";
import {
  Film, ChevronRight,
  CheckCircle2, AlertCircle, Sparkles, ArrowLeft,
  CreditCard, Menu, LogOut, X as XIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FileUploadInput from "../components/FileUploadInput";
import MomentsList from "../components/MomentsList";
import VideoEditor from "../components/VideoEditor";
import ExportPanel from "../components/ExportPanel";
import CreditModal from "../components/CreditModal";
import type { ClipTemplate } from "../lib/templates";
import { applyTemplateToEdits } from "../lib/templates";
import { detectViralMomentsFromFile, formatTime, type ViralMoment } from "../lib/AI";
import ProgressBar, { type ProgressState, type ProgressStage } from "../components/ProgressBar";
import {
  saveProject, defaultEdits, generateId, getApiKey, getProject,
  type Project, type ProjectClip, type ClipEdits,
} from "../lib/storage";
import {
  storeSourceVideo, getSourceVideoUrl, getSourceVideoBlob,
  uploadAndStoreExportedClip, listStoredExportIds, getExportedClip,
} from "../lib/videoDB";
import {
  clearAuth, getStoredUser, getStoredCredits, updateStoredCredits, refreshCredits, getToken,
} from "../lib/Auth";                                              // ← updated imports

const API_BASE = import.meta.env.VITE_API_BASE;

// ── Session persistence (unchanged) ─────────────────────────────────────────
const SESSION_KEY = "ai_clipper_active_session_v1";
function saveSession(projectId: string, selectedClipIds: string[], clipEdits: Record<string, ClipEdits>) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ projectId, selectedClipIds, clipEdits })); } catch {}
}
function loadSession() {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

type Step = "input" | "analyzing" | "moments";

const IDLE_PROGRESS: ProgressState = { pct: 0, stage: "idle" as ProgressStage, msg: "" };

export default function App() {
  const navigate = useNavigate();

  const [step, setStep]                       = useState<Step>("input");
  const [project, setProject]                 = useState<Project | null>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [editingMoment, setEditingMoment]     = useState<ViralMoment | null>(null);
  const [clipEdits, setClipEdits]             = useState<Record<string, ClipEdits>>({});
  const [exportedUrls, setExportedUrls]       = useState<Record<string, string>>({});

  const [isLoading, setIsLoading]     = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [, setProgressMsg] = useState("");
  const [progressState, setProgressState] = useState<ProgressState>(IDLE_PROGRESS);
  // Track whether auto-generate mode is active (shows 3rd subtitle stage)
  const [autoMode, setAutoMode] = useState(false);
  const [error, setError]             = useState("");
  const [activePanel, setActivePanel] = useState<"moments" | "export">("moments");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // ── CREDIT STATE (new) ───────────────────────────────────────────────────
  const [credits, setCredits]           = useState(getStoredCredits);
  const [showCreditModal, setShowCreditModal] = useState(false);

  /** Sync credits from server and update local state */
  async function syncCredits() {
    const latest = await refreshCredits();
    setCredits(latest);
  }

  // Refresh credits on mount
  useEffect(() => { syncCredits(); }, []);

  const videoObjectUrlRef = useRef<string | null>(null);
  const currentUser = getStoredUser();

  function handleLogout() {
    clearSession(); clearAuth();
    navigate("/auth", { replace: true });
  }

  // Restore objectURL from IndexedDB
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
      if (!storedIds.length) return;
      const momentIds = project.analysisResult.moments.map((m) => m.id);
      const relevant = storedIds.filter((id) => momentIds.includes(id));
      if (!relevant.length) return;
      const entries = await Promise.all(
        relevant.map(async (momentId) => {
          const result = await getExportedClip(momentId);
          return result ? ([momentId, result.url] as [string, string]) : null;
        })
      );
      const restored: Record<string, string> = {};
      for (const entry of entries) if (entry) restored[entry[0]] = entry[1];
      if (Object.keys(restored).length) setExportedUrls((prev) => ({ ...restored, ...prev }));
    })();
  }, [project?.id]);

  useEffect(() => {
    return () => {
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      Object.values(exportedUrls).forEach((url) => { if (url.startsWith("blob:")) URL.revokeObjectURL(url); });
    };
  }, []);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    const proj = getProject(session.projectId);
    if (!proj) { clearSession(); return; }
    setProject(proj);
    setSelectedClipIds(session.selectedClipIds || []);
    setClipEdits(session.clipEdits || {});
    setActivePanel("moments");
    setStep("moments");
  }, []);

  useEffect(() => {
    if (project && step === "moments") saveSession(project.id, selectedClipIds, clipEdits);
  }, [project?.id, step, selectedClipIds, clipEdits]);

  // ── STEP 1: Upload + AI analysis ─────────────────────────────────────────
  async function handleAnalyze(file: File, duration: number, numClips: number = 5) {
    // Pre-flight credit check
    if (credits <= 0) {
      setShowCreditModal(true);
      setError("Kredit kamu habis. Silakan top up dulu.");
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) { setError("API key tidak ditemukan."); return; }

    setIsLoading(true); setError("");
    setAutoMode(false);
    setProgressMsg("Menyimpan video ke browser…");
    setProgressState({ pct: 1, stage: "loading", msg: "Menyimpan video ke browser…" });
    setStep("analyzing");

    try {
      const projectId = generateId();
      await storeSourceVideo(projectId, file.name, file.type, file);
      const objectUrl = URL.createObjectURL(file);
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = objectUrl;

      const videoInfo = { fileName: file.name, fileSize: file.size, duration, mimeType: file.type || "video/mp4" };

      const result = await detectViralMomentsFromFile(
        videoInfo, apiKey,
        (pct, stage, msg) => {
          setProgressMsg(msg);
          const mappedPct = Math.round(pct * 0.65);
          setProgressState({ pct: mappedPct, stage: stage as any, msg });
        },
        numClips,
      );

      // ── Sync credits after deduction ────────────────────────────────────
      if (typeof result.credits_remaining === "number") {
        updateStoredCredits(result.credits_remaining);
        setCredits(result.credits_remaining);
      } else {
        await syncCredits();
      }

      const proj: Project = {
        id:             projectId,
        videoFileName:  file.name,
        videoFileSize:  file.size,
        videoMimeType:  file.type || "video/mp4",
        videoDuration:  duration,
        localVideoUrl:  objectUrl,
        analysisResult: result,
        selectedClips:  [],
        createdAt:      Date.now(),
        updatedAt:      Date.now(),
      };
      saveProject(proj);
      setProject(proj);
      setSelectedClipIds([]); setClipEdits({}); setExportedUrls({});
      setActivePanel("moments"); setStep("moments");
    } catch (err: any) {
      if (err.message === "INSUFFICIENT_CREDITS") {
        setError("Kredit tidak cukup. Silakan top up.");
        setShowCreditModal(true);
      } else {
        setError(err.message || "Terjadi kesalahan");
      }
      setStep("input");
    } finally {
      setIsLoading(false); setProgressMsg(""); setProgressState(IDLE_PROGRESS);
    }
  }

   // ── Auto-generate: analyze + apply template to every clip ───────────────
  async function handleAutoGenerate(
    file: File,
    duration: number,
    templateArg: ClipTemplate,
    watermarkSrc: string | null,
    numClips: number = 5,
  ) {
    if (credits <= 0) {
      setShowCreditModal(true);
      setError("Kredit kamu habis. Silakan top up dulu.");
      return;
    }
 
    // Mutable local copy so we can disable subtitles if credits run out mid-loop
    let template = { ...templateArg };
 
    setIsLoading(true);
    setError("");
    setAutoMode(true);
    setProgressMsg("Menyimpan video ke browser…");
    setProgressState({ pct: 1, stage: "loading", msg: "Menyimpan video ke browser…" });
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
        getApiKey(),
        (pct, stage, msg) => { setProgressMsg(msg); setProgressState({ pct, stage: stage as any, msg }); },
        numClips,
      );
 
      if (typeof result.credits_remaining === "number") {
        updateStoredCredits(result.credits_remaining);
        setCredits(result.credits_remaining);
      } else {
        await syncCredits();
      }
 
      const proj: Project = {
        id:             projectId,
        videoFileName:  file.name,
        videoFileSize:  file.size,
        videoMimeType:  file.type || "video/mp4",
        videoDuration:  duration,
        localVideoUrl:  objectUrl,
        analysisResult: result,
        selectedClips:  [],
        createdAt:      Date.now(),
        updatedAt:      Date.now(),
      };
      saveProject(proj);
      setProject(proj);
 
      const allMomentIds = result.moments.map((m) => m.id);
      const newClipEdits: Record<string, ClipEdits> = {};
      const videoBlob = await getSourceVideoBlob(projectId);
 
      for (let i = 0; i < result.moments.length; i++) {
        const moment = result.moments[i];
        const subtitlePct = Math.round(65 + ((i) / result.moments.length) * 32);
        const subtitleMsg = `AI Creating Subtitles (clip ${i + 1}/${result.moments.length})...`;
        setProgressMsg(subtitleMsg);
        setProgressState({ pct: subtitlePct, stage: "subtitles", msg: subtitleMsg });
 
        let subtitleChunks: { text: string; start: number; end: number }[] = [];
 
        if (template.subtitle_enabled && videoBlob) {
          try {
            const formData = new FormData();
            formData.append("video", videoBlob, "source.mp4");
            formData.append("start_time", String(moment.startTime));
            formData.append("end_time",   String(moment.endTime));
 
            const token = getToken();
            const resp = await fetch(`${API_BASE}/api/auto-subtitle`, {
              method:  "POST",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body:    formData,
            });
 
            if (resp.ok) {
              const data = await resp.json();
              subtitleChunks = (data.chunks as typeof subtitleChunks) || [];
              if (typeof data.credits_remaining === "number") {
                updateStoredCredits(data.credits_remaining);
                setCredits(data.credits_remaining);
              }
            } else if (resp.status === 402) {
              // No more credits — disable subtitle for remaining clips
              template = { ...template, subtitle_enabled: false };
            }
          } catch {
            // Continue without subtitles for this clip
          }
        }
 
        newClipEdits[moment.id] = {
          ...defaultEdits(),
          ...applyTemplateToEdits(template, watermarkSrc, subtitleChunks),
        };
      }
 
      setProgressState({ pct: 100, stage: "done", msg: "Semua clip siap!" });
      await new Promise((r) => setTimeout(r, 500)); // brief flash of 100%
      setSelectedClipIds(allMomentIds);
      setClipEdits(newClipEdits);
      setExportedUrls({});
      setActivePanel("export");
      setStep("moments");
 
    } catch (err: any) {
      if (err.message === "INSUFFICIENT_CREDITS") {
        setError("Kredit tidak cukup. Silakan top up.");
        setShowCreditModal(true);
      } else {
        setError(err.message || "Terjadi kesalahan");
      }
      setStep("input");
    } finally {
      setIsLoading(false);
      setProgressMsg("");
      setProgressState(IDLE_PROGRESS);
    }
  }

  function handleToggleSelect(moment: ViralMoment) {
    const isSelected = selectedClipIds.includes(moment.id);
    setSelectedClipIds((prev) => isSelected ? prev.filter((id) => id !== moment.id) : [...prev, moment.id]);
    if (!isSelected && !clipEdits[moment.id]) {
      setClipEdits((prev) => ({ ...prev, [moment.id]: defaultEdits() }));
    }
  }

  function handleEditMoment(moment: ViralMoment) {
    if (!clipEdits[moment.id]) setClipEdits((prev) => ({ ...prev, [moment.id]: defaultEdits() }));
    setEditingMoment(moment);
  }

  function handleUpdateEdits(edits: ClipEdits) {
    if (!editingMoment) return;
    setClipEdits((prev) => ({ ...prev, [editingMoment.id]: edits }));
  }

  // ── AI Auto-subtitle (deducts 1 credit) ─────────────────────────────────
  async function handleAutoSubtitle(): Promise<any | null> {
    if (!project?.id || !editingMoment) return null;

    // Pre-flight credit check
    if (credits <= 0) {
      setShowCreditModal(true);
      throw new Error("Kredit tidak cukup. Silakan top up.");
    }

    const videoBlob = await getSourceVideoBlob(project.id);
    if (!videoBlob) { setError("Video tidak ditemukan di IndexedDB."); return null; }

    const edits = clipEdits[editingMoment.id] || defaultEdits();
    const startTime = editingMoment.startTime + edits.trimStart;
    const endTime   = editingMoment.endTime   + edits.trimEnd;

    const token = getToken();
    const formData = new FormData();
    formData.append("video", videoBlob, "source.mp4");
    formData.append("start_time", startTime.toString());
    formData.append("end_time", endTime.toString());

    const resp = await fetch(`${API_BASE}/api/auto-subtitle`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 402) {
        setShowCreditModal(true);
        throw new Error("Kredit tidak cukup. Silakan top up.");
      }
      throw new Error(body.detail || body.error || "Transcription failed");
    }

    const data = await resp.json();

    // Sync credits after deduction
    if (typeof data.credits_remaining === "number") {
      updateStoredCredits(data.credits_remaining);
      setCredits(data.credits_remaining);
    } else {
      await syncCredits();
    }

    return data;
  }


  // ── Export clip ──────────────────────────────────────────────────────────
  async function handleExportClip(moment: ViralMoment, edits: ClipEdits) {
    if (!project?.id) { setError("Tidak ada project aktif."); return; }
    const videoBlob = await getSourceVideoBlob(project.id);
    if (!videoBlob) { setError("Video tidak ditemukan di IndexedDB."); return; }

    setIsExporting(true); setExportingId(moment.id);
    setProgressMsg("Mengupload ke server untuk diproses…");
    try {
      const clip = {
        startTime: moment.startTime + edits.trimStart,
        endTime:   moment.endTime   + edits.trimEnd,
        label:     moment.label,
      };
      const editsForServer = {
        aspectRatio:     edits.aspectRatio,
        brightness:      edits.brightness,
        contrast:        edits.contrast,
        saturation:      edits.saturation,
        speed:           edits.speed,
        trimStart:       edits.trimStart,
        trimEnd:         edits.trimEnd,
        motionKeyframes: edits.motionKeyframes ?? null,
        motionVidW:      edits.motionVidW ?? null,
        motionVidH:      edits.motionVidH ?? null,
        // ── Text watermark fields ──────────────────────────────────────────
        watermarkType:       edits.watermarkType       ?? "image",
        watermarkText:       edits.watermarkText       ?? null,
        watermarkFontFamily: edits.watermarkFontFamily ?? "Montserrat",
        watermarkTextColor:  edits.watermarkTextColor  ?? "#FFFFFF",
        watermarkBold:       edits.watermarkBold       ?? false,
        watermarkItalic:     edits.watermarkItalic     ?? false,
        watermarkFontSize:   edits.watermarkFontSize   ?? 0.04,
        watermarkX:          edits.watermarkX          ?? 0.88,
        watermarkY:          edits.watermarkY          ?? 0.06,
        watermarkOpacity:    edits.watermarkOpacity    ?? 0.85,
        // ──────────────────────────────────────────────────────────────────
        textOverlays:    edits.textOverlays.map((t) => ({
          id: t.id, text: t.text, x: t.x, y: t.y, fontSize: t.fontSize,
          fontFamily: t.fontFamily, color: t.color, bold: t.bold, italic: t.italic,
          uppercase: t.uppercase, textAlign: t.textAlign, letterSpacing: t.letterSpacing,
          opacity: t.opacity, outlineWidth: t.outlineWidth, outlineColor: t.outlineColor,
          shadowEnabled: t.shadowEnabled, shadowColor: t.shadowColor, shadowX: t.shadowX,
          shadowY: t.shadowY, shadowBlur: t.shadowBlur, backgroundEnabled: t.backgroundEnabled,
          backgroundColor: t.backgroundColor, backgroundOpacity: t.backgroundOpacity,
          backgroundPadding: t.backgroundPadding, startSec: t.startSec, endSec: t.endSec,
        })),
        imageOverlays: (edits.imageOverlays ?? []).map((img) => ({
          id: img.id, src: img.src, name: img.name, x: img.x, y: img.y,
          width: img.width, opacity: img.opacity, startSec: img.startSec, endSec: img.endSec,
        })),
      };
      setProgressMsg("Server memproses clip, harap tunggu…");
      const objectUrl = await uploadAndStoreExportedClip(
        `${API_BASE}/api/export-clip`, videoBlob, moment.id, clip, editsForServer, getToken() ?? undefined
      );
      setExportedUrls((prev) => ({ ...prev, [moment.id]: objectUrl }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExporting(false); setExportingId(null); setProgressMsg("");
    }
  }

  const selectedClips: ProjectClip[] = selectedClipIds
    .map((id) => {
      const moment = project?.analysisResult.moments.find((m) => m.id === id);
      if (!moment) return null;
      return { momentId: id, moment, edits: clipEdits[id] || defaultEdits() };
    })
    .filter(Boolean) as ProjectClip[];

  // ─── RENDER: Input / Analyzing ──────────────────────────────────────────
   if (step === "input" || step === "analyzing") {
    return (
      <>
        {/* ── Minimal header with logout ── */}
        <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-3 bg-white/90 dark:bg-black/90 backdrop-blur border-b border-black/8 dark:border-white/8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-black dark:bg-white flex items-center justify-center">
              <BrandLogo size={14} className="text-white dark:text-black" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest text-black dark:text-white">TryKlip</span>
          </div>

          {currentUser && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 border border-black/15 dark:border-white/15 text-black/50 dark:text-white/40 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 font-mono text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              <LogOut size={12} />
              {currentUser.name?.split(" ")[0] ?? "Logout"}
            </button>
          )}
        </header>

        {/* Logout confirm */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 mx-auto mb-4">
                <LogOut size={20} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white text-center mb-1">Logout?</h3>
              <p className="text-xs text-gray-400 text-center mb-5">Kamu akan keluar dari akun{currentUser?.name ? ` ${currentUser.name}` : ""}.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-red-500 text-xs font-semibold text-white hover:bg-red-600 transition-colors">Ya, Logout</button>
              </div>
            </div>
          </div>
        )}

        <div className="h-[49px]" />
        <FileUploadInput
          onAnalyze={handleAnalyze}
          onAutoGenerate={handleAutoGenerate}
          isLoading={isLoading}
          error={error}
          credits={credits}
          onTopUpClick={() => setShowCreditModal(true)}
        />
        {isLoading && progressState.pct > 0 && (
          <ProgressBar progress={progressState} hasSubtitles={autoMode} />
        )}
        {showCreditModal && (
          <CreditModal currentCredits={credits} onClose={() => setShowCreditModal(false)} />
        )}
      </>
    );
  }

  if (!project) return null;

  // ─── RENDER: Main workspace ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
      <div className="h-px bg-black dark:bg-white" />

      {/* Header — mobile-first */}
      <header className="flex items-center justify-between px-3 md:px-6 py-2.5 md:py-3 border-b border-black/10 dark:border-white/10 shrink-0 bg-white dark:bg-black gap-2">
        {/* Left */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={() => { setStep("input"); setProject(null); setSelectedClipIds([]); setClipEdits({}); setExportedUrls({}); setError(""); }}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
            title="Kembali ke home">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black rounded-md">
              <BrandLogo size={12} className="fill-current stroke-current" style={{ color: 'inherit' }} />
            </div>
            <span className="font-black text-xs uppercase tracking-widest text-black dark:text-white hidden sm:inline">TryKlip</span>
          </div>
        </div>

        {/* Center — filename (desktop) */}
        <div className="flex-1 max-w-md mx-4 hidden md:block min-w-0">
          <div className="flex items-center gap-2 font-mono text-xs text-black/40 dark:text-white/30 truncate">
            <Film size={11} className="text-black dark:text-white shrink-0" />
            <span className="truncate">{project.videoFileName}</span>
            <span className="shrink-0">· {formatTime(project.videoDuration)}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Credits badge — always visible on mobile */}
          <button
            onClick={() => setShowCreditModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              credits === 0 ? "bg-red-500/10 border-red-400/30 text-red-500 dark:text-red-400" :
              credits <= 3 ? "bg-orange-500/10 border-orange-400/30 text-orange-500 dark:text-orange-400" :
              "bg-black/5 dark:bg-white/10 border-black/15 dark:border-white/15 text-black dark:text-white"
            }`}
            title="Lihat & top up kredit">
            <CreditCard size={11} />
            <span>{credits}</span>
          </button>

          {/* Video ready badge — desktop */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-black/50 dark:text-white/50">
            <CheckCircle2 size={11} />
            <span className="hidden md:inline">Video siap</span>
          </div>

          {/* Export button */}
          {selectedClipIds.length > 0 && (
            <button onClick={() => setActivePanel("export")}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-xl">
              <Film size={11} />
              <span className="hidden sm:inline">Export </span>{selectedClipIds.length}
              <ChevronRight size={11} />
            </button>
          )}

          {/* Info (mobile) */}
          <button onClick={() => setShowMobileSidebar(true)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 lg:hidden" title="Info">
            <Menu size={18} />
          </button>

          {/* Logout (desktop) */}
          <div className="relative hidden lg:block">
            <button onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              title="Logout">
              <LogOut size={13} />
              <span>{currentUser?.name?.split(" ")[0] ?? "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMobileSidebar(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#080d1a] border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-5 flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Info</span>
              <button onClick={() => setShowMobileSidebar(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <XIcon size={16} />
              </button>
            </div>

            {/* Credits in sidebar */}
            <div className="mb-4 px-3 py-3 rounded-xl bg-[#000000]/5 border border-[#000000]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Kredit Tersisa</p>
                  <p className={`text-2xl font-black mt-0.5 ${credits === 0 ? "text-red-500" : credits <= 3 ? "text-orange-500" : "text-[#000000]"}`}>
                    {credits}
                  </p>
                </div>
                <button onClick={() => { setShowMobileSidebar(false); setShowCreditModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#16a085] transition-colors">
                  <CreditCard size={12} /> Top Up
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#000000]/10 border border-[#000000]/20 flex items-center justify-center shrink-0">
                  <Film size={18} className="text-[#000000]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-black dark:text-white truncate">{project.videoFileName}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                    {formatTime(project.videoDuration)} · {(project.videoFileSize / 1_048_576).toFixed(0)}MB
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {project.analysisResult.moments.length} momen terdeteksi
            </h2>
            <div className="space-y-2 mb-6">
              {[
                { label: "Upload Video",      done: true },
                { label: "Analisis AI",       done: true },
                { label: "Pilih Moments",     done: selectedClipIds.length > 0 },
                { label: "Edit & Subtitle",   done: Object.values(clipEdits).some((e) => e.aspectRatio !== "original" || e.textOverlays.length > 0 || e.trimStart !== 0 || e.trimEnd !== 0 || e.speed !== 1) },
                { label: "Export & Download", done: Object.keys(exportedUrls).length > 0 },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold shrink-0 ${s.done ? "bg-[#000000]/20 border-[#000000]/40 text-[#000000]" : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400"}`}>
                    {s.done ? "✓" : i + 1}
                  </div>
                  <span className={s.done ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}>{s.label}</span>
                </div>
              ))}
            </div>

            {currentUser && (
              <div className="mb-4 px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
                </div>
                <button onClick={() => { setShowMobileSidebar(false); setShowLogoutConfirm(true); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0">
                  <LogOut size={13} />
                </button>
              </div>
            )}

            <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-mono">AI Summary</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{project.analysisResult.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 mx-auto mb-4">
              <LogOut size={20} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white text-center mb-1">Logout?</h3>
            <p className="text-xs text-gray-400 text-center mb-5">Kamu akan keluar dari akun{currentUser?.name ? ` ${currentUser.name}` : ""}.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 md:py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
              <button onClick={handleLogout} className="flex-1 py-3 md:py-2.5 rounded-xl bg-red-500 text-xs font-semibold text-white hover:bg-red-600 transition-colors">Ya, Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 p-3 border border-red-400/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-mono text-xs">
          <AlertCircle size={13} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* ── Main layout ── */}
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
              { label: "Upload Video",      done: true },
              { label: "Analisis AI",       done: true },
              { label: "Pilih Moments",     done: selectedClipIds.length > 0 },
              { label: "Edit & Subtitle",   done: Object.values(clipEdits).some((e) => e.aspectRatio !== "original" || e.textOverlays.length > 0 || e.trimStart !== 0 || e.trimEnd !== 0 || e.speed !== 1) },
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
          <div className="sticky top-0 z-10 flex items-center gap-0 px-3 md:px-6 bg-white/95 dark:bg-black/95 backdrop-blur border-b border-black/10 dark:border-white/10">
            <button onClick={() => setActivePanel("moments")}
              className={`flex-1 md:flex-none px-4 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center md:justify-start gap-2 border-b-2 ${activePanel === "moments" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white"}`}>
              <Sparkles size={11} />
              <span>Momen Viral</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${activePanel === "moments" ? "bg-black/10 dark:bg-white/10" : "bg-black/5 dark:bg-white/5"}`}>{project.analysisResult.moments.length}</span>
            </button>
            <button onClick={() => setActivePanel("export")}
              className={`flex-1 md:flex-none px-4 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center md:justify-start gap-2 border-b-2 ${activePanel === "export" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white"}`}>
              <Film size={11} />
              <span>Clips Dipilih</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${activePanel === "export" ? "bg-black/10 dark:bg-white/10" : "bg-black/5 dark:bg-white/5"} ${selectedClipIds.length > 0 ? "text-black dark:text-white font-bold" : ""}`}>{selectedClipIds.length}</span>
            </button>
          </div>

          <div className="p-3 md:p-6 pb-6">
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

      {isLoading && progressState.pct > 0 && (
          <ProgressBar progress={progressState} hasSubtitles={autoMode} />
        )}

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
        />
      )}

      {/* Credit Modal */}
      {showCreditModal && (
        <CreditModal currentCredits={credits} onClose={() => setShowCreditModal(false)} />
      )}
    </div>
  );
}