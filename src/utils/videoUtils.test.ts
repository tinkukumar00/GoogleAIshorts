import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeId,
  formatDuration,
  calculateViralityScore,
  generateTimedCaptions,
  formatSrtTime,
  generateSrtContent,
  generateHashtags
} from './videoUtils';

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
