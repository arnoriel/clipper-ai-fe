// src/lib/storage.ts
// Local storage for project metadata (localStorage)
// Video blobs stored in IndexedDB via src/lib/videoDB.ts

import type { ViralMoment, VideoAnalysisResult } from "./AI";

export interface TextOverlay {
  id: string;
  text: string;
  x: number;       // 0-1 normalized
  y: number;       // 0-1 normalized
  fontSize: number;
  color: string;
  startSec: number | null;
  endSec: number | null;
  bold: boolean;
}

export interface SubtitleWord {
  id: string;
  word: string;                // actual word text (e.g., "halo", "dunia")
  startTime: number;           // seconds from clip start (e.g., 1.234)
  endTime: number;             // seconds from clip start (e.g., 1.567)
  isKeyword: boolean;          // true if AI detected as important keyword
  emoji: string | null;        // emoji character if AI assigned (e.g., "🔥", "😂")
  color: string;               // hex color: "#FFFFFF" for normal, "#FFD700" for keywords
}

export interface ClipEdits {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3" | "original";
  textOverlays: TextOverlay[];
  subtitles: SubtitleWord[];   // auto-generated per-word subtitles
  brightness: number;   // -1 to 1
  contrast: number;     // -1 to 1
  saturation: number;   // -1 to 1
  speed: number;        // 0.5 | 1 | 1.5 | 2
  trimStart: number;    // offset from moment.startTime
  trimEnd: number;      // offset from moment.endTime (negative)
}

export interface ProjectClip {
  momentId: string;
  moment: ViralMoment;
  edits: ClipEdits;
  exportedUrl?: string;
}

export interface Project {
  id: string;

  // Source file info (replacing YouTube fields)
  videoFileName: string;   // original file name e.g. "my-video.mp4"
  videoFileSize: number;   // bytes
  videoMimeType: string;   // e.g. "video/mp4"
  videoDuration: number;   // seconds

  /**
   * Ephemeral blob URL (from IndexedDB, valid for current session only).
   * NOT persisted in localStorage.
   */
  localVideoUrl?: string;

  analysisResult: VideoAnalysisResult;
  selectedClips: ProjectClip[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "ai_clipper_projects_v2";

// ─── API Key ──────────────────────────────────────────────────────────────────
export function getApiKey(): string {
  return import.meta.env.VITE_OPENROUTER_API_KEY ?? "";
}

export function isApiKeyConfigured(): boolean {
  const key = getApiKey();
  return key.startsWith("sk-or-") && key.length > 20;
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const projects: Project[] = JSON.parse(raw);
    return projects.map((p) => ({ ...p, localVideoUrl: undefined }));
  } catch {
    return [];
  }
}

export function saveProject(project: Project) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  const toSave: Project = { ...project, localVideoUrl: undefined };
  if (idx >= 0) projects[idx] = toSave;
  else projects.unshift(toSave);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 20)));
}

export function deleteProject(id: string) {
  const projects = loadProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id: string): Project | null {
  return loadProjects().find((p) => p.id === id) || null;
}

// ─── Default edits ────────────────────────────────────────────────────────────
export function defaultEdits(): ClipEdits {
  return {
    cropX: 0, cropY: 0, cropW: 1, cropH: 1,
    aspectRatio: "original",
    textOverlays: [],
    subtitles: [],
    brightness: 0, contrast: 0, saturation: 0,
    speed: 1,
    trimStart: 0, trimEnd: 0,
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}