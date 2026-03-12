// src/lib/storage.ts
import type { ViralMoment, VideoAnalysisResult } from "./AI";

// ─── Motion Tracking Types ────────────────────────────────────────────────────

/** A single keyframe in the motion tracking path (normalized coords 0-1). */
export interface MotionKeyframe {
  t:  number; // time in seconds, relative to clip start
  cx: number; // normalized center x  (0 = left edge, 1 = right edge)
  cy: number; // normalized center y  (0 = top  edge, 1 = bottom edge)
}

/** Result returned by the /api/analyze-motion endpoint. */
export interface MotionAnalysisResult {
  /** True when significant movement was detected → dynamic crop will be applied */
  hasTracking: boolean;
  /** True when a person is found but stays in one place → single static crop center */
  isStatic:    boolean;
  /** Keyframe list (multiple entries = tracking; single entry = static center) */
  keyframes:   MotionKeyframe[] | null;
  /** Crop window dimensions in pixels (same aspect ratio as requested) */
  cropW?:      number;
  cropH?:      number;
  /** Source video natural dimensions (needed by the export filter) */
  vidW?:       number;
  vidH?:       number;
  /** Human-readable status message */
  message:     string;
  /** False when opencv-python-headless is not installed on the server */
  available:   boolean;
}

// ─── Supported subtitle fonts ─────────────────────────────────────────────────
export interface SubtitleFont {
  name: string;
  category: "sans-serif" | "display" | "handwriting" | "serif" | "monospace";
  weights: ("400" | "700")[];
}

export const SUBTITLE_FONTS: SubtitleFont[] = [
  // Sans-serif
  { name: "Roboto",          category: "sans-serif",  weights: ["400", "700"] },
  { name: "Inter",           category: "sans-serif",  weights: ["400", "700"] },
  { name: "Open Sans",       category: "sans-serif",  weights: ["400", "700"] },
  { name: "Poppins",         category: "sans-serif",  weights: ["400", "700"] },
  { name: "Montserrat",      category: "sans-serif",  weights: ["400", "700"] },
  { name: "Nunito",          category: "sans-serif",  weights: ["400", "700"] },
  { name: "Raleway",         category: "sans-serif",  weights: ["400", "700"] },
  // Display / Impact
  { name: "Oswald",          category: "display",     weights: ["400", "700"] },
  { name: "Bebas Neue",      category: "display",     weights: ["400"] },
  { name: "Anton",           category: "display",     weights: ["400"] },
  { name: "Bangers",         category: "display",     weights: ["400"] },
  { name: "Righteous",       category: "display",     weights: ["400"] },
  { name: "Black Ops One",   category: "display",     weights: ["400"] },
  // Handwriting
  { name: "Pacifico",        category: "handwriting", weights: ["400"] },
  { name: "Dancing Script",  category: "handwriting", weights: ["400", "700"] },
  { name: "Caveat",          category: "handwriting", weights: ["400", "700"] },
  // Serif
  { name: "Playfair Display",category: "serif",       weights: ["400", "700"] },
  { name: "Merriweather",    category: "serif",       weights: ["400", "700"] },
  { name: "Lora",            category: "serif",       weights: ["400", "700"] },
  // Monospace
  { name: "Source Code Pro", category: "monospace",   weights: ["400", "700"] },
  { name: "Space Mono",      category: "monospace",   weights: ["400", "700"] },
];

export const DEFAULT_FONT = "Montserrat";

// ─── Google Fonts loader ──────────────────────────────────────────────────────
let _fontsLoaded = false;

export function loadAllSubtitleFonts(): void {
  if (_fontsLoaded) return;
  _fontsLoaded = true;

  const families = SUBTITLE_FONTS.map((f) => {
    const name  = f.name.replace(/ /g, "+");
    const wghts = f.weights.join(";");
    return `family=${name}:wght@${wghts}`;
  }).join("&");

  const id = "subtitle-google-fonts";
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id   = id;
  link.rel  = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
}

// ─── TextOverlay ──────────────────────────────────────────────────────────────
export interface TextOverlay {
  id: string;
  text: string;

  // Position (normalised 0–1)
  x: number;
  y: number;

  // Typography
  fontSize:      number;
  fontFamily:    string;
  color:         string;
  bold:          boolean;
  italic:        boolean;
  uppercase:     boolean;
  textAlign:     "left" | "center" | "right";
  letterSpacing: number;
  lineHeight:    number;

  // Opacity
  opacity: number;

  // Text outline / stroke
  outlineWidth: number;
  outlineColor: string;

  // Drop shadow
  shadowEnabled: boolean;
  shadowColor:   string;
  shadowX:       number;
  shadowY:       number;
  shadowBlur:    number;

  // Background box
  backgroundEnabled: boolean;
  backgroundColor:   string;
  backgroundOpacity: number;
  backgroundPadding: number;

