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
  { name: "Roboto",              category: "sans-serif",  weights: ["400", "700"] },
  { name: "Inter",               category: "sans-serif",  weights: ["400", "700"] },
  { name: "Open Sans",           category: "sans-serif",  weights: ["400", "700"] },
  { name: "Poppins",             category: "sans-serif",  weights: ["400", "700"] },
  { name: "Montserrat",          category: "sans-serif",  weights: ["400", "700"] },
  { name: "Nunito",              category: "sans-serif",  weights: ["400", "700"] },
  { name: "Raleway",             category: "sans-serif",  weights: ["400", "700"] },
  { name: "Rajdhani",            category: "sans-serif",  weights: ["400", "700"] },
  { name: "Exo 2",               category: "sans-serif",  weights: ["400", "700"] },
  // Display / Impact
  { name: "Oswald",              category: "display",     weights: ["400", "700"] },
  { name: "Bebas Neue",          category: "display",     weights: ["400"] },
  { name: "Anton",               category: "display",     weights: ["400"] },
  { name: "Bangers",             category: "display",     weights: ["400"] },
  { name: "Righteous",           category: "display",     weights: ["400"] },
  { name: "Black Ops One",       category: "display",     weights: ["400"] },
  // Handwriting
  { name: "Pacifico",            category: "handwriting", weights: ["400"] },
  { name: "Dancing Script",      category: "handwriting", weights: ["400", "700"] },
  { name: "Caveat",              category: "handwriting", weights: ["400", "700"] },
  // Serif / Premium
  { name: "Playfair Display",    category: "serif",       weights: ["400", "700"] },
  { name: "Cormorant Garamond",  category: "serif",       weights: ["400", "700"] },
  { name: "Merriweather",        category: "serif",       weights: ["400", "700"] },
  { name: "Lora",                category: "serif",       weights: ["400", "700"] },
  // Monospace
  { name: "Source Code Pro",     category: "monospace",   weights: ["400", "700"] },
  { name: "Space Mono",          category: "monospace",   weights: ["400", "700"] },
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
    id: "phantom-gold",
    name: "Phantom Gold",
    description: "Luxury gold on deep black — cinematic authority meets premium shine.",
    emoji: "✦",
    previewBg: "#0a0805",
    previewText: "#D4AF37",
    previewAccent: "#D4AF37",
    overrides: {
      fontFamily: "Cormorant Garamond", fontSize: 46, color: "#D4AF37",
      bold: true, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 5, opacity: 1, outlineWidth: 0,
      shadowEnabled: true, shadowColor: "#7A6010", shadowX: 0, shadowY: 3, shadowBlur: 20,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "void-white",
    name: "Void White",
    description: "Ultra-clean white on a sleek frosted strip. Minimal luxury.",
    emoji: "◻",
    previewBg: "#080808",
    previewText: "#FAFAFA",
    previewAccent: "#AAAAAA",
    overrides: {
      fontFamily: "Rajdhani", fontSize: 46, color: "#FAFAFA",
      bold: true, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 8, opacity: 1, outlineWidth: 0,
      shadowEnabled: false,
      backgroundEnabled: true, backgroundColor: "#0D0D0D", backgroundOpacity: 0.78,
      backgroundPadding: 18, x: 0.5, y: 0.82,
    },
  },
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    description: "Electric cyan glow — sharp, futuristic, impossible to ignore.",
    emoji: "⟁",
    previewBg: "#020916",
    previewText: "#00F5FF",
    previewAccent: "#00F5FF",
    overrides: {
      fontFamily: "Exo 2", fontSize: 44, color: "#00F5FF",
      bold: true, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 4, opacity: 1,
      outlineWidth: 2, outlineColor: "#003840",
      shadowEnabled: true, shadowColor: "#00B8C4", shadowX: 0, shadowY: 0, shadowBlur: 24,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "obsidian-stripe",
    name: "Obsidian Stripe",
    description: "White Oswald punched through a deep obsidian bar. Precision editorial.",
    emoji: "▬",
    previewBg: "#111",
    previewText: "#FFFFFF",
    previewAccent: "#444444",
    overrides: {
      fontFamily: "Oswald", fontSize: 48, color: "#FFFFFF",
      bold: true, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 3, opacity: 1, outlineWidth: 0, shadowEnabled: false,
      backgroundEnabled: true, backgroundColor: "#111111", backgroundOpacity: 0.92,
      backgroundPadding: 22, x: 0.5, y: 0.82,
    },
  },
  {
    id: "aurora-gradient",
    name: "Aurora",
    description: "Warm champagne text with a violet-tinged depth. Creator-core aesthetic.",
    emoji: "◈",
    previewBg: "#0e0b1a",
    previewText: "#F2D7A0",
    previewAccent: "#9B6FFF",
    overrides: {
      fontFamily: "Nunito", fontSize: 44, color: "#F2D7A0",
      bold: true, italic: false, uppercase: false, textAlign: "center",
      letterSpacing: 1, opacity: 1, outlineWidth: 0,
      shadowEnabled: true, shadowColor: "#5B3A9B", shadowX: 0, shadowY: 4, shadowBlur: 22,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "redline-impact",
    name: "Redline Impact",
    description: "Bone white with a vicious red outline. Raw, aggressive, viral energy.",
    emoji: "◉",
    previewBg: "#0d0000",
    previewText: "#FFFFFF",
    previewAccent: "#E00000",
    overrides: {
      fontFamily: "Anton", fontSize: 54, color: "#FFFFFF",
      bold: false, italic: false, uppercase: true, textAlign: "center",
      letterSpacing: 1, opacity: 1,
      outlineWidth: 4, outlineColor: "#CC0000",
      shadowEnabled: true, shadowColor: "#800000", shadowX: 3, shadowY: 4, shadowBlur: 0,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "studio-glass",
    name: "Studio Glass",
    description: "Translucent frosted pill. Polished, modern, premium app feel.",
    emoji: "◇",
    previewBg: "#1a1a2a",
    previewText: "#FFFFFF",
    previewAccent: "#7ECFFF",
    overrides: {
      fontFamily: "Inter", fontSize: 42, color: "#FFFFFF",
      bold: true, italic: false, uppercase: false, textAlign: "center",
      letterSpacing: 1, opacity: 0.96, outlineWidth: 0,
      shadowEnabled: false,
      backgroundEnabled: true, backgroundColor: "#3A3A5C", backgroundOpacity: 0.55,
      backgroundPadding: 20, x: 0.5, y: 0.82,
    },
  },
  {
    id: "mono-terminal",
    name: "Mono Terminal",
    description: "Hacker-green on matte black. Tech, code, and underground culture.",
    emoji: "▶",
    previewBg: "#050f08",
    previewText: "#39FF14",
    previewAccent: "#39FF14",
    overrides: {
      fontFamily: "Space Mono", fontSize: 36, color: "#39FF14",
      bold: false, italic: false, uppercase: false, textAlign: "center",
      letterSpacing: 2, opacity: 1,
      outlineWidth: 0,
      shadowEnabled: true, shadowColor: "#1A7A06", shadowX: 0, shadowY: 0, shadowBlur: 16,
      backgroundEnabled: true, backgroundColor: "#020A04", backgroundOpacity: 0.85,
      backgroundPadding: 14, x: 0.5, y: 0.82,
    },
  },
  {
    id: "chalk-dust",
    name: "Chalk Dust",
    description: "Handwritten feel with soft warm shadows — organic, personal, human.",
    emoji: "✎",
    previewBg: "#1c1510",
    previewText: "#F5EDD8",
    previewAccent: "#C4A96E",
    overrides: {
      fontFamily: "Caveat", fontSize: 52, color: "#F5EDD8",
      bold: true, italic: false, uppercase: false, textAlign: "center",
      letterSpacing: 1, opacity: 1, outlineWidth: 0,
      shadowEnabled: true, shadowColor: "#3D2B10", shadowX: 2, shadowY: 3, shadowBlur: 10,
      backgroundEnabled: false, x: 0.5, y: 0.82,
    },
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif",
    description: "Playfair Display with pure ivory — magazine editorial prestige.",
    emoji: "◈",
    previewBg: "#0c0c0c",
    previewText: "#F0EDE8",
    previewAccent: "#888888",
    overrides: {
      fontFamily: "Playfair Display", fontSize: 42, color: "#F0EDE8",
      bold: true, italic: false, uppercase: false, textAlign: "center",
      letterSpacing: 3, opacity: 1, outlineWidth: 0,
      shadowEnabled: true, shadowColor: "#000000", shadowX: 1, shadowY: 2, shadowBlur: 14,
      backgroundEnabled: false, x: 0.5, y: 0.82,
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

  /**
   * Short copywriting headline shown in the first 4 s of the exported clip.
   * Rendered in the active preset's font. Fades out at t=3→4 s.
   * Leave empty / undefined to disable.
   */
  introText?: string;

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

  // ── Text Watermark ────────────────────────────────────────────────────────
  /** "text" | "image" — which watermark mode is active */
  watermarkType?:       "text" | "image";
  /** The watermark text content (mode = text) */
  watermarkText?:       string | null;
  /** Google Font family name for text watermark */
  watermarkFontFamily?: string;
  /** Hex color string e.g. "#FFFFFF" */
  watermarkTextColor?:  string;
  watermarkBold?:       boolean;
  watermarkItalic?:     boolean;
  /** Font size relative to frame width (e.g. 0.04 = 4%) */
  watermarkFontSize?:   number;
  /** X center position relative to frame width */
  watermarkX?:          number;
  /** Y center position relative to frame height */
  watermarkY?:          number;
  watermarkOpacity?:    number;
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
    // Intro copywriting text
    introText: "",
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}