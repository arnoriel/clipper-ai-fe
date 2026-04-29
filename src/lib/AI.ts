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

// Progress callback with real percentage + stage info
export type ProgressCallback = (pct: number, stage: string, msg: string) => void;

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Read SSE stream from a fetch response body ──────────────────────────────
async function* readSSE(response: Response): AsyncGenerator<Record<string, unknown>> {
  const reader  = response.body!.getReader();
  const decoder = new TextDecoder();
  let   buffer  = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const json = trimmed.slice(5).trim();
      if (!json) continue;
      try {
        yield JSON.parse(json) as Record<string, unknown>;
      } catch {
        // skip malformed line
      }
    }
  }
}

// ─── Detect viral moments via SSE progress stream ────────────────────────────
// Calls /api/analyze-video-stream which emits:
//   {"type":"progress","pct":N,"stage":"loading|analyzing|processing|done","msg":"..."}
//   {"type":"result","data":{...VideoAnalysisResult}}
//   {"type":"error","code":"...","msg":"..."}
export async function detectViralMomentsFromFile(
  videoInfo:   VideoFileInfo,
  _apiKey:     string,
  onProgress?: ProgressCallback,
  numClips:    number = 5,
): Promise<VideoAnalysisResult> {
  const clampedClips = Math.min(Math.max(Math.round(numClips), 1), 7);

  const form = new FormData();
  form.append("file_name", videoInfo.fileName);
  form.append("file_size", String(videoInfo.fileSize));
  form.append("duration",  String(videoInfo.duration));
  form.append("mime_type", videoInfo.mimeType);
  form.append("num_clips", String(clampedClips));

  // Show overlay immediately
  onProgress?.(2, "loading", "Loading AI...");

  const resp = await fetch(`${API_BASE}/api/analyze-video-stream`, {
    method:  "POST",
    headers: authHeader(),
    body:    form,
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({})) as { detail?: string; error?: string };
    if (resp.status === 402) throw new Error("INSUFFICIENT_CREDITS");
    throw new Error((err.detail ?? err.error) || `Server error ${resp.status}`);
  }

  for await (const event of readSSE(resp)) {
    const type = event.type as string;

    if (type === "progress") {
      onProgress?.(event.pct as number, event.stage as string, event.msg as string);
    } else if (type === "result") {
      return event.data as VideoAnalysisResult;
    } else if (type === "error") {
      const code = event.code as string | undefined;
      const msg  = event.msg  as string;
      if (code === "INSUFFICIENT_CREDITS") throw new Error("INSUFFICIENT_CREDITS");
      throw new Error(msg || "Server error");
    }
  }

  throw new Error("Stream ended without result");
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
    body:   form,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? "Gagal generate konten clip");
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
