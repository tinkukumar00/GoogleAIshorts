import { CaptionSegment, CaptionWord, ViralityMetrics } from '../types/shorts';

/**
 * Extracts a YouTube Video ID from any common YouTube URL format.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL regex patterns
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS format.
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Calculates a composite Virality Score (0 - 100) based on hook strength,
 * emotional valence, pacing speed, and word density.
 */
export function calculateViralityScore(metrics: {
  hookStrength: number;
  emotionalValence: number;
  pacingSpeed: number;
  retentionPrediction: number;
}): number {
  const { hookStrength, emotionalValence, pacingSpeed, retentionPrediction } = metrics;
  
  // Weighted score: Hook is most critical for Shorts (35%), Retention (30%), Pacing (20%), Emotion (15%)
  const rawScore =
    hookStrength * 0.35 +
    retentionPrediction * 0.30 +
    pacingSpeed * 0.20 +
    emotionalValence * 0.15;

  return Math.min(100, Math.max(1, Math.round(rawScore)));
}

/**
 * Breaks long text transcript into timed caption chunks with word-level timing
 * for dynamic karaoke highlight rendering.
 */
export function generateTimedCaptions(
  text: string,
  startSeconds: number,
  durationSeconds: number,
  wordsPerChunk: number = 3
): CaptionSegment[] {
  if (!text || text.trim().length === 0 || durationSeconds <= 0) return [];

  const rawWords = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (rawWords.length === 0) return [];

  const timePerWord = durationSeconds / rawWords.length;
  const segments: CaptionSegment[] = [];

  for (let i = 0; i < rawWords.length; i += wordsPerChunk) {
    const chunkWords = rawWords.slice(i, i + wordsPerChunk);
    const chunkStart = Number((startSeconds + i * timePerWord).toFixed(2));
    const chunkEnd = Number((startSeconds + (i + chunkWords.length) * timePerWord).toFixed(2));

    const words: CaptionWord[] = chunkWords.map((word, idx) => {
      const wordIdx = i + idx;
      const wStart = Number((startSeconds + wordIdx * timePerWord).toFixed(2));
      const wEnd = Number((startSeconds + (wordIdx + 1) * timePerWord).toFixed(2));
      return {
        word,
        start: wStart - startSeconds, // relative to clip start
        end: wEnd - startSeconds,
      };
    });

    segments.push({
      id: `cap-${i}`,
      start: chunkStart - startSeconds,
      end: chunkEnd - startSeconds,
      text: chunkWords.join(' '),
      words,
    });
  }

  return segments;
}

/**
 * Formats timestamp for SRT format (00:00:00,000)
 */
export function formatSrtTime(seconds: number): string {
  const pad = (n: number, z = 2) => ('00' + n).slice(-z);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Converts caption segments into standard .SRT subtitle string.
 */
export function generateSrtContent(segments: CaptionSegment[]): string {
  return segments
    .map((seg, idx) => {
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.end);
      return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join('\n');
}

/**
 * Generates viral hashtag bundles and social descriptions based on category & topics.
 */
export function generateHashtags(category: string, count: number = 8): string[] {
  const baseTags = ['#shorts', '#viral', '#trending', '#fyp', '#reels'];
  const topicTags: Record<string, string[]> = {
    podcast: ['#podcastclips', '#mindset', '#interview', '#deepdive', '#wisdom', '#lifelessons'],
    tech: ['#tech', '#future', '#ai', '#innovation', '#coding', '#software', '#artificialintelligence'],
    business: ['#entrepreneur', '#business', '#money', '#success', '#wealth', '#growth'],
    health: ['#health', '#science', '#neuroscience', '#wellness', '#biohacking', '#fitness'],
  };

  const selected = topicTags[category.toLowerCase()] || topicTags.podcast;
  const merged = Array.from(new Set([...baseTags, ...selected]));
  return merged.slice(0, count);
}