  // Timeline (relative to clip start, in seconds)
  startSec: number | null;
  endSec:   number | null;

  // Auto-subtitle marker
  isAutoSubtitle?: boolean;
}

// ─── Subtitle style presets ───────────────────────────────────────────────────
export interface SubtitlePreset {
  id:          string;
  name:        string;
  description: string;
  emoji:       string;
  overrides:   Partial<TextOverlay>;
  previewBg:   string;
  previewText: string;
  previewAccent: string;
}

export const SUBTITLE_PRESETS: SubtitlePreset[] = [
  {
    id: "bold-impact", name: "Bold Impact",
    description: "Thick white text, black outline. Maximum legibility.",
    emoji: "💥", previewBg: "#111", previewText: "#ffffff", previewAccent: "#ffffff",
    overrides: {
      fontFamily: "Montserrat", fontSize: 52, color: "#FFFFFF",
      bold: true, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 1, opacity: 1, outlineWidth: 4, outlineColor: "#000000",
      shadowEnabled: true, shadowColor: "#000000", shadowX: 3, shadowY: 3, shadowBlur: 10,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "tiktok-yellow", name: "TikTok Yellow",
    description: "Bold yellow on a dark pill — iconic short-form style.",
    emoji: "⚡", previewBg: "#0a0a0a", previewText: "#FFE600", previewAccent: "#FFE600",
    overrides: {
      fontFamily: "Montserrat", fontSize: 48, color: "#FFE600",
      bold: true, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 2, opacity: 1, outlineWidth: 0, shadowEnabled: false,
      backgroundEnabled: true, backgroundColor: "#000000", backgroundOpacity: 0.75,
      backgroundPadding: 16, x: 0.5, y: 0.82,
    },
  },
  {
    id: "neon-green", name: "Neon Green",
    description: "Brand-green glow with heavy shadow for depth.",
    emoji: "🟢", previewBg: "#0a0a0a", previewText: "#1ABC71", previewAccent: "#1ABC71",
    overrides: {
      fontFamily: "Oswald", fontSize: 50, color: "#1ABC71",
      bold: true, italic: false, uppercase: false, textAlign: "center",
      letterSpacing: 1, opacity: 1, outlineWidth: 0,
      shadowEnabled: true, shadowColor: "#1ABC71", shadowX: 0, shadowY: 0, shadowBlur: 18,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "clean-white", name: "Clean White",
    description: "Minimal white text with subtle shadow. Timeless.",
    emoji: "🤍", previewBg: "#333", previewText: "#ffffff", previewAccent: "#cccccc",
    overrides: {
      fontFamily: "Poppins", fontSize: 40, color: "#FFFFFF",
      bold: false, italic: false, uppercase: false, textAlign: "center",
      letterSpacing: 0, opacity: 1, outlineWidth: 0,
      shadowEnabled: true, shadowColor: "#000000", shadowX: 1, shadowY: 2, shadowBlur: 12,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "cinematic", name: "Cinematic",
    description: "Wide-spaced uppercase with a black letterbox bar.",
    emoji: "🎬", previewBg: "#000", previewText: "#f5f5f5", previewAccent: "#888888",
    overrides: {
      fontFamily: "Bebas Neue", fontSize: 44, color: "#F5F5F5",
      bold: false, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 6, opacity: 1, outlineWidth: 0, shadowEnabled: false,
      backgroundEnabled: true, backgroundColor: "#000000", backgroundOpacity: 0.85,
      backgroundPadding: 20, x: 0.5, y: 0.82,
    },
  },
  {
    id: "fire-orange", name: "Fire Orange",
    description: "High-energy orange. Perfect for hype and reaction clips.",
    emoji: "🔥", previewBg: "#111", previewText: "#FF6B35", previewAccent: "#FF6B35",
    overrides: {
      fontFamily: "Anton", fontSize: 54, color: "#FF6B35",
      bold: false, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 2, opacity: 1, outlineWidth: 3, outlineColor: "#000000",
      shadowEnabled: true, shadowColor: "#FF3D00", shadowX: 0, shadowY: 0, shadowBlur: 20,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "pastel-pop", name: "Pastel Pop",
    description: "Soft pink with rounded feel. Great for lifestyle content.",
    emoji: "🌸", previewBg: "#2a1a2e", previewText: "#FFB3D9", previewAccent: "#FFB3D9",
    overrides: {
      fontFamily: "Nunito", fontSize: 44, color: "#FFB3D9",
      bold: true, italic: false, uppercase: false, textAlign: "center",
      letterSpacing: 0, opacity: 1, outlineWidth: 0,
      shadowEnabled: true, shadowColor: "#5C0040", shadowX: 2, shadowY: 3, shadowBlur: 14,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "retro-box", name: "Retro Box",
    description: "Bold text in a solid colored block. Retro energy.",
    emoji: "📺", previewBg: "#1a1a2e", previewText: "#000000", previewAccent: "#F7D716",
    overrides: {
      fontFamily: "Bangers", fontSize: 48, color: "#000000",
      bold: false, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 3, opacity: 1, outlineWidth: 0, shadowEnabled: false,
      backgroundEnabled: true, backgroundColor: "#F7D716", backgroundOpacity: 1,
      backgroundPadding: 14, x: 0.5, y: 0.82,
    },
  },
];

export function getPresetById(id: string): SubtitlePreset | undefined {
  return SUBTITLE_PRESETS.find((p) => p.id === id);
}

export function applyPresetToOverlay(
  overlay: TextOverlay,
  preset: SubtitlePreset,
): TextOverlay {
  return { ...overlay, ...preset.overrides };
}

// ─── Default overlay factory ──────────────────────────────────────────────────
export function defaultTextOverlay(partial?: Partial<TextOverlay>): TextOverlay {
  return {
    id: generateId(),
    text: "",
    x: 0.5,
    y: 0.82,
    fontSize: 48,
    fontFamily: DEFAULT_FONT,
    color: "#FFFFFF",
    bold: true,
    italic: false,
    uppercase: false,
    textAlign: "center",
    letterSpacing: 0,
    lineHeight: 1.2,
    opacity: 1,
    outlineWidth: 3,
    outlineColor: "#000000",
    shadowEnabled: true,
    shadowColor: "#000000",
    shadowX: 2,
    shadowY: 2,
    shadowBlur: 8,
    backgroundEnabled: false,
    backgroundColor: "#000000",
    backgroundOpacity: 0.6,
    backgroundPadding: 10,
    startSec: null,
    endSec: null,
    isAutoSubtitle: false,
    ...partial,
  };
}

// ─── ImageOverlay ─────────────────────────────────────────────────────────────
export interface ImageOverlay {
  id: string;
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
  startSec: number | null;
  endSec:   number | null;
}

export function defaultImageOverlay(partial?: Partial<ImageOverlay>): ImageOverlay {
  return {
    id: generateId(),
    src: "",
    name: "image",
    x: 0.5,
    y: 0.1,
    width: 0.25,
    opacity: 1,
    startSec: null,
    endSec: null,
    ...partial,
  };
}

// ─── ClipEdits ────────────────────────────────────────────────────────────────
export interface ClipEdits {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3" | "original";
  textOverlays:  TextOverlay[];
  imageOverlays: ImageOverlay[];
  brightness: number;
  contrast:   number;
  saturation: number;
  speed:      number;
  trimStart:  number;
  trimEnd:    number;
  /** Active subtitle preset ID for auto-generated subtitles */
  activePresetId?: string;

  // ── Motion Tracking ──────────────────────────────────────────────────────
  /** Tracking keyframes from /api/analyze-motion (null = not yet analyzed) */
  motionKeyframes?:         MotionKeyframe[] | null;
  /** True when motion analysis has been run at least once for this clip+ratio */
  motionAnalyzed?:          boolean;
  /** True when person is stationary (single keyframe → static optimal crop) */
  isStaticMotion?:          boolean;
  /** Pixel dimensions of the motion-tracking crop window */
  motionCropW?:             number;
  motionCropH?:             number;
  /** Source video natural dimensions recorded at analysis time */
  motionVidW?:              number;
  motionVidH?:              number;
  /** Human-readable message from the last motion analysis */
  motionMessage?:           string;
  /** Whether the server has OpenCV available for motion analysis */
  motionAvailable?:         boolean;
}

export interface ProjectClip {
  momentId: string;
  moment:   ViralMoment;
  edits:    ClipEdits;
  exportedUrl?: string;
}

export interface Project {
  id:              string;
  videoFileName:   string;
  videoFileSize:   number;
  videoMimeType:   string;
  videoDuration:   number;
  localVideoUrl?:  string;
  analysisResult:  VideoAnalysisResult;
  selectedClips:   ProjectClip[];
  createdAt:       number;
  updatedAt:       number;
}

const STORAGE_KEY = "ai_clipper_projects_v2";

export function getApiKey(): string { return "server-side"; }
export function isApiKeyConfigured(): boolean { return true; }

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
  const idx      = projects.findIndex((p) => p.id === project.id);
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

export function defaultEdits(): ClipEdits {
  return {
    cropX: 0, cropY: 0, cropW: 1, cropH: 1,
    aspectRatio: "original",
    textOverlays:  [],
    imageOverlays: [],
    brightness: 0,
    contrast:   0,
    saturation: 0,
    speed:      1,
    trimStart:  0,
    trimEnd:    0,
    activePresetId: "bold-impact",
    // Motion tracking — not yet analyzed
    motionKeyframes: null,
    motionAnalyzed:  false,
    isStaticMotion:  false,
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}