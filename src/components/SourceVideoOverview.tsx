import React, { useState } from 'react';
import { VideoSource } from '../types/shorts';
import { formatDuration } from '../utils/videoUtils';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface SourceVideoOverviewProps {
  sourceVideo: VideoSource;
}

export const SourceVideoOverview: React.FC<SourceVideoOverviewProps> = ({ sourceVideo }) => {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="mx-auto max-w-5xl rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-950">
            <img
              src={sourceVideo.thumbnailUrl}
              alt={sourceVideo.title}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[9px] font-mono text-white">
              {formatDuration(sourceVideo.duration)}
            </span>
          </div>

          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
              {sourceVideo.title}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {sourceVideo.channelName} • {sourceVideo.generatedClips.length} Shorts Created
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors self-end sm:self-auto shrink-0"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>{showTranscript ? 'Hide Transcript' : 'Transcript'}</span>
          {showTranscript ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showTranscript && (
        <div className="mt-3 pt-3 border-t border-zinc-800 max-h-48 overflow-y-auto space-y-2 text-xs custom-scrollbar">
          {sourceVideo.fullTranscript.map((t, idx) => (
            <div key={idx} className="flex gap-2.5 text-zinc-300">
              <span className="font-mono text-zinc-500 shrink-0">{formatDuration(t.start)}</span>
              <span>
                <strong className="text-zinc-200">{t.speaker}:</strong> {t.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
