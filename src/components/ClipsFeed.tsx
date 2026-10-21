import React from 'react';
import { ShortClip } from '../types/shorts';
import { formatDuration } from '../utils/videoUtils';
import { Play, Send } from 'lucide-react';

interface ClipsFeedProps {
  clips: ShortClip[];
  selectedClipId: string;
  onSelectClip: (clip: ShortClip) => void;
  onQuickPublish: (clip: ShortClip) => void;
}

export const ClipsFeed: React.FC<ClipsFeedProps> = ({
  clips,
  selectedClipId,
  onSelectClip,
  onQuickPublish,
}) => {
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Generated Shorts ({clips.length})
        </h2>
        <span className="text-xs text-zinc-500">Reframed to 9:16 with Captions</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {clips.map((clip, index) => {
          const isSelected = clip.id === selectedClipId;

          return (
            <div
              key={clip.id}
              onClick={() => onSelectClip(clip)}
              className={`flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-white bg-zinc-900 shadow-md ring-1 ring-white/20'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div>
                <div className="relative aspect-[9/12] w-full overflow-hidden rounded-lg bg-zinc-950 mb-2.5">
                  <img
                    src={clip.previewThumbnail}
                    alt={clip.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-white">
                    {clip.duration}s
                  </span>
                  <span className="absolute top-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {clip.virality.overallScore}% Viral
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                    <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center text-zinc-950 shadow">
                      <Play className="h-4 w-4 fill-zinc-950 ml-0.5" />
                    </div>
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug">
                  {clip.title}
                </h3>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-400 hover:text-white font-medium">
                  {isSelected ? 'Editing Now' : 'Edit & Review'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickPublish(clip);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-950 hover:bg-white active:scale-95 transition-all"
                >
                  <Send className="h-3 w-3" />
                  <span>Publish</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
