// src/components/FileUploadInput.tsx
import { useState, useRef, useCallback } from "react";
import {
  Upload, Zap, AlertCircle, Loader2, Film, CheckCircle2,
  Youtube, Link2, X, Clock, User, Download, ArrowRight,
} from "lucide-react";
import { isApiKeyConfigured } from "../lib/storage";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "";

interface Props {
  onAnalyze: (file: File, duration: number) => void;
  isLoading: boolean;
  error?: string;
}

type Mode = "upload" | "youtube";

interface YoutubeInfo {
  title: string;
  duration: number;
  thumbnail: string;
  author?: string;
  streams?: { resolution: string; filesize_mb: number }[];
}

const ACCEPTED_TYPES = [
  "video/mp4", "video/webm", "video/mov", "video/quicktime",
  "video/avi", "video/x-matroska",
];
const MAX_SIZE_GB = 4;
const MAX_SIZE_BYTES = MAX_SIZE_GB * 1024 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isValidYoutubeUrl(url: string): boolean {
  return !!extractYouTubeId(url.trim());
}

export default function FileUploadInput({ onAnalyze, isLoading, error }: Props) {
  const [mode, setMode] = useState<Mode>("upload");

  // ── Upload state ──────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [loadingDuration, setLoadingDuration] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── YouTube state ─────────────────────────────────────────────────────────
  const [ytUrl, setYtUrl] = useState("");
  const [ytInfo, setYtInfo] = useState<YoutubeInfo | null>(null);
  const [ytError, setYtError] = useState("");
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0); // 0-100

  const apiKeyOk = isApiKeyConfigured();

  // ══════════════════════════════════════════════════════════════════════════
  // UPLOAD helpers
  // ══════════════════════════════════════════════════════════════════════════

  function validateFile(f: File): string {
    if (
      !ACCEPTED_TYPES.includes(f.type) &&
      !f.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)
    ) {
      return "Format tidak didukung. Gunakan MP4, WebM, MOV, AVI, atau MKV.";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File terlalu besar. Maksimal ${MAX_SIZE_GB}GB, file kamu ${formatBytes(f.size)}.`;
    }
    return "";
  }

  function readDuration(f: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      const url = URL.createObjectURL(f);
      video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
      video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Gagal membaca metadata video")); };
      video.src = url;
    });
  }

  async function processFile(f: File) {
    setFileError("");
    const err = validateFile(f);
    if (err) { setFileError(err); return; }

    setLoadingDuration(true);
    try {
      const dur = await readDuration(f);
      setFile(f);
      setDuration(dur);
    } catch {
      setFileError("Gagal membaca video. Pastikan file tidak rusak.");
    } finally {
      setLoadingDuration(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, []);

  function clearFile() {
    setFile(null); setDuration(null); setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || duration === null) return;
    onAnalyze(file, duration);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // YOUTUBE helpers
  // ══════════════════════════════════════════════════════════════════════════

  async function handleFetchYoutubeInfo() {
    const url = ytUrl.trim();
    if (!isValidYoutubeUrl(url)) {
      setYtError("URL YouTube tidak valid. Contoh: https://youtube.com/watch?v=...");
      return;
    }

    setYtError("");
    setYtInfo(null);
    setFetchingInfo(true);

    try {
      const resp = await fetch(
        `${API_BASE}/api/youtube-info?url=${encodeURIComponent(url)}`
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || "Gagal mengambil info video");
      }
      const info: YoutubeInfo = await resp.json();
      setYtInfo(info);
    } catch (err: any) {
      setYtError(err.message || "Gagal mengambil info video YouTube");
    } finally {
      setFetchingInfo(false);
    }
  }

  async function handleYoutubeDownload() {
    if (!ytInfo) return;
    const url = ytUrl.trim();

    setYtError("");
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const formData = new FormData();
      formData.append("url", url);
      formData.append("max_resolution", "720");

      const resp = await fetch(`${API_BASE}/api/download-youtube`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || "Download gagal");
      }

      // Read with progress tracking using Content-Length header
      const contentLength = Number(resp.headers.get("Content-Length") ?? "0");
      const fileName = resp.headers.get("X-File-Name") ?? "youtube_video.mp4";
      const durationStr = resp.headers.get("X-Video-Duration") ?? String(ytInfo.duration);
      const videoDuration = Number(durationStr) || ytInfo.duration;

      // Stream body with progress
      const reader = resp.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (contentLength > 0) {
          setDownloadProgress(Math.round((received / contentLength) * 100));
        } else {
          // Pulse animation when length unknown
          setDownloadProgress((p) => Math.min(p + 2, 90));
        }
      }

      setDownloadProgress(100);

      // Assemble blob → File
      const blob = new Blob(chunks as BlobPart[], { type: "video/mp4" });
      const videoFile = new File([blob], fileName, { type: "video/mp4" });

      // Hand off to parent — identical to file upload flow
      onAnalyze(videoFile, videoDuration);

    } catch (err: any) {
      setYtError(err.message || "Terjadi kesalahan saat download");
      setDownloading(false);
      setDownloadProgress(0);
    }
  }

  function clearYoutube() {
    setYtUrl(""); setYtInfo(null); setYtError("");
    setDownloading(false); setDownloadProgress(0);
  }

  function handleModeSwitch(m: Mode) {
    setMode(m);
    setYtError(""); setFileError("");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  const anyError = error || fileError || ytError;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid - light mode uses dark lines, dark mode uses light lines */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{}}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23888' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1ABC71]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1ABC71]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1ABC71]/10 border border-[#1ABC71]/20 text-[#1ABC71] text-xs font-mono mb-6">
            <Zap size={12} className="fill-[#1ABC71] text-[#1ABC71]" />
            POWERED BY COBAMULAI
          </div>
          <h1
            className="text-5xl font-black text-black dark:text-white tracking-tight mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            AI Viral{" "}
            <span className="text-[#1ABC71]">Clipper</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Upload video kamu. AI mendeteksi momen viral. Kamu edit, auto-subtitle &amp; export.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-2xl border border-gray-200 dark:border-gray-800 p-1 mb-5 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => handleModeSwitch("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === "upload"
              ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <Upload size={15} />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("youtube")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === "youtube"
              ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <Youtube size={15} className={mode === "youtube" ? "text-red-500" : ""} />
            YouTube Link
          </button>
        </div>

        {/* ── UPLOAD MODE ── */}
        {mode === "upload" && (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center ${isDragging
                  ? "border-[#1ABC71]/70 bg-[#1ABC71]/5 scale-[1.01]"
                  : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-[#1ABC71]/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/avi,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-[#1ABC71]/20" : "bg-gray-100 dark:bg-gray-800"
                      }`}
                  >
                    {loadingDuration ? (
                      <Loader2 size={28} className="text-[#1ABC71] animate-spin" />
                    ) : (
                      <Upload size={28} className={isDragging ? "text-[#1ABC71]" : "text-gray-400 dark:text-gray-500"} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      {isDragging ? "Lepaskan file di sini" : "Drag & drop video kamu"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      atau <span className="text-[#1ABC71] underline">browse file</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono mt-1">
                    <span>MP4</span><span>·</span><span>WebM</span><span>·</span>
                    <span>MOV</span><span>·</span><span>AVI</span><span>·</span><span>MKV</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Maks. {MAX_SIZE_GB}GB</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#1ABC71]/30 bg-[#1ABC71]/5 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1ABC71]/10 border border-[#1ABC71]/20 flex items-center justify-center shrink-0">
                    <Film size={22} className="text-[#1ABC71]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      <span>{formatBytes(file.size)}</span>
                      <span>·</span>
                      {duration !== null && (
                        <span className="text-[#1ABC71]">{formatDuration(duration)}</span>
                      )}
                      <span>·</span>
                      <span>{file.type || "video"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors text-xs px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Ganti
                  </button>
                </div>
                {duration !== null && (
                  <div className="mt-3 pt-3 border-t border-[#1ABC71]/15 flex items-center gap-2 text-xs text-[#1ABC71]">
                    <CheckCircle2 size={12} />
                    <span>Video siap dianalisis — durasi {formatDuration(duration)}</span>
                  </div>
                )}
              </div>
            )}

            {anyError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{anyError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !file || !apiKeyOk || duration === null}
              className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider bg-[#1ABC71] text-white hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#1ABC71]/20"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Menganalisis Video...</>
              ) : (
                <><Zap size={18} /> Deteksi Momen Viral</>
              )}
            </button>
          </form>
        )}

        {/* ── YOUTUBE MODE ── */}
        {mode === "youtube" && (
          <div className="space-y-4">
            {/* URL input */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Link YouTube
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="url"
                    value={ytUrl}
                    onChange={(e) => {
                      setYtUrl(e.target.value);
                      if (ytInfo) setYtInfo(null);
                      if (ytError) setYtError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleFetchYoutubeInfo(); }
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={downloading}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-[#1ABC71]/60 focus:ring-2 focus:ring-[#1ABC71]/10 disabled:opacity-60"
                  />
                  {ytUrl && !downloading && (
                    <button
                      type="button"
                      onClick={clearYoutube}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleFetchYoutubeInfo}
                  disabled={!ytUrl.trim() || fetchingInfo || downloading || !isValidYoutubeUrl(ytUrl)}
                  className="px-4 py-2.5 rounded-xl bg-[#1ABC71] text-white text-sm font-semibold hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
                >
                  {fetchingInfo ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                  Cek
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-mono">
                Mendukung: youtube.com/watch?v= · youtu.be/ · /shorts/
              </p>
            </div>

            {/* Video info preview card */}
            {ytInfo && !downloading && (
              <div className="rounded-2xl border border-[#1ABC71]/30 bg-[#1ABC71]/5 overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                    <img
                      src={ytInfo.thumbnail}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  {/* Meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white line-clamp-2 leading-tight mb-1">
                      {ytInfo.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={10} /> {ytInfo.author || "YouTube Creator"}
                      </span>
                      <span className="flex items-center gap-1 text-[#1ABC71] font-mono font-semibold">
                        <Clock size={10} /> {formatDuration(ytInfo.duration)}
                      </span>
                    </div>
                    {ytInfo.streams && ytInfo.streams.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {ytInfo.streams.slice(-3).reverse().map((s, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${i === 0
                              ? "bg-[#1ABC71]/15 border-[#1ABC71]/30 text-[#1ABC71]"
                              : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                              }`}
                          >
                            {s.resolution}
                            {s.filesize_mb > 0 && ` · ${s.filesize_mb}MB`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 pt-0">
                  <button
                    type="button"
                    onClick={handleYoutubeDownload}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-[#1ABC71] text-white hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md shadow-[#1ABC71]/20"
                  >
                    <Download size={16} />
                    Download &amp; Analisis (max 720p)
                  </button>
                </div>
              </div>
            )}

            {/* Download progress */}
            {downloading && (
              <div className="rounded-2xl border border-[#1ABC71]/30 bg-[#1ABC71]/5 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1ABC71]/10 border border-[#1ABC71]/20 flex items-center justify-center shrink-0">
                    <Youtube size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">
                      {ytInfo?.title ?? "Mengunduh video…"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {downloadProgress < 100
                        ? `Mengunduh dari server… ${downloadProgress > 0 ? `${downloadProgress}%` : ""}`
                        : "Selesai, memproses…"}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1ABC71] to-[#16a085] transition-all duration-300"
                    style={{ width: `${downloadProgress || 5}%` }}
                  />
                </div>

                {downloadProgress === 0 && (
                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                    Server sedang mendownload, harap tunggu…
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {(ytError || error) && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{ytError || error}</span>
              </div>
            )}

            {/* isLoading (AI analyzing after download) */}
            {isLoading && !downloading && (
              <div className="flex items-center justify-center gap-3 py-4 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin text-[#1ABC71]" />
                Menganalisis video…
              </div>
            )}
          </div>
        )}

        {/* Info footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-3 text-xs text-gray-500 dark:text-gray-400">
            {(mode === "upload"
              ? [
                "Video dianalisis AI berdasarkan durasi dan nama file — tidak perlu koneksi internet untuk video itu sendiri.",
                "File video disimpan di browser IndexedDB kamu — tidak diupload ke server sampai kamu klik Export.",
                "Auto-subtitle menggunakan OpenAI Whisper — 3 kata per subtitle, tersinkronisasi otomatis.",
                `Format didukung: MP4, WebM, MOV, AVI, MKV (maks. ${MAX_SIZE_GB}GB).`,
              ]
              : [
                "Video YouTube akan diunduh ke server lalu dikirim ke browsermu (maks. resolusi 720p).",
                "Setelah download, video disimpan di IndexedDB browser — tidak perlu upload ulang saat Export.",
                "Video privat, age-restricted, atau yang dinonaktifkan embed-nya tidak bisa diunduh.",
                "Gunakan untuk video yang kamu miliki atau yang bebas digunakan ulang.",
              ]
            ).map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#1ABC71]/50 mt-1.5 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}