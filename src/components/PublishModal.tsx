import React, { useState, useEffect } from 'react';
import { ShortClip, SocialAccount, PublishJob } from '../types/shorts';
import {
  X,
  Youtube,
  Instagram,
  CheckCircle2,
  ExternalLink,
  Send,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Globe,
  Lock,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

interface PublishModalProps {
  clip: ShortClip;
  connectedAccounts: SocialAccount[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: (job: PublishJob) => void;
  onOpenAccountSettings: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  clip,
  connectedAccounts,
  isOpen,
  onClose,
  onConfirmPublish,
  onOpenAccountSettings,
}) => {
  const [publishToYouTube, setPublishToYouTube] = useState(true);
  const [publishToInstagram, setPublishToInstagram] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [completedJob, setCompletedJob] = useState<PublishJob | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [quickTokenInput, setQuickTokenInput] = useState('');
  const [showQuickTokenInput, setShowQuickTokenInput] = useState(false);
  const [publishPhase, setPublishPhase] = useState<'idle' | 'rendering' | 'uploading'>('idle');

  useEffect(() => {
    const token = localStorage.getItem('youtube_access_token');
    setHasToken(!!token);
  }, [isOpen, connectedAccounts]);

  if (!isOpen) return null;

  const ytAccount = connectedAccounts.find((a) => a.platform === 'youtube');
  const igAccount = connectedAccounts.find((a) => a.platform === 'instagram');
  const isYouTubeReady = ytAccount?.isConnected && hasToken;

  // 1-Click Google OAuth Connection from inside the Publish modal
  const handleQuickConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setPublishError(null);

    try {
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const customId = localStorage.getItem('google_client_id') || '';
      const res = await fetch(
        `/api/auth/url?platform=youtube&response_type=token&redirect_uri=${encodeURIComponent(callbackUrl)}${customId ? `&client_id=${encodeURIComponent(customId)}` : ''}`
      );
      const data = await res.json();

      if (!data.configured || !data.url) {
        setPublishError(data.error || 'Failed to get OAuth URL');
        setIsConnectingGoogle(false);
        return;
      }

      // 1. Try Google Identity Services (GIS) Token Client
      const win = window as any;
      if (win.google?.accounts?.oauth2 && data.clientId) {
        try {
          const client = win.google.accounts.oauth2.initTokenClient({
            client_id: data.clientId,
            scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube email profile',
            callback: async (resp: any) => {
              if (resp.error) {
                setPublishError(`Google authorization failed: ${resp.error_description || resp.error}`);
                setIsConnectingGoogle(false);
                return;
              }
              if (resp.access_token) {
                await verifyAndStoreToken(resp.access_token);
              }
            },
          });
          client.requestAccessToken({ prompt: 'consent' });
          return;
        } catch (e) {
          console.warn('GIS error in publish modal:', e);
        }
      }

      // 2. Open standard Google OAuth Popup
      window.open(data.url, 'oauth_popup', 'width=600,height=700');
    } catch (err: any) {
      setPublishError(err.message || 'Failed to start Google sign-in');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const verifyAndStoreToken = async (token: string) => {
    setIsConnectingGoogle(true);
    try {
      const res = await fetch('/api/youtube/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });
      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch {
        data = { success: false, error: resText.length > 200 ? 'Server returned an invalid response' : resText };
      }
      if (!data.success) {
        throw new Error(data.error || 'Invalid YouTube access token.');
      }
      localStorage.setItem('youtube_access_token', token);
      setHasToken(true);
      setPublishError(null);
      setShowQuickTokenInput(false);
      setQuickTokenInput('');
    } catch (e: any) {
      setPublishError(e.message || 'Failed to connect YouTube channel.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishPhase('rendering');
    setPublishError(null);

    const token = localStorage.getItem('youtube_access_token');
    if (publishToYouTube && !token) {
      setIsPublishing(false);
      setPublishPhase('idle');
      setPublishError(
        'Please authenticate with Google first to authorize ShortsCraft to upload this video to your YouTube channel.'
      );
      return;
    }

    let ytPostUrl = '';
    let ytVideoId = '';
    let igPostUrl = '';

    // Schedule status message transition to uploading
    const statusTimer = setTimeout(() => {
      setPublishPhase('uploading');
    }, 6000);

    try {
      if (publishToYouTube) {
        const ytRes = await fetch('/api/youtube/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: clip.title,
            description: `${clip.summary}\n\n${clip.hashtags.join(' ')}`,
            tags: clip.hashtags.map((t) => t.replace('#', '')),
            visibility: visibility,
            clipId: clip.id,
            youtubeId: clip.youtubeId,
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: clip.duration,
            reframeMode: clip.reframeMode,
            panX: clip.panX ?? 50,
            captionStyle: clip.captionStyle,
            previewThumbnail: clip.previewThumbnail,
            accessToken: token,
            cookies: localStorage.getItem('youtube_cookies') || undefined,
          }),
        });

        const ytText = await ytRes.text();
        let ytData: any = {};
        try {
          ytData = JSON.parse(ytText);
        } catch {
          ytData = { success: false, error: ytText.length > 200 ? 'Server returned an invalid response' : ytText };
        }

        if (!ytData.success) {
          throw new Error(ytData.error || 'Failed to publish video to YouTube.');
        }

        ytPostUrl = ytData.shortUrl;
        ytVideoId = ytData.videoId;
      }

      if (publishToInstagram) {
        // Simulated Instagram Reel ID
        const fakeIgId = Math.random().toString(36).substring(2, 9);
        igPostUrl = `https://www.instagram.com/reel/${fakeIgId}`;
      }
    } catch (e: any) {
      clearTimeout(statusTimer);
      console.error('Publish error:', e);
      setPublishError(e.message || 'Failed to upload video to your YouTube account.');
      setIsPublishing(false);
      setPublishPhase('idle');
      return;
    } finally {
      clearTimeout(statusTimer);
    }

    const platforms: ('youtube' | 'instagram' | 'tiktok')[] = [];
    if (publishToYouTube) platforms.push('youtube');
    if (publishToInstagram) platforms.push('instagram');

    const job: PublishJob = {
      id: `job-${Date.now()}`,
      clipId: clip.id,
      clipTitle: clip.title,
      thumbnailUrl: clip.previewThumbnail,
      targetPlatforms: platforms,
      scheduleType: 'now',
      visibility: visibility,
      status: 'published',
      progress: 100,
      postUrls: {
        youtube: ytPostUrl,
        instagram: igPostUrl,
      },
      createdAt: new Date().toISOString(),
    };

    setCompletedJob(job);
    setIsPublishing(false);
    onConfirmPublish(job);
  };

  const handleCopyShortUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClose = () => {
    setIsPublishing(false);
    setPublishError(null);
    setCompletedJob(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-white">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {completedJob ? (
          /* Success Screen with Real YouTube Link */
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Uploaded to Real YouTube Channel!</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Your 9:16 vertical Short was rendered with FFmpeg and uploaded directly to your channel via YouTube Data API v3 Resumable Upload.
              </p>
            </div>

            <div className="space-y-3 text-left pt-2">
              {completedJob.postUrls.youtube && (
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="font-semibold text-white">YouTube Shorts Link</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">
                      Live Video ID: {completedJob.postUrls.youtube.split('/').pop()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-2 border border-zinc-800 text-xs">
                    <span className="font-mono text-zinc-300 truncate max-w-[240px] sm:max-w-[280px]">
                      {completedJob.postUrls.youtube}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyShortUrl(completedJob.postUrls.youtube!)}
                      className="flex items-center gap-1 text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer text-xs shrink-0"
                    >
                      {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={completedJob.postUrls.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 text-white bg-red-600 hover:bg-red-500 py-2 rounded-lg text-xs font-semibold transition-all shadow-md"
                    >
                      <span>Open YouTube Shorts</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <a
                      href={`https://www.youtube.com/watch?v=${completedJob.postUrls.youtube.split('/').pop()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <span>Watch View</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {publishToInstagram && completedJob.postUrls.instagram && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-500 shrink-0" />
                    <span className="text-zinc-300">Instagram Reel (Simulated)</span>
                  </div>
                  <a
                    href={completedJob.postUrls.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-zinc-400 hover:text-white"
                  >
                    <span>View</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full rounded-xl bg-white py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : isPublishing ? (
          /* Publishing Loading State */
          <div className="py-12 text-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-500 border-t-transparent mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white">Uploading Short to YouTube...</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Rendering 1080x1920 vertical video container with FFmpeg and streaming to YouTube Data API v3 Resumable Upload protocol.
              </p>
            </div>
          </div>
        ) : (
          /* Main Publish Dialog */
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Publish Short to Real Account</h3>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{clip.title}</p>
            </div>

            {/* Error Banner */}
            {publishError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{publishError}</p>
                </div>
                {!isYouTubeReady && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleQuickConnectGoogle}
                      className="flex items-center gap-1 font-semibold text-white bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-xs transition-colors cursor-pointer"
                    >
                      <Youtube className="h-3.5 w-3.5" />
                      <span>Sign In with Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickTokenInput(!showQuickTokenInput)}
                      className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Paste Token
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* If YouTube is not yet connected: Prominent Connection Card */}
            {!isYouTubeReady ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/20 shrink-0">
                    <Youtube className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Connect YouTube Channel</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      To publish this video to your real YouTube channel instead of a placeholder, authenticate with Google OAuth.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickConnectGoogle}
                  disabled={isConnectingGoogle}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-semibold text-white transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isConnectingGoogle ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting Google Account...</span>
                    </>
                  ) : (
                    <>
                      <Youtube className="h-4 w-4" />
                      <span>Connect with Google (YouTube OAuth)</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowQuickTokenInput(!showQuickTokenInput)}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    {showQuickTokenInput ? 'Hide Token Input' : 'Or paste OAuth Access Token directly'}
                  </button>
                </div>

                {showQuickTokenInput && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <input
                      type="password"
                      value={quickTokenInput}
                      onChange={(e) => setQuickTokenInput(e.target.value)}
                      placeholder="Paste ya29.a0... access token"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => verifyAndStoreToken(quickTokenInput.trim())}
                      disabled={!quickTokenInput.trim() || isConnectingGoogle}
                      className="w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Verify Token &amp; Link Channel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Connected Channel Information Badge */
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {ytAccount?.avatar ? (
                    <img
                      src={ytAccount.avatar}
                      alt={ytAccount.accountName}
                      className="h-8 w-8 rounded-full object-cover border border-emerald-500/30"
                    />
                  ) : (
                    <Youtube className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{ytAccount?.accountName || 'YouTube Channel'}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                        <Check className="h-2.5 w-2.5" />
                        Verified
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block">
                      {ytAccount?.handle} • {ytAccount?.followerCount}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenAccountSettings}
                  className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Manage
                </button>
              </div>
            )}

            {/* Publishing Settings */}
            <div className="space-y-3 pt-1">
              {/* Target Platforms */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Target Destination
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950 cursor-pointer hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Youtube className="h-4 w-4 text-red-500 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block text-white">YouTube Shorts (Real Account)</span>
                      <span className="text-[10px] text-zinc-400">
                        {isYouTubeReady ? `Uploading to ${ytAccount?.accountName}` : 'Requires Google OAuth'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={publishToYouTube}
                    onChange={(e) => setPublishToYouTube(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 accent-red-600 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 cursor-pointer hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Instagram className="h-4 w-4 text-pink-500 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-300">Instagram Reels (Optional)</span>
                      <span className="text-[10px] text-zinc-500">Requires Meta Graph API App Secret</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={publishToInstagram}
                    onChange={(e) => setPublishToInstagram(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 accent-pink-600 h-4 w-4"
                  />
                </label>
              </div>

              {/* YouTube Privacy Visibility */}
              {publishToYouTube && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    YouTube Privacy Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition-colors cursor-pointer ${
                        visibility === 'public'
                          ? 'border-white bg-zinc-800 text-white font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Globe className="h-3 w-3" />
                      <span>Public</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibility('unlisted')}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition-colors cursor-pointer ${
                        visibility === 'unlisted'
                          ? 'border-white bg-zinc-800 text-white font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <EyeOff className="h-3 w-3" />
                      <span>Unlisted</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibility('private')}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition-colors cursor-pointer ${
                        visibility === 'private'
                          ? 'border-white bg-zinc-800 text-white font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Lock className="h-3 w-3" />
                      <span>Private</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button & Live Progress */}
            <div className="pt-2 space-y-2">
              {isPublishing && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center gap-2.5 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400 shrink-0" />
                  <div className="leading-snug">
                    <p className="font-semibold text-white">
                      {publishPhase === 'rendering'
                        ? `Reframing clip (${clip.startTime}s - ${clip.endTime}s) into vertical 9:16 Short...`
                        : `Uploading video to ${ytAccount?.accountName || 'YouTube Channel'}...`}
                    </p>
                    <p className="text-[10px] text-amber-300/80 mt-0.5">
                      {publishPhase === 'rendering'
                        ? 'Extracting actual video segment with original audio and 9:16 aspect ratio'
                        : 'Streaming binary MP4 via YouTube Data API v3 resumable upload'}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || (!publishToYouTube && !publishToInstagram) || (publishToYouTube && !isYouTubeReady)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-98 disabled:opacity-40 transition-all cursor-pointer shadow-lg"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Rendering & Uploading Real Video...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Upload to Real YouTube Channel</span>
                  </>
                )}
              </button>
              {publishToYouTube && !isYouTubeReady && !isPublishing && (
                <p className="text-[11px] text-zinc-500 text-center mt-1.5">
                  Connect your Google account above to enable uploading.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
