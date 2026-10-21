import React, { useState } from 'react';
import { ShortClip, SocialAccount, PublishJob } from '../types/shorts';
import { X, Youtube, Instagram, CheckCircle2, ExternalLink, Send } from 'lucide-react';

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
  const [publishToInstagram, setPublishToInstagram] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [completedJob, setCompletedJob] = useState<PublishJob | null>(null);

  if (!isOpen) return null;

  const ytAccount = connectedAccounts.find(a => a.platform === 'youtube');
  const igAccount = connectedAccounts.find(a => a.platform === 'instagram');

  const handlePublish = () => {
    setIsPublishing(true);

    setTimeout(() => {
      const randomId = Math.random().toString(36).substring(2, 9);
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
        visibility: 'public',
        status: 'published',
        progress: 100,
        postUrls: {
          youtube: `https://youtube.com/shorts/${randomId}`,
          instagram: `https://instagram.com/reel/${randomId}`,
        },
        createdAt: new Date().toISOString(),
      };

      setCompletedJob(job);
      setIsPublishing(false);
      onConfirmPublish(job);
    }, 1800);
  };

  const handleClose = () => {
    setIsPublishing(false);
    setCompletedJob(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl text-white">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {completedJob ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Published Successfully</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Your 9:16 Short is live on the selected platforms.
              </p>
            </div>

            <div className="space-y-2 text-left pt-1">
              {publishToYouTube && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    <span>YouTube Shorts</span>
                  </div>
                  <a
                    href={completedJob.postUrls.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-zinc-300 hover:text-white hover:underline"
                  >
                    <span>View</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {publishToInstagram && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span>Instagram Reels</span>
                  </div>
                  <a
                    href={completedJob.postUrls.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-zinc-300 hover:text-white hover:underline"
                  >
                    <span>View</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full rounded-lg bg-zinc-800 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : isPublishing ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
            <h3 className="text-sm font-semibold text-white">Publishing via Platform APIs...</h3>
            <p className="text-xs text-zinc-400">Uploading 9:16 vertical video and captions</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Publish Short</h3>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{clip.title}</p>
            </div>

            {/* Target Accounts */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Publish To
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <div>
                    <span className="text-xs font-semibold block text-white">YouTube Shorts</span>
                    <span className="text-[10px] text-zinc-400">{ytAccount?.handle || '@Channel'}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={publishToYouTube}
                  onChange={(e) => setPublishToYouTube(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 accent-white h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <div>
                    <span className="text-xs font-semibold block text-white">Instagram Reels</span>
                    <span className="text-[10px] text-zinc-400">{igAccount?.handle || '@Account'}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={publishToInstagram}
                  onChange={(e) => setPublishToInstagram(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 accent-white h-4 w-4"
                />
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handlePublish}
                disabled={!publishToYouTube && !publishToInstagram}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Publish Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
