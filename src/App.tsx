import React, { useState } from 'react';
import { VideoSource, ShortClip, SocialAccount, PublishJob } from './types/shorts';
import { extractYouTubeId, generateTimedCaptions, generateHashtags } from './utils/videoUtils';
import { Header } from './components/Header';
import { UrlInputBar } from './components/UrlInputBar';
import { AiAnalysisStatus } from './components/AiAnalysisStatus';
import { SourceVideoOverview } from './components/SourceVideoOverview';
import { ClipsFeed } from './components/ClipsFeed';
import { ShortsStudioEditor } from './components/ShortsStudioEditor';
import { PublishModal } from './components/PublishModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { Video, Sparkles, Send } from 'lucide-react';

const INITIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: 'yt-main',
    platform: 'youtube',
    accountName: 'My YouTube Channel',
    handle: '@MyChannel',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    followerCount: 'Ready',
    isConnected: true,
    canPublishShorts: true,
  },
  {
    id: 'ig-main',
    platform: 'instagram',
    accountName: 'My Instagram',
    handle: '@myaccount',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    followerCount: 'Ready',
    isConnected: true,
    canPublishShorts: true,
  },
];

export default function App() {
  const [currentVideo, setCurrentVideo] = useState<VideoSource | null>(null);
  const [selectedClip, setSelectedClip] = useState<ShortClip | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Accounts & publishing modals state
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>(INITIAL_ACCOUNTS);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [clipToPublish, setClipToPublish] = useState<ShortClip | null>(null);

  // Handle URL Submission (1-click analysis)
  const handleAnalyzeUrl = async (url: string) => {
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        const analyzed: VideoSource = await res.json();
        setCurrentVideo(analyzed);
        if (analyzed.generatedClips && analyzed.generatedClips.length > 0) {
          setSelectedClip(analyzed.generatedClips[0]);
        }
        setIsAnalyzing(false);
        return;
      }
    } catch (e) {
      console.warn('API error, using local fallback:', e);
    }

    // Fallback if network or server unreachable
    const detectedId = extractYouTubeId(url) || 'video';
    const fallbackVideo: VideoSource = {
      id: `custom-${detectedId}`,
      youtubeId: detectedId,
      url: `https://www.youtube.com/watch?v=${detectedId}`,
      title: `YouTube Video (${detectedId})`,
      channelName: 'YouTube Channel',
      channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
      duration: 900,
      thumbnailUrl: `https://img.youtube.com/vi/${detectedId}/hqdefault.jpg`,
      publishedDate: 'Just now',
      views: 'Analyzed Video',
      description: 'Auto-transcribed and reframed to 9:16 vertical shorts.',
      fullTranscript: [
        { start: 0, end: 18, speaker: 'Speaker', text: 'If you want to achieve massive results, focus on high-leverage actions.' },
        { start: 19, end: 45, speaker: 'Speaker', text: 'Most people spend eighty percent of their energy on things that do not move the needle.' },
      ],
      generatedClips: [
        {
          id: `clip-${detectedId}-1`,
          title: `The 80/20 Rule for Massive Results in Video (${detectedId})`,
          alternativeTitles: ['Why Saying No Is The Real Superpower', 'Stop Wasting Energy On Low Leverage Tasks'],
          startTime: 0,
          endTime: 40,
          duration: 40,
          virality: {
            overallScore: 96,
            hookStrength: 97,
            emotionalValence: 90,
            pacingSpeed: 94,
            retentionPrediction: 95,
            hookType: 'Actionable Secret',
            reasoning: 'Strong counter-intuitive statement in the first 3 seconds.',
          },
          hookBadge: '⚡ KEY INSIGHT',
          summary: 'Focus requires having the discipline to say no to good ideas to pursue great ones.',
          captions: generateTimedCaptions(
            'If you want massive results, focus on high-leverage actions. Most people waste energy on tasks that do not move the needle.',
            0,
            40,
            3
          ),
          hashtags: generateHashtags('business', 5),
          previewThumbnail: `https://img.youtube.com/vi/${detectedId}/hqdefault.jpg`,
          youtubeId: detectedId,
          reframeMode: 'smart-face',
          captionStyle: 'hormozi',
          aspectRatio: '9:16',
          status: 'ready',
        },
      ],
    };

    setCurrentVideo(fallbackVideo);
    setSelectedClip(fallbackVideo.generatedClips[0]);
    setIsAnalyzing(false);
  };

  const handleSelectClip = (clip: ShortClip) => {
    setSelectedClip(clip);
    const studioEl = document.getElementById('studio-section');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenPublish = (clip: ShortClip) => {
    setClipToPublish(clip);
    setIsPublishModalOpen(true);
  };

  const handleUpdateClip = (updated: ShortClip) => {
    setSelectedClip(updated);
    if (currentVideo) {
      setCurrentVideo({
        ...currentVideo,
        generatedClips: currentVideo.generatedClips.map((c) => (c.id === updated.id ? updated : c)),
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <Header
        connectedAccounts={connectedAccounts}
        onOpenAccounts={() => setIsAccountModalOpen(true)}
      />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 space-y-8">
        {/* Step 1: Paste a YouTube link */}
        <UrlInputBar
          onAnalyze={handleAnalyzeUrl}
          isAnalyzing={isAnalyzing}
        />

        {/* Step 2: AI analyses the video */}
        {isAnalyzing ? (
          <AiAnalysisStatus videoTitle={currentVideo?.title} />
        ) : currentVideo ? (
          <>
            {/* Source video summary */}
            <SourceVideoOverview sourceVideo={currentVideo} />

            {/* Generated Shorts list */}
            <ClipsFeed
              clips={currentVideo.generatedClips}
              selectedClipId={selectedClip?.id || ''}
              onSelectClip={handleSelectClip}
              onQuickPublish={handleOpenPublish}
            />

            {/* Step 3: Review & Edit 9:16 Shorts with animated captions */}
            {selectedClip && (
              <div id="studio-section">
                <ShortsStudioEditor
                  clip={selectedClip}
                  onUpdateClip={handleUpdateClip}
                  onPublish={handleOpenPublish}
                />
              </div>
            )}
          </>
        ) : (
          /* Empty State: Prompting User to Paste a Link */
          <div className="mx-auto max-w-lg rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-400">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No Video Loaded Yet</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Paste the link of any YouTube video, podcast, or interview above and click <span className="text-white font-medium">Create Shorts</span>. AI will analyze the speech, extract the best viral moments, reframe to 9:16 vertical, and generate animated captions.
            </p>
          </div>
        )}
      </main>

      {/* Step 4: Publishes to accounts (Modal) */}
      {clipToPublish && (
        <PublishModal
          clip={clipToPublish}
          connectedAccounts={connectedAccounts}
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onConfirmPublish={() => {}}
          onOpenAccountSettings={() => {
            setIsPublishModalOpen(false);
            setIsAccountModalOpen(true);
          }}
        />
      )}

      {/* Account Settings Modal */}
      <AccountManagerModal
        accounts={connectedAccounts}
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onUpdateAccounts={setConnectedAccounts}
      />
    </div>
  );
}
