// src/lib/templates.ts
//
// ─── Supabase SQL (run once in your SQL editor) ───────────────────────────────
// CREATE TABLE clip_templates (
//   id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id     UUID    REFERENCES users(id) ON DELETE CASCADE NOT NULL,
//   name        TEXT    NOT NULL,
//   aspect_ratio TEXT   NOT NULL DEFAULT 'original',
//   subtitle_preset_id TEXT NOT NULL DEFAULT 'bold-impact',
//   subtitle_enabled   BOOLEAN NOT NULL DEFAULT true,
//   watermark_name     TEXT,
//   watermark_x        FLOAT NOT NULL DEFAULT 0.88,
//   watermark_y        FLOAT NOT NULL DEFAULT 0.06,
//   watermark_width    FLOAT NOT NULL DEFAULT 0.18,
//   watermark_opacity  FLOAT NOT NULL DEFAULT 0.85,
//   brightness  FLOAT NOT NULL DEFAULT 0,
//   contrast    FLOAT NOT NULL DEFAULT 0,
//   saturation  FLOAT NOT NULL DEFAULT 0,
//   speed       FLOAT NOT NULL DEFAULT 1,
//   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX idx_clip_templates_user_id ON clip_templates(user_id);
// ──────────────────────────────────────────────────────────────────────────────

import { getToken } from "./Auth";
import type { ClipEdits } from "./storage";
import {
  SUBTITLE_PRESETS,
  defaultTextOverlay,
  defaultImageOverlay,
  applyPresetToOverlay,
  generateId,
} from "./storage";

const API_BASE = import.meta.env.VITE_API_BASE as string;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClipTemplate {
  id?: string;
  user_id?: string;
  name: string;
  aspect_ratio: "9:16" | "16:9" | "1:1" | "4:3" | "original";
  subtitle_preset_id: string;
  subtitle_enabled: boolean;
  watermark_name?: string | null;
  watermark_x: number;
  watermark_y: number;
  watermark_width: number;
  watermark_opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  speed: number;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_TEMPLATE: ClipTemplate = {
  name: "Template Saya",
  aspect_ratio: "9:16",
  subtitle_preset_id: "bold-impact",
  subtitle_enabled: true,
  watermark_name: null,
  watermark_x: 0.88,
  watermark_y: 0.06,
  watermark_width: 0.18,
  watermark_opacity: 0.85,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  speed: 1,
};

// ─── Watermark image cache (localStorage) ────────────────────────────────────
// Stored in localStorage because base64 can be several MB — too large for a
// Supabase TEXT column in a high-frequency read path.
const WM_CACHE_KEY = "clipper_wm_cache_v1";

export function cacheWatermark(templateId: string, base64: string): void {
  try {
    const cache: Record<string, string> = JSON.parse(
      localStorage.getItem(WM_CACHE_KEY) || "{}"
    );
    cache[templateId] = base64;
    localStorage.setItem(WM_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export function getCachedWatermark(templateId: string): string | null {
  try {
    const cache: Record<string, string> = JSON.parse(
      localStorage.getItem(WM_CACHE_KEY) || "{}"
    );
    return cache[templateId] ?? null;
  } catch {
    return null;
  }
}

export function deleteCachedWatermark(templateId: string): void {
  try {
    const cache: Record<string, string> = JSON.parse(
      localStorage.getItem(WM_CACHE_KEY) || "{}"
    );
    delete cache[templateId];
    localStorage.setItem(WM_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchTemplates(): Promise<ClipTemplate[]> {
  try {
    const resp = await fetch(`${API_BASE}/api/templates`, {
      headers: authHeaders(),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.templates || []) as ClipTemplate[];
  } catch {
    return [];
  }
}

export async function createTemplateApi(
  template: Omit<ClipTemplate, "id" | "user_id" | "created_at" | "updated_at">
): Promise<ClipTemplate> {
  const resp = await fetch(`${API_BASE}/api/templates`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(template),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || "Gagal menyimpan template");
  }
  return resp.json();
}

export async function updateTemplateApi(
  id: string,
  template: Omit<ClipTemplate, "id" | "user_id" | "created_at" | "updated_at">
): Promise<ClipTemplate> {
  const resp = await fetch(`${API_BASE}/api/templates/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(template),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || "Gagal update template");
  }
  return resp.json();
}

export async function deleteTemplateApi(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/templates/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  deleteCachedWatermark(id);
}

// ─── Apply template to ClipEdits ──────────────────────────────────────────────
// subtitleChunks come from the Whisper API (/api/auto-subtitle).
export function applyTemplateToEdits(
  template: ClipTemplate,
  watermarkSrc: string | null,
  subtitleChunks?: { text: string; start: number; end: number }[]
): Partial<ClipEdits> {
  const partial: Partial<ClipEdits> = {
    aspectRatio: template.aspect_ratio,
    brightness: template.brightness,
    contrast: template.contrast,
    saturation: template.saturation,
    speed: template.speed,
    activePresetId: template.subtitle_preset_id,
    trimStart: 0,
    trimEnd: 0,
    imageOverlays: [],
    textOverlays: [],
    motionKeyframes: null,
    motionAnalyzed: false,
    isStaticMotion: false,
  };

  // Watermark overlay
  if (watermarkSrc && template.watermark_name) {
    partial.imageOverlays = [
      defaultImageOverlay({
        id: generateId(),
        src: watermarkSrc,
        name: template.watermark_name,
        x: template.watermark_x,
        y: template.watermark_y,
        width: template.watermark_width,
        opacity: template.watermark_opacity,
        startSec: null,
        endSec: null,
      }),
    ];
  }

  // Auto-subtitle overlays
  if (
    template.subtitle_enabled &&
    subtitleChunks &&
    subtitleChunks.length > 0
  ) {
    const preset =
      SUBTITLE_PRESETS.find((p) => p.id === template.subtitle_preset_id) ??
      SUBTITLE_PRESETS[0];

    partial.textOverlays = subtitleChunks.map((chunk) =>
      applyPresetToOverlay(
        defaultTextOverlay({
          id: generateId(),
          text: chunk.text,
          startSec: parseFloat(chunk.start.toFixed(3)),
          endSec: parseFloat(chunk.end.toFixed(3)),
          isAutoSubtitle: true,
        }),
        preset
      )
    );
  }

  return partial;
}