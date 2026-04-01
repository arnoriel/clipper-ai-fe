// src/lib/AI.ts
import { getToken } from "./Auth";

const API_BASE = import.meta.env.VITE_API_BASE;

export interface ViralMoment {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  reason: string;
  viralScore: number;
  category: "funny" | "emotional" | "educational" | "shocking" | "satisfying" | "drama" | "highlight";
}

export interface VideoAnalysisResult {
  moments: ViralMoment[];
  summary: string;
  totalViralPotential: number;
  credits_remaining?: number;
}

export interface VideoFileInfo {
  fileName: string;
  fileSize: number;
  duration: number;
  mimeType: string;
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Detect viral moments — requires auth + deducts 1 credit ────────────────
export async function detectViralMomentsFromFile(
  videoInfo: VideoFileInfo,
  _apiKey: string,
  onProgress?: (msg: string) => void,
  numClips: number = 5
): Promise<VideoAnalysisResult> {
  onProgress?.("Mengirim metadata video ke server AI...");

  const clampedClips = Math.min(Math.max(Math.round(numClips), 1), 7);

  const form = new FormData();
  form.append("file_name",  videoInfo.fileName);
  form.append("file_size",  String(videoInfo.fileSize));
  form.append("duration",   String(videoInfo.duration));
  form.append("mime_type",  videoInfo.mimeType);
  form.append("num_clips",  String(clampedClips));

  onProgress?.(`AI sedang menganalisis dan memilih ${clampedClips} momen viral terbaik...`);

  const resp = await fetch(`${API_BASE}/api/analyze-video`, {
    method:  "POST",
    headers: authHeader(),
    body:    form,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    if (resp.status === 402) {
      throw new Error("INSUFFICIENT_CREDITS");
    }
    throw new Error(err.detail || err.error || `Server error ${resp.status}`);
  }

  onProgress?.("Memproses respons AI...");
  return resp.json();
}

// ─── Generate clip title & caption ──────────────────────────────────────────
export async function generateClipContent(
  moment: ViralMoment,
  videoFileName: string,
  _apiKey: string,
): Promise<{ titles: string[]; captions: string[]; hashtags: string[] }> {
  const form = new FormData();
  form.append("moment_label",    moment.label);
  form.append("moment_category", moment.category);
  form.append("moment_reason",   moment.reason);
  form.append("start_time",      String(moment.startTime));
  form.append("end_time",        String(moment.endTime));
  form.append("video_file_name", videoFileName);

  const resp = await fetch(`${API_BASE}/api/generate-clip-content`, {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || "Gagal generate konten clip");
  }

  return resp.json();
}

// ─── Utility ─────────────────────────────────────────────────────────────────
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function validateApiKey(_key: string): boolean {
  return true;
}
