import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeId,
  formatDuration,
  calculateViralityScore,
  generateTimedCaptions,
  formatSrtTime,
  generateSrtContent,
  generateHashtags,
  normalizeClipRange,
  getFfmpegReframeFilter,
} from './videoUtils.ts';

test('extractYouTubeId extracts IDs from varied valid YouTube URLs', () => {
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeId('https://youtube.com/embed/dQw4w9WgXcQ?autoplay=1'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeId('dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
});

test('extractYouTubeId returns null on invalid links', () => {
  assert.equal(extractYouTubeId('https://vimeo.com/123456'), null);
  assert.equal(extractYouTubeId('not a url'), null);
  assert.equal(extractYouTubeId(''), null);
});

test('formatDuration formats seconds properly', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(45), '00:45');
  assert.equal(formatDuration(125), '02:05');
  assert.equal(formatDuration(3665), '01:01:05');
});

test('calculateViralityScore produces weighted score within 1-100', () => {
  const score = calculateViralityScore({
    hookStrength: 95,
    emotionalValence: 80,
    pacingSpeed: 90,
    retentionPrediction: 92,
  });
  // 95*0.35 + 92*0.30 + 90*0.20 + 80*0.15 = 33.25 + 27.6 + 18 + 12 = 90.85 -> 91
  assert.equal(score, 91);
});

test('generateTimedCaptions breaks text into timed chunks with word timings', () => {
  const text = 'Never sacrifice your long term goals for short term pleasure';
  const segments = generateTimedCaptions(text, 10, 5, 3);
  assert.ok(segments.length > 0);
  assert.equal(segments[0].words.length, 3);
  assert.equal(segments[0].words[0].word, 'Never');
  assert.ok(segments[0].start >= 0);
  assert.ok(segments[0].end <= 5);
});

test('generateSrtContent formats valid SubRip file', () => {
  const segments = [
    {
      id: 'cap-0',
      start: 0,
      end: 2.5,
      text: 'First line of viral hook',
      words: [],
    },
    {
      id: 'cap-1',
      start: 2.5,
      end: 5.0,
      text: 'Second line of viral hook',
      words: [],
    },
  ];
  const srt = generateSrtContent(segments);
  assert.ok(srt.includes('1\n00:00:00,000 --> 00:00:02,500\nFirst line of viral hook'));
  assert.ok(srt.includes('2\n00:00:02,500 --> 00:00:05,000\nSecond line of viral hook'));
});

test('generateHashtags returns required viral tags', () => {
  const tags = generateHashtags('tech', 5);
  assert.equal(tags.length, 5);
  assert.ok(tags.includes('#shorts'));
  assert.ok(tags.includes('#viral'));
});

test('normalizeClipRange clamps durations cleanly for YouTube Shorts', () => {
  // Case 1: valid start and end
  const res1 = normalizeClipRange(10, 45);
  assert.equal(res1.startSec, 10);
  assert.equal(res1.endSec, 45);
  assert.equal(res1.durationSec, 35);

  // Case 2: end time less than or equal to start time falls back to duration
  const res2 = normalizeClipRange(20, 15, 30);
  assert.equal(res2.startSec, 20);
  assert.equal(res2.endSec, 50);
  assert.equal(res2.durationSec, 30);

  // Case 3: clip duration exceeds YouTube Shorts 60s limit
  const res3 = normalizeClipRange(0, 120);
  assert.equal(res3.startSec, 0);
  assert.equal(res3.endSec, 60);
  assert.equal(res3.durationSec, 60);

  // Case 4: clip duration is too short (< 5s)
  const res4 = normalizeClipRange(10, 12);
  assert.equal(res4.startSec, 10);
  assert.equal(res4.endSec, 15);
  assert.equal(res4.durationSec, 5);
});

test('getFfmpegReframeFilter produces valid ffmpeg filter chains', () => {
  assert.ok(getFfmpegReframeFilter('blur-fill').includes('boxblur'));
  assert.ok(getFfmpegReframeFilter('split-screen').includes('vstack'));
  assert.ok(getFfmpegReframeFilter('center-crop').includes('crop=1080:1920'));
  assert.ok(getFfmpegReframeFilter('smart-face').includes('crop=1080:1920'));

  // Test pan positioning for left, right, and custom speaker framing
  const leftSpeaker = getFfmpegReframeFilter('center-crop', 20);
  assert.ok(leftSpeaker.includes('0.20'));
  assert.ok(leftSpeaker.includes('crop=1080:1920'));

  const rightSpeaker = getFfmpegReframeFilter('center-crop', 80);
  assert.ok(rightSpeaker.includes('0.80'));
  assert.ok(rightSpeaker.includes('crop=1080:1920'));
});

