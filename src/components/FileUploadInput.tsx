// /Users/haimac/Project/clipper-ai-fe/src/components/FileUploadInput.tsx
// src/components/FileUploadInput.tsx
import { useState, useRef, useCallback } from "react";
import { Upload, Zap, AlertCircle, Loader2, Film, CheckCircle2 } from "lucide-react";
import { isApiKeyConfigured } from "../lib/storage";

interface Props {
  onAnalyze: (file: File, duration: number) => void;
  isLoading: boolean;
  error?: string;
}

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/mov", "video/quicktime", "video/avi", "video/x-matroska"];
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

export default function FileUploadInput({ onAnalyze, isLoading, error }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError]   = useState("");
  const [loadingDuration, setLoadingDuration] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || duration === null) return;
    onAnalyze(file, duration);
  }

  function clearFile() {
    setFile(null);
    setDuration(null);
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow orbs */}
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
            className="text-5xl font-black text-black tracking-tight mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            AI Viral{" "}
            <span className="text-[#1ABC71]">
              Clipper
            </span>
          </h1>
          <p className="text-gray-600 text-base">
            Upload video kamu. AI mendeteksi momen viral. Kamu edit &amp; export.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Drop zone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center
                ${isDragging
                  ? "border-[#1ABC71]/70 bg-[#1ABC71]/5 scale-[1.01]"
                  : "border-gray-300 bg-gray-50 hover:border-[#1ABC71]/50 hover:bg-gray-100"
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
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                  ${isDragging ? "bg-[#1ABC71]/20" : "bg-gray-100"}`}>
                  {loadingDuration
                    ? <Loader2 size={28} className="text-[#1ABC71] animate-spin" />
                    : <Upload size={28} className={isDragging ? "text-[#1ABC71]" : "text-gray-400"} />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {isDragging ? "Lepaskan file di sini" : "Drag & drop video kamu"}
                  </p>
                  <p className="text-xs text-gray-500">
                    atau <span className="text-[#1ABC71] underline">browse file</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono mt-1">
                  <span>MP4</span><span>·</span>
                  <span>WebM</span><span>·</span>
                  <span>MOV</span><span>·</span>
                  <span>AVI</span><span>·</span>
                  <span>MKV</span>
                </div>
                <p className="text-[10px] text-gray-400">Maks. {MAX_SIZE_GB}GB</p>
              </div>
            </div>
          ) : (
            /* File selected preview */
            <div className="rounded-2xl border border-[#1ABC71]/30 bg-[#1ABC71]/5 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1ABC71]/10 border border-[#1ABC71]/20 flex items-center justify-center shrink-0">
                  <Film size={22} className="text-[#1ABC71]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black truncate">{file.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-mono">
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
                  className="text-gray-500 hover:text-black transition-colors text-xs px-2 py-1 rounded-lg hover:bg-gray-100"
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

          {/* Errors */}
          {(error || fileError) && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error || fileError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !file || !apiKeyOk || duration === null}
            className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider bg-[#1ABC71] text-white hover:bg-[#16a085] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#1ABC71]/20"
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
              </>
            )}
          </button>
        </form>

        {/* Info note */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col gap-3 text-xs text-gray-500">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#1ABC71]/50 mt-1.5 shrink-0" />
              <span>Video dianalisis AI berdasarkan durasi dan nama file — tidak perlu koneksi internet untuk video itu sendiri.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#1ABC71]/50 mt-1.5 shrink-0" />
              <span>File video disimpan di browser IndexedDB kamu — tidak diupload ke server sampai kamu klik Export.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#1ABC71]/50 mt-1.5 shrink-0" />
              <span>Format didukung: MP4, WebM, MOV, AVI, MKV (maks. {MAX_SIZE_GB}GB).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}