// src/utils/audioExtraction.ts
// Audio extraction utilities for speech-to-text processing

/**
 * Extracts an audio segment from a video blob between startTime and endTime
 * Returns a WAV blob suitable for speech recognition APIs
 */
export async function extractAudioSegment(
  videoBlob: Blob,
  startTime: number,
  endTime: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create video element to load the blob
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(videoBlob);

    video.onloadedmetadata = async () => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create source from video element
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);

        // Set video to start position
        video.currentTime = startTime;

        // Create media recorder for the audio stream
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm'
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          URL.revokeObjectURL(objectUrl);
          audioContext.close();
          resolve(audioBlob);
        };

        // Start recording
        mediaRecorder.start();
        video.play();

        // Stop recording after duration
        const duration = (endTime - startTime) * 1000; // convert to ms
        setTimeout(() => {
          video.pause();
          mediaRecorder.stop();
        }, duration);

      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Gagal mengekstrak audio: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal memuat video untuk ekstraksi audio"));
    };

    video.src = objectUrl;
    video.load();
  });
}

/**
 * Fallback: Estimates word timings by evenly distributing words across duration
 * Used when Web Speech API doesn't provide word-level timestamps
 */
export function estimateWordTimings(
  transcript: string,
  totalDuration: number
): Array<{ word: string; startTime: number; endTime: number }> {
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return [];

  // Estimate average word duration (with small gaps)
  const wordDuration = totalDuration / words.length;
  const gapDuration = wordDuration * 0.1; // 10% gap between words
  const effectiveWordDuration = wordDuration - gapDuration;

  return words.map((word, i) => {
    const startTime = i * wordDuration;
    const endTime = startTime + effectiveWordDuration;

    return {
      word: word.replace(/[.,!?;:]/g, ''), // Remove punctuation
      startTime: Math.max(0, startTime),
      endTime: Math.min(totalDuration, endTime)
    };
  });
}

/**
 * Converts audio blob to base64 string for API transmission
 */
export function audioToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
