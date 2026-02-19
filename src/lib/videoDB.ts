// src/lib/videoDB.ts
// Browser IndexedDB storage untuk video blob (file upload only).

const DB_NAME    = "ai-clipper-video-db-v2";
const DB_VERSION = 1;
const STORE_TEMP    = "source-videos";
const STORE_EXPORTS = "clip-exports";

interface SourceVideoRecord {
  videoId:   string;   // = project.id
  fileName:  string;
  mimeType:  string;
  blob:      Blob;
  storedAt:  number;
}

interface ExportRecord {
  momentId: string;
  fileName: string;
  blob:     Blob;
  storedAt: number;
}

// ─── Open / init DB ───────────────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TEMP)) {
        db.createObjectStore(STORE_TEMP, { keyPath: "videoId" });
      }
      if (!db.objectStoreNames.contains(STORE_EXPORTS)) {
        db.createObjectStore(STORE_EXPORTS, { keyPath: "momentId" });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror   = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCE VIDEOS (uploaded by user)
// ═══════════════════════════════════════════════════════════════════════════════

export async function storeSourceVideo(
  videoId:  string,
  fileName: string,
  mimeType: string,
  blob:     Blob
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_TEMP, "readwrite");
  await idbRequest(
    tx.objectStore(STORE_TEMP).put({
      videoId, fileName, mimeType, blob, storedAt: Date.now(),
    } satisfies SourceVideoRecord)
  );
  db.close();
}

export async function getSourceVideoUrl(videoId: string): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_TEMP, "readonly");
  const record = await idbRequest<SourceVideoRecord | undefined>(
    tx.objectStore(STORE_TEMP).get(videoId)
  );
  db.close();
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}

export async function getSourceVideoBlob(videoId: string): Promise<Blob | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_TEMP, "readonly");
  const record = await idbRequest<SourceVideoRecord | undefined>(
    tx.objectStore(STORE_TEMP).get(videoId)
  );
  db.close();
  return record?.blob ?? null;
}

export async function deleteSourceVideo(videoId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_TEMP, "readwrite");
  await idbRequest(tx.objectStore(STORE_TEMP).delete(videoId));
  db.close();
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED CLIPS
// ═══════════════════════════════════════════════════════════════════════════════

export async function storeExportedClip(
  momentId: string,
  fileName: string,
  blob:     Blob
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_EXPORTS, "readwrite");
  await idbRequest(
    tx.objectStore(STORE_EXPORTS).put({
      momentId, fileName, blob, storedAt: Date.now(),
    } satisfies ExportRecord)
  );
  db.close();
}

export async function getExportedClip(
  momentId: string
): Promise<{ url: string; fileName: string } | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_EXPORTS, "readonly");
  const record = await idbRequest<ExportRecord | undefined>(
    tx.objectStore(STORE_EXPORTS).get(momentId)
  );
  db.close();
  if (!record) return null;
  return { url: URL.createObjectURL(record.blob), fileName: record.fileName };
}

export async function downloadExportedClip(
  momentId:          string,
  suggestedFileName: string
): Promise<boolean> {
  const result = await getExportedClip(momentId);
  if (!result) return false;
  const a = document.createElement("a");
  a.href = result.url;
  a.download = suggestedFileName || result.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(result.url);
  return true;
}

export async function deleteExportedClip(momentId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_EXPORTS, "readwrite");
  await idbRequest(tx.objectStore(STORE_EXPORTS).delete(momentId));
  db.close();
}

export async function listStoredExportIds(): Promise<string[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_EXPORTS, "readonly");
  const keys = await idbRequest<IDBValidKey[]>(
    tx.objectStore(STORE_EXPORTS).getAllKeys()
  );
  db.close();
  return keys as string[];
}

// ─── Upload helper: upload blob + receive streaming result → IndexedDB ─────────
export async function uploadAndStoreExportedClip(
  serverUrl: string,
  videoBlob: Blob,
  momentId:  string,
  clip:      object,
  edits:     object
): Promise<string> {
  const formData = new FormData();
  formData.append("video",     videoBlob, "source.mp4");
  formData.append("clipJson",  JSON.stringify(clip));
  formData.append("editsJson", JSON.stringify(edits));

  const response = await fetch(serverUrl, { method: "POST", body: formData });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || body.error || "Export failed");
  }

  const fileName = response.headers.get("X-File-Name") ?? `clip_${Date.now()}.mp4`;
  const blob     = await response.blob();

  await storeExportedClip(momentId, fileName, blob);
  return URL.createObjectURL(blob);
}