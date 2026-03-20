// src/components/FileUploadInput.tsx
import { useState, useRef, useCallback } from "react";
import { BrandLogo } from "./BrandLogo";
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

  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [loadingDuration, setLoadingDuration] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [ytUrl, setYtUrl] = useState("");
  const [ytInfo, setYtInfo] = useState<YoutubeInfo | null>(null);
  const [ytError, setYtError] = useState("");
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const apiKeyOk = isApiKeyConfigured();

  function validateFile(f: File): string {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
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
      setFile(f); setDuration(dur);
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
    e.preventDefault(); setIsDragging(false);
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

  async function handleFetchYoutubeInfo() {
    const url = ytUrl.trim();
    if (!isValidYoutubeUrl(url)) { setYtError("URL YouTube tidak valid."); return; }
    setYtError(""); setYtInfo(null); setFetchingInfo(true);
    try {
      const resp = await fetch(`${API_BASE}/api/youtube-info?url=${encodeURIComponent(url)}`);
      if (!resp.ok) { const body = await resp.json().catch(() => ({})); throw new Error(body.detail || "Gagal mengambil info video"); }
      setYtInfo(await resp.json());
    } catch (err: any) {
      setYtError(err.message || "Gagal mengambil info video YouTube");
    } finally { setFetchingInfo(false); }
  }

  async function handleYoutubeDownload() {
    if (!ytInfo) return;
    setYtError(""); setDownloading(true); setDownloadProgress(0);
    try {
      const formData = new FormData();
      formData.append("url", ytUrl.trim());
      formData.append("max_resolution", "720");
      const resp = await fetch(`${API_BASE}/api/download-youtube`, { method: "POST", body: formData });
      if (!resp.ok) { const body = await resp.json().catch(() => ({})); throw new Error(body.detail || "Download gagal"); }
      const contentLength = Number(resp.headers.get("Content-Length") ?? "0");
      const fileName = resp.headers.get("X-File-Name") ?? "youtube_video.mp4";
      const videoDuration = Number(resp.headers.get("X-Video-Duration") ?? String(ytInfo.duration)) || ytInfo.duration;
      const reader = resp.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); received += value.length;
        if (contentLength > 0) setDownloadProgress(Math.round((received / contentLength) * 100));
        else setDownloadProgress((p) => Math.min(p + 2, 90));
      }
      setDownloadProgress(100);
      const blob = new Blob(chunks as BlobPart[], { type: "video/mp4" });
      onAnalyze(new File([blob], fileName, { type: "video/mp4" }), videoDuration);
    } catch (err: any) {
      setYtError(err.message || "Terjadi kesalahan saat download");
      setDownloading(false); setDownloadProgress(0);
    }
  }

  function clearYoutube() {
    setYtUrl(""); setYtInfo(null); setYtError("");
    setDownloading(false); setDownloadProgress(0);
  }

  function handleModeSwitch(m: Mode) {
    setMode(m); setYtError(""); setFileError("");
  }

  const anyError = error || fileError || ytError;

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(var(--grid-color,rgba(0,0,0,0.06)) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color,rgba(0,0,0,0.06)) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-black dark:border-white text-black dark:text-white text-xs font-mono font-bold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
            ANALISIS AI SIAP
          </span>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-8 w-8 bg-black dark:bg-white flex items-center justify-center">
              <BrandLogo size={14} className="text-white dark:text-black stroke-white dark:stroke-black" />
            </div>
            <h1 className="font-black text-3xl uppercase text-black dark:text-white tracking-widest">
              Try<span className="text-black dark:text-white">Klip</span>
            </h1>
          </div>
          <p className="text-black/50 dark:text-white/50 font-mono text-sm">
            Upload video kamu. AI mendeteksi momen viral. Kamu edit &amp; export.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex border border-black/15 dark:border-white/15 mb-0">
          <button
            type="button"
            onClick={() => handleModeSwitch("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-widest border-r border-black/15 dark:border-white/15 transition-colors ${mode === "upload" ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white bg-transparent"}`}
          >
            <Upload size={13} /> Upload File
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("youtube")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors ${mode === "youtube" ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white bg-transparent"}`}
          >
            <Youtube size={13} /> YouTube Link
          </button>
        </div>

        {/* ── UPLOAD MODE ── */}
        {mode === "upload" && (
          <form onSubmit={handleUploadSubmit} className="border border-t-0 border-black/15 dark:border-white/15 bg-gray-50 dark:bg-black">
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed m-4 p-10 text-center transition-all ${isDragging ? "border-black dark:border-white bg-black/5 dark:bg-white/5" : "border-black/20 dark:border-white/15 hover:border-black/60 dark:hover:border-white/60"}`}
              >
                <input ref={inputRef} type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/avi,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv"
                  onChange={handleInputChange} className="hidden" />
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 flex items-center justify-center border ${isDragging ? "border-black dark:border-white bg-black/10 dark:bg-white/10" : "border-black/20 dark:border-white/15 bg-white dark:bg-black"}`}>
                    {loadingDuration
                      ? <Loader2 size={24} className="text-black dark:text-white animate-spin" />
                      : <Upload size={24} className={isDragging ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"} />}
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold text-black dark:text-white mb-1">
                      {isDragging ? "Lepaskan file di sini" : "Drag & drop video kamu"}
                    </p>
                    <p className="font-mono text-xs text-black/40 dark:text-white/30">
                      atau <span className="text-black dark:text-white underline underline-offset-2">browse file</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-black/30 dark:text-white/30 mt-1">
                    <span>MP4</span><span>·</span><span>WebM</span><span>·</span>
                    <span>MOV</span><span>·</span><span>AVI</span><span>·</span><span>MKV</span>
                  </div>
                  <p className="font-mono text-[10px] text-black/30 dark:text-white/30">Maks. {MAX_SIZE_GB}GB</p>
                </div>
              </div>
            ) : (
              <div className="border border-black/40 dark:border-white/40 bg-black/5 dark:bg-white/5 m-4 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center border border-black/40 dark:border-white/40 bg-black/10 dark:bg-white/10 shrink-0">
                    <Film size={18} className="text-black dark:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-black dark:text-white truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-1 font-mono text-xs text-black/50 dark:text-white/40">
                      <span>{formatBytes(file.size)}</span><span>·</span>
                      {duration !== null && <span className="text-black dark:text-white">{formatDuration(duration)}</span>}
                      <span>·</span><span>{file.type || "video"}</span>
                    </div>
                  </div>
                  <button type="button" onClick={clearFile}
                    className="font-mono text-[10px] uppercase tracking-widest text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white border border-black/10 dark:border-white/10 px-2 py-1 transition-colors">
                    Ganti
                  </button>
                </div>
                {duration !== null && (
                  <div className="mt-3 pt-3 border-t border-black/20 dark:border-white/20 flex items-center gap-2 font-mono text-xs text-black dark:text-white">
                    <CheckCircle2 size={12} />
                    Video siap dianalisis — durasi {formatDuration(duration)}
                  </div>
                )}
              </div>
            )}

            {anyError && (
              <div className="flex items-start gap-3 mx-4 mb-4 p-3 border border-red-400/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-mono text-xs">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{anyError}</span>
              </div>
            )}

            <div className="px-4 pb-4">
              <button
                type="submit"
                disabled={isLoading || !file || !apiKeyOk || duration === null}
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#d1d5db] dark:hover:shadow-[6px_6px_0px_#374151] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none disabled:opacity-40 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? <><Loader2 size={16} className="animate-spin" /> Menganalisis Video...</>
                  : <><Zap size={16} /> Deteksi Momen Viral</>}
              </button>
            </div>
          </form>
        )}

        {/* ── YOUTUBE MODE ── */}
        {mode === "youtube" && (
          <div className="border border-t-0 border-black/15 dark:border-white/15 bg-gray-50 dark:bg-black">
            {/* URL input */}
            <div className="p-4 border-b border-black/10 dark:border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 dark:text-white/30 mb-2">Link YouTube</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/20" />
                  <input
                    type="url"
                    value={ytUrl}
                    onChange={(e) => { setYtUrl(e.target.value); if (ytInfo) setYtInfo(null); if (ytError) setYtError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFetchYoutubeInfo(); } }}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={downloading}
                    className="w-full pl-8 pr-3 py-2.5 border border-black/15 dark:border-white/15 bg-white dark:bg-black font-mono text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/20 focus:outline-none focus:border-black/60 dark:focus:border-white/60 disabled:opacity-50"
                  />
                  {ytUrl && !downloading && (
                    <button type="button" onClick={clearYoutube}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/20 hover:text-black dark:hover:text-white">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleFetchYoutubeInfo}
                  disabled={!ytUrl.trim() || fetchingInfo || downloading || !isValidYoutubeUrl(ytUrl)}
                  className="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black font-mono text-xs uppercase tracking-widest hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center gap-2 shrink-0"
                >
                  {fetchingInfo ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                  Cek
                </button>
              </div>
              <p className="font-mono text-[10px] text-black/30 dark:text-white/20 mt-2">
                Mendukung: youtube.com/watch?v= · youtu.be/ · /shorts/
              </p>
            </div>

            {/* Video info card */}
            {ytInfo && !downloading && (
              <div className="m-4 border border-black/40 dark:border-white/40 bg-black/5 dark:bg-white/5">
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-16 overflow-hidden bg-black/10 shrink-0">
                    <img src={ytInfo.thumbnail} alt="thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-black dark:text-white line-clamp-2 leading-tight mb-1">
                      {ytInfo.title}
                    </p>
                    <div className="flex items-center gap-3 font-mono text-xs text-black/40 dark:text-white/30 flex-wrap">
                      <span className="flex items-center gap-1"><User size={10} /> {ytInfo.author || "YouTube Creator"}</span>
                      <span className="flex items-center gap-1 text-black dark:text-white"><Clock size={10} /> {formatDuration(ytInfo.duration)}</span>
                    </div>
                    {ytInfo.streams && ytInfo.streams.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {ytInfo.streams.slice(-3).reverse().map((s, i) => (
                          <span key={i} className={`font-mono text-[10px] px-2 py-0.5 border ${i === 0 ? "border-black/40 dark:border-white/40 text-black dark:text-white bg-black/10 dark:bg-white/10" : "border-black/10 dark:border-white/10 text-black/40 dark:text-white/30"}`}>
                            {s.resolution}{s.filesize_mb > 0 && ` · ${s.filesize_mb}MB`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button type="button" onClick={handleYoutubeDownload} disabled={isLoading}
                    className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[4px_4px_0px_#d1d5db] dark:shadow-[4px_4px_0px_#374151] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#d1d5db] dark:hover:shadow-[6px_6px_0px_#374151] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none disabled:opacity-40 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed">
                    <Download size={15} /> Download &amp; Analisis (max 720p)
                  </button>
                </div>
              </div>
            )}

            {/* Download progress */}
            {downloading && (
              <div className="m-4 border border-black/40 dark:border-white/40 bg-black/5 dark:bg-white/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 border border-black/40 dark:border-white/40 bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <Youtube size={16} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-black dark:text-white truncate">
                      {ytInfo?.title ?? "Mengunduh video…"}
                    </p>
                    <p className="font-mono text-xs text-black/40 dark:text-white/30 mt-0.5">
                      {downloadProgress < 100
                        ? `Mengunduh dari server… ${downloadProgress > 0 ? `${downloadProgress}%` : ""}`
                        : "Selesai, memproses…"}
                    </p>
                  </div>
                </div>
                <div className="h-1.5 bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-black dark:bg-white transition-all duration-300"
                    style={{ width: `${downloadProgress || 5}%` }} />
                </div>
              </div>
            )}

            {/* Error */}
            {(ytError || error) && (
              <div className="flex items-start gap-3 mx-4 mb-4 p-3 border border-red-400/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-mono text-xs">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{ytError || error}</span>
              </div>
            )}

            {isLoading && !downloading && (
              <div className="flex items-center justify-center gap-3 py-4 font-mono text-sm text-black/50 dark:text-white/40">
                <Loader2 size={15} className="animate-spin text-black dark:text-white" />
                Menganalisis video…
              </div>
            )}
          </div>
        )}

        {/* Info footer */}
        <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/8">
          <div className="flex flex-col gap-2.5">
            {(mode === "upload"
              ? [
                "Video dianalisis AI berdasarkan durasi dan nama file — tidak perlu koneksi internet.",
                "File video disimpan di browser IndexedDB kamu — tidak diupload ke server sampai Export.",
                "Auto-subtitle menggunakan OpenAI Whisper — 3 kata per subtitle, tersinkronisasi otomatis.",
                `Format didukung: MP4, WebM, MOV, AVI, MKV (maks. ${MAX_SIZE_GB}GB).`,
              ]
              : [
                "Video YouTube akan diunduh ke server lalu dikirim ke browsermu (maks. resolusi 720p).",
                "Setelah download, video disimpan di IndexedDB browser — tidak perlu upload ulang saat Export.",
                "Video privat, age-restricted, atau yang dinonaktifkan embed-nya tidak bisa diunduh.",
              ]
            ).map((text, i) => (
              <div key={i} className="flex items-start gap-2 font-mono text-xs text-black/40 dark:text-white/25">
                <span className="text-black dark:text-white shrink-0">›</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}