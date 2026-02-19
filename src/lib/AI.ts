// src/lib/AI.ts
// AI interactions with OpenRouter — analyze local video file (no YouTube)

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "arcee-ai/trinity-large-preview:free";

export interface ViralMoment {
  id: string;
  label: string;
  startTime: number; // seconds
  endTime: number;   // seconds
  reason: string;
  viralScore: number; // 1-10
  category: "funny" | "emotional" | "educational" | "shocking" | "satisfying" | "drama" | "highlight";
}

export interface VideoAnalysisResult {
  moments: ViralMoment[];
  summary: string;
  totalViralPotential: number;
}

export interface VideoFileInfo {
  fileName: string;
  fileSize: number; // bytes
  duration: number; // seconds (read from HTMLVideoElement)
  mimeType: string;
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function callAI(
  messages: AIMessage[],
  apiKey: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "AI Viral Clipper",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.4,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API Error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Respons AI kosong");
  return content;
}

// ─── Parse AI JSON safely ─────────────────────────────────────────────────────
function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("Gagal memproses respons AI sebagai JSON");
  }
}

// ─── Main: Detect viral moments from local video file ─────────────────────────
export async function detectViralMomentsFromFile(
  videoInfo: VideoFileInfo,
  apiKey: string,
  onProgress?: (msg: string) => void
): Promise<VideoAnalysisResult> {
  onProgress?.("Mengirim metadata video ke AI...");

  const fileSizeMB = (videoInfo.fileSize / 1_048_576).toFixed(1);

  const systemPrompt = `Kamu adalah seorang analis konten viral profesional dan strategi media sosial berpengalaman yang SELALU merespons dalam Bahasa Indonesia.

Keahlianmu:
- Mengidentifikasi segmen video yang memiliki daya tarik emosional tinggi
- Memahami pola konten yang viral di TikTok, Instagram Reels, dan YouTube Shorts
- Membagi video menjadi segmen-segmen berpotensi viral berdasarkan durasi total
- Menentukan timestamp yang presisi dan masuk akal
- Menilai potensi viral berdasarkan hook, retensi, dan shareability

Prinsip analisismu:
1. DISTRIBUSI MERATA: Sebarkan momen ke seluruh durasi video secara proporsional
2. DURASI OPTIMAL: Prioritaskan klip 20-60 detik (sweet spot untuk Reels/Shorts)
3. HOOK KUAT: Setiap klip harus dimulai dengan momen yang langsung menarik perhatian
4. KELENGKAPAN: Klip harus punya awal, tengah, dan akhir yang jelas
5. VARIASI: Pilih berbagai kategori momen yang berbeda

Selalu respons dalam Bahasa Indonesia yang natural. Hanya keluarkan JSON yang valid.`;

  const userPrompt = `Kamu menerima informasi tentang sebuah file video lokal yang akan dianalisis untuk ditemukan momen viral terbaik.

═══ INFORMASI FILE VIDEO ═══
Nama file  : ${videoInfo.fileName}
Ukuran     : ${fileSizeMB} MB
Durasi     : ${videoInfo.duration} detik (${formatTime(videoInfo.duration)})
Format     : ${videoInfo.mimeType}

═══ TUGAS ═══
Berdasarkan durasi video (${videoInfo.duration} detik = ${formatTime(videoInfo.duration)}), identifikasi 5-8 segmen terbaik yang berpotensi viral sebagai klip pendek untuk media sosial.

Karena kamu tidak bisa melihat isi video, gunakan logika distribusi durasi yang cerdas:
- Bagi durasi total menjadi segmen-segmen yang masuk akal
- Distribusikan momen secara merata dari awal hingga akhir video
- Pastikan setiap momen memiliki durasi 15-90 detik
- Jangan buat timestamp yang tumpang tindih
- Mulai dari detik ke-0 atau awal video, dan akhiri sebelum atau tepat di durasi total

Panduan distribusi untuk video ${videoInfo.duration} detik:
- Bagian awal (0% - 20%): 0 - ${Math.round(videoInfo.duration * 0.2)}s → biasanya berisi intro/hook
- Bagian awal-tengah (20% - 40%): ${Math.round(videoInfo.duration * 0.2)} - ${Math.round(videoInfo.duration * 0.4)}s
- Bagian tengah (40% - 60%): ${Math.round(videoInfo.duration * 0.4)} - ${Math.round(videoInfo.duration * 0.6)}s
- Bagian tengah-akhir (60% - 80%): ${Math.round(videoInfo.duration * 0.6)} - ${Math.round(videoInfo.duration * 0.8)}s
- Bagian akhir (80% - 100%): ${Math.round(videoInfo.duration * 0.8)} - ${videoInfo.duration}s → biasanya berisi kesimpulan/CTA

Kategori yang tersedia:
- "funny": Momen lucu, humor
- "emotional": Momen mengharukan, inspiratif
- "educational": Fakta menarik, tutorial, insight
- "shocking": Revelasi mengejutkan, twist
- "satisfying": Momen memuaskan, kesimpulan epik
- "drama": Konflik, ketegangan
- "highlight": Momen puncak, pencapaian

PENTING:
- startTime dan endTime HARUS dalam detik (bilangan bulat)
- Durasi tiap klip: 15-90 detik maksimal
- Timestamp TIDAK BOLEH melebihi ${videoInfo.duration} detik
- Buat label yang menarik dan deskriptif dalam Bahasa Indonesia

Kembalikan HANYA JSON valid:
{
  "summary": "Analisis singkat 2-3 kalimat tentang potensi video ini untuk konten viral dalam Bahasa Indonesia",
  "totalViralPotential": 7,
  "moments": [
    {
      "id": "moment_1",
      "label": "Label menarik untuk klip (maks 8 kata)",
      "startTime": 10,
      "endTime": 55,
      "reason": "Penjelasan 2 kalimat mengapa segmen ini berpotensi viral dalam Bahasa Indonesia",
      "viralScore": 8,
      "category": "highlight"
    }
  ]
}`;

  onProgress?.("AI sedang menganalisis dan membagi video menjadi momen viral...");

  const rawResponse = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    apiKey,
    { maxTokens: 3000, temperature: 0.3 }
  );

  onProgress?.("Memproses respons AI...");

  const parsed = parseJSON<VideoAnalysisResult>(rawResponse);

  const moments: ViralMoment[] = (parsed.moments || [])
    .filter((m) => {
      const validStart  = m.startTime >= 0;
      const validEnd    = m.endTime <= videoInfo.duration;
      const validOrder  = m.startTime < m.endTime;
      const minDuration = (m.endTime - m.startTime) >= 10;
      return validStart && validEnd && validOrder && minDuration;
    })
    .map((m, i) => ({
      ...m,
      id:         m.id || `moment_${i + 1}`,
      viralScore: Math.min(10, Math.max(1, m.viralScore || 5)),
      startTime:  Math.round(m.startTime),
      endTime:    Math.min(Math.round(m.endTime), videoInfo.duration),
    }))
    .sort((a, b) => b.viralScore - a.viralScore);

  return {
    moments,
    summary:             parsed.summary || "Analisis selesai.",
    totalViralPotential: parsed.totalViralPotential || 5,
  };
}

// ─── Generate clip title & caption ───────────────────────────────────────────
export async function generateClipContent(
  moment: ViralMoment,
  videoFileName: string,
  apiKey: string
): Promise<{ titles: string[]; captions: string[]; hashtags: string[] }> {
  const prompt = `Kamu adalah content creator media sosial yang kreatif. Buat konten yang menarik untuk klip ini dalam Bahasa Indonesia.

File Video: "${videoFileName}"
Klip: "${moment.label}" (${formatTime(moment.startTime)} - ${formatTime(moment.endTime)})
Kategori: ${moment.category}
Mengapa viral: ${moment.reason}

Kembalikan HANYA JSON valid:
{
  "titles": ["Judul opsi 1", "Judul opsi 2", "Judul opsi 3"],
  "captions": ["Caption opsi 1 (dengan emoji yang relevan)", "Caption opsi 2 (lebih singkat)"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}`;

  const raw = await callAI(
    [{ role: "user", content: prompt }],
    apiKey,
    { maxTokens: 800, temperature: 0.7 }
  );

  return parseJSON(raw);
}

// ─── Utility ──────────────────────────────────────────────────────────────────
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function validateApiKey(key: string): boolean {
  return key.startsWith("sk-or-") && key.length > 20;
}