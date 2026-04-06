// src/components/FileUploadInput.tsx
// Modified: adds Auto Edit / Manual Edit tab switcher after file selection.
// Auto Edit tab embeds AutoEditPanel (template configuration).
// Manual Edit tab shows the original "Deteksi Momen Viral" button.

import { useState, useRef, useCallback } from "react";
import {
  Upload, Zap, AlertCircle, Loader2, Film, CheckCircle2,
  CreditCard, Wand2, PenLine, Youtube,
} from "lucide-react";
import { isApiKeyConfigured } from "../lib/storage";
import AutoEditPanel from "./AutoEditPanel";
import type { ClipTemplate } from "../lib/templates";

// ΓöÇΓöÇΓöÇ Props ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

interface Props {
  /** Manual flow: analyze video without template */
  onAnalyze: (file: File, duration: number, numClips: number) => void;
  /** Auto flow: analyze + apply template to all clips automatically */
  onAutoGenerate: (
    file: File,
    duration: number,
    template: ClipTemplate,
    watermarkSrc: string | null,
    numClips: number
  ) => Promise<void>;
  isLoading: boolean;
  error?: string;
  credits?: number;
  onTopUpClick?: () => void;
}

// ΓöÇΓöÇΓöÇ Constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const ACCEPTED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/mov",
  "video/quicktime",
  "video/avi",
  "video/x-matroska",
];
const MAX_SIZE_GB = 4;
const MAX_SIZE_BYTES = MAX_SIZE_GB * 1024 * 1024 * 1024;

// ΓöÇΓöÇΓöÇ Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ΓöÇΓöÇΓöÇ Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default function FileUploadInput({
  onAnalyze,
  onAutoGenerate,
  isLoading,
  error,
  credits,
  onTopUpClick,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [loadingDuration, setLoadingDuration] = useState(false);
  /** Which tab is active once a file is selected */
  const [editMode, setEditMode] = useState<"auto" | "manual">("auto");
  /** How many clips the AI should generate (1–7) */
  const [numClips, setNumClips] = useState(5);

  const inputRef = useRef<HTMLInputElement>(null);

  const apiKeyOk = isApiKeyConfigured();
  const creditsDisplay = credits ?? 0;
  const hasCredits = creditsDisplay > 0;
  const noCredits = !hasCredits && credits !== undefined;

  // ΓöÇΓöÇ File validation ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Gagal membaca metadata video"));
      };
      video.src = url;
    });
  }

  async function processFile(f: File) {
    setFileError("");
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      return;
    }
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
    setFile(null);
    setDuration(null);
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  // ΓöÇΓöÇ Submit handlers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || duration === null) return;
    if (!hasCredits) {
      onTopUpClick?.();
      return;
    }
    onAnalyze(file, duration, numClips);
  }

  async function handleAutoGenerate(
    template: ClipTemplate,
    watermarkSrc: string | null
  ) {
    if (!file || duration === null) return;
    await onAutoGenerate(file, duration, template, watermarkSrc, numClips);
  }

  // ΓöÇΓöÇΓöÇ Render ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#000000]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#000000]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-7 md:mb-9">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#000000]/10 border border-[#000000]/20 text-[#000000] text-xs font-mono mb-5">
            <Zap size={12} className="fill-[#000000] text-[#000000]" />
            POWERED BY COBAMULAI
          </div>
          <h1
            className="text-4xl md:text-5xl font-black text-black tracking-tight mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            AI Viral <span className="text-[#000000]">Clipper</span>
          </h1>
          <p className="text-gray-600 text-sm md:text-base px-2">
            Upload video kamu. AI mendeteksi momen viral. Kamu edit, auto-subtitle
            &amp; export.
          </p>
        </div>

        {/* Credits display */}
        {credits !== undefined && (
          <div
            className={`mb-5 flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all ${
              noCredits
                ? "bg-red-50 border-red-200"
                : creditsDisplay <= 3
                ? "bg-orange-50 border-orange-200"
                : "bg-[#000000]/5 border-[#000000]/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  noCredits
                    ? "bg-red-100 text-red-500"
                    : creditsDisplay <= 3
                    ? "bg-orange-100 text-orange-500"
                    : "bg-[#000000]/15 text-[#000000]"
                }`}
              >
                <CreditCard size={18} />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${
                    noCredits
                      ? "text-red-700"
                      : creditsDisplay <= 3
                      ? "text-orange-700"
                      : "text-gray-800"
                  }`}
                >
                  {noCredits
                    ? "Kredit habis"
                    : creditsDisplay <= 3
                    ? `Kredit hampir habis: ${creditsDisplay} tersisa`
                    : `${creditsDisplay} credit tersisa`}
                </p>
                <p
                  className={`text-xs ${
                    noCredits
                      ? "text-red-500"
                      : creditsDisplay <= 3
                      ? "text-orange-500"
                      : "text-gray-400"
                  }`}
                >
                  {noCredits
                    ? "Top up untuk mulai analisis video"
                    : "1 analisis = 1 cr ┬╖ 1 auto-subtitle = 1 cr"}
                </p>
              </div>
            </div>
            <button
              onClick={onTopUpClick}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                noCredits
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-[#000000] text-white hover:bg-[#16a085]"
              }`}
            >
              <Zap size={12} />
              Top Up
            </button>
          </div>
        )}

        {/* Session warning */}
        <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-black-50 border border-black-200 text-black-800 text-xs leading-relaxed">
          <div>
            <p className="font-semibold mb-1">
              Selesaikan sesi editing sebelum pergi
            </p>
            <p className="text-black-700">
              Setelah upload video,{" "}
              <strong>jangan kembali ke halaman Upload</strong> sampai kamu
              selesai export clip. Mengulang dari awal akan memotong kredit
              lagi.
            </p>
          </div>
        </div>

        {/* ΓöÇΓöÇ File drop zone ΓöÇΓöÇ */}
        {!file ? (
          <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8 md:p-10 text-center ${
              isDragging
                ? "border-[#000000]/70 bg-[#000000]/5 scale-[1.01]"
                : "border-gray-300 bg-gray-50 hover:border-[#000000]/50 hover:bg-gray-100"
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
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragging ? "bg-[#000000]/20" : "bg-gray-100"
                }`}
              >
                {loadingDuration ? (
                  <Loader2 size={26} className="text-[#000000] animate-spin" />
                ) : (
                  <Upload
                    size={26}
                    className={isDragging ? "text-[#000000]" : "text-gray-400"}
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {isDragging ? (
                    "Lepaskan file di sini"
                  ) : (
                    <>
                      <span className="hidden md:inline">
                        Drag &amp; drop video kamu
                      </span>
                      <span className="md:hidden">Tap untuk pilih video</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="hidden md:inline">atau </span>
                  <span className="text-[#000000] underline">
                    <span className="hidden md:inline">browse file</span>
                    <span className="md:hidden">
                      Pilih dari galeri / file manager
                    </span>
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-1 flex-wrap justify-center">
                <span>MP4</span>
                <span>┬╖</span>
                <span>WebM</span>
                <span>┬╖</span>
                <span>MOV</span>
                <span>┬╖</span>
                <span>AVI</span>
                <span>┬╖</span>
                <span>MKV</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Maks. {MAX_SIZE_GB}GB
              </p>
            </div>
          </div>
          {/* ── YouTube Download button ── */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href="https://app.ytdown.to/en23/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 active:scale-[0.99] transition-all shadow-md shadow-red-500/20"
            >
              <Youtube size={15} />
              Download Video dari Link YouTube
            </a>
          </div>
          </>
        ) : (
          /* ΓöÇΓöÇ File selected: info chip ΓöÇΓöÇ */
          <div className="rounded-2xl border border-[#000000]/30 bg-[#000000]/5 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#000000]/10 border border-[#000000]/20 flex items-center justify-center shrink-0">
                <Film size={20} className="text-[#000000]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">
                  {file!.name}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-mono flex-wrap">
                  <span>{formatBytes(file!.size)}</span>
                  <span>┬╖</span>
                  {duration !== null && (
                    <span className="text-[#000000]">
                      {formatDuration(duration)}
                    </span>
                  )}
                  <span>┬╖</span>
                  <span>{file!.type || "video"}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-500 hover:text-black transition-colors text-xs px-2 py-1.5 rounded-lg hover:bg-gray-100 shrink-0"
              >
                Ganti
              </button>
            </div>
            {duration !== null && (
              <div className="mt-3 pt-3 border-t border-[#000000]/15 flex items-center gap-2 text-xs text-[#000000]">
                <CheckCircle2 size={12} />
                <span>
                  Video siap durasi {formatDuration(duration)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ΓöÇΓöÇ Error banners ΓöÇΓöÇ */}
        {(error || fileError) && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <span>{error || fileError}</span>
              {(error?.includes("Kredit") ||
                error?.includes("credit")) &&
                onTopUpClick && (
                  <button
                    type="button"
                    onClick={onTopUpClick}
                    className="ml-2 underline font-semibold hover:no-underline"
                  >
                    Top Up Sekarang
                  </button>
                )}
            </div>
          </div>
        )}

        {/* ΓöÇΓöÇ Edit mode tabs (only shown after file is selected) ΓöÇΓöÇ */}
        {file && duration !== null && (
          <div className="mt-4 space-y-3">
            {/* ── Jumlah Clip Slider ── */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Film size={13} className="text-[#000000]" />
                  <span className="text-xs font-semibold text-gray-700">
                    Jumlah Clip yang Digenerate
                  </span>
                </div>
                <span className="text-sm font-black text-[#000000] tabular-nums">
                  {numClips} clip
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={numClips}
                onChange={(e) => setNumClips(+e.target.value)}
                className="w-full accent-[#000000] h-1.5 cursor-pointer"
              />
              <div className="flex justify-between mt-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumClips(n)}
                    className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      numClips === n
                        ? "bg-[#000000] text-white"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                AI akan memilih {numClips} momen terbaik berpotensi viral
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 p-1 gap-1">
              <button
                onClick={() => setEditMode("auto")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  editMode === "auto"
                    ? "bg-[#000000] text-white shadow"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                }`}
              >
                <Wand2 size={13} />
                Auto Edit
              </button>
              <button
                onClick={() => setEditMode("manual")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  editMode === "manual"
                    ? "bg-[#000000] text-white shadow"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                }`}
              >
                <PenLine size={13} />
                Manual Edit
              </button>
            </div>

            {/* ΓöÇΓöÇ AUTO EDIT tab content ΓöÇΓöÇ */}
            {editMode === "auto" && (
              <div>
                {/* Explanation */}
                <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-700 mb-3">
                  <Wand2 size={12} className="shrink-0 mt-0.5 text-purple-500" />
                  <p>
                    Atur template sekali, klik <strong>Generate Videos</strong>.
                    AI akan analisis video, pilih semua momen, lalu terapkan
                    crop, subtitle, dan watermark ke setiap clip secara otomatis
                    ΓÇö semuanya siap export.
                  </p>
                </div>
                <AutoEditPanel
                  credits={creditsDisplay}
                  onGenerate={handleAutoGenerate}
                  onTopUpClick={onTopUpClick}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* ΓöÇΓöÇ MANUAL EDIT tab content ΓöÇΓöÇ */}
            {editMode === "manual" && (
              <form onSubmit={handleManualSubmit} className="space-y-3">
                {/* Explanation */}
                <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700">
                  <PenLine size={12} className="shrink-0 mt-0.5 text-blue-500" />
                  <p>
                    AI analisis video dan tampilkan daftar momen viral. Kamu
                    bisa pilih momen yang ingin diedit, atur subtitle, crop,
                    dan watermark satu per satu secara manual.
                  </p>
                </div>

                {noCredits ? (
                  <button
                    type="button"
                    onClick={onTopUpClick}
                    className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/20"
                  >
                    <CreditCard size={18} /> Top Up Credit untuk Mulai
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || !file || !apiKeyOk || duration === null}
                    className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider bg-[#000000] text-white hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#000000]/20 active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Menganalisis Video...
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        Deteksi Momen Viral
                        <span className="opacity-60 font-normal text-xs">
                          (ΓêÆ1 credit)
                        </span>
                      </>
                    )}
                  </button>
                )}
              </form>
            )}
          </div>
        )}

        {/* Info footer */}
        <div className="mt-6 pt-5 border-t border-gray-200">
          <div className="flex flex-col gap-2.5 text-xs text-gray-500">
            {[
              "Auto Edit: 1 cr analisis + 1 cr per clip subtitle. Export gratis.",
              "Manual Edit: 1 cr analisis, edit tiap clip sendiri.",
              "File disimpan di IndexedDB browser ΓÇö tidak diupload ke server sampai Export.",
              `Format: MP4, WebM, MOV, AVI, MKV (maks. ${MAX_SIZE_GB}GB).`,
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#000000]/50 mt-1.5 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
