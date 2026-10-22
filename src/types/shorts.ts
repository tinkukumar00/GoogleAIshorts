export type AspectRatio = '9:16' | '1:1' | '4:5' | '16:9';

export type ReframeMode = 'smart-face' | 'split-screen' | 'blur-fill' | 'center-crop';

export type CaptionStyleId = 'hormozi' | 'neon-cyber' | 'apple-clean' | 'comic-pop' | 'bold-minimal';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
}

export interface CaptionWord {
  word: string;
  start: number; // in seconds relative to clip start
  end: number;
}

export interface CaptionSegment {
  id: string;
  start: number; // in seconds relative to clip start
  end: number;
  text: string;
  words: CaptionWord[];
}

export interface ViralityMetrics {
  overallScore: number; // 0 - 100
  hookStrength: number; // 0 - 100
  emotionalValence: number; // 0 - 100
  pacingSpeed: number; // 0 - 100
  retentionPrediction: number; // 0 - 100
  reasoning: string;
  hookType: 'Shocking Truth' | 'Counter-Intuitive' | 'High-Stakes Question' | 'Actionable Secret' | 'Emotional Story' | 'Controversial Take';
}

export interface ShortClip {
  id: string;
  title: string;
  alternativeTitles: string[];
  startTime: number; // seconds in source video
  endTime: number; // seconds in source video
  duration: number; // seconds
  virality: ViralityMetrics;
  hookBadge: string;
  summary: string;
  captions: CaptionSegment[];
  hashtags: string[];
  suggestedBroll?: string;
  suggestedSoundFx?: string;
  previewThumbnail: string;
  youtubeId?: string;
  reframeMode: ReframeMode;
  panX?: number; // Horizontal framing offset 0 (left) to 100 (right), default 50
  captionStyle: CaptionStyleId;
  aspectRatio: AspectRatio;
  status: 'ready' | 'rendering' | 'scheduled' | 'published';
  publishedAccounts?: {
    platform: 'youtube' | 'instagram' | 'tiktok';
    url: string;
    publishedAt: string;
  }[];
}

export interface VideoSource {
  id: string;
  youtubeId?: string;
  url: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  publishedDate: string;
  views: string;
  description: string;
  fullTranscript: {
    start: number;
    end: number;
    speaker: string;
    text: string;
  }[];
  generatedClips: ShortClip[];
}

export interface SocialAccount {
  id: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  accountName: string;
  handle: string;
  avatar: string;
  followerCount: string;
  isConnected: boolean;
  canPublishShorts: boolean;
  lastSync?: string;
}

export interface PublishJob {
  id: string;
  clipId: string;
  clipTitle: string;
  thumbnailUrl: string;
  targetPlatforms: ('youtube' | 'instagram' | 'tiktok')[];
  scheduleType: 'now' | 'scheduled';
  scheduledTime?: string;
  visibility: 'public' | 'unlisted' | 'private';
  status: 'queued' | 'uploading' | 'processing' | 'published' | 'failed';
  progress: number;
  postUrls: { [platform: string]: string };
  createdAt: string;
}
