import React, { useState } from 'react';
import { ArrowRight, Link as LinkIcon } from 'lucide-react';
import { extractYouTubeId } from '../utils/videoUtils';

interface UrlInputBarProps {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  onAnalyze,
  isAnalyzing,
}) => {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setUrlError('Please paste a YouTube video URL');
      return;
    }
    const detectedId = extractYouTubeId(url);
    if (!detectedId) {
      setUrlError('Please enter a valid YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }
    setUrlError('');
    onAnalyze(url);
  };

  return (
    <div className="mx-auto max-w-3xl text-center space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Paste a YouTube Link. Get Finished Shorts.
        </h1>
        <p className="text-sm text-zinc-400">
          AI detects the best moments, reframes to vertical 9:16, adds animated captions, and publishes to your accounts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-sm focus-within:border-zinc-700">
          <div className="flex flex-1 items-center w-full px-3 gap-2.5">
            <LinkIcon className="h-4 w-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError('');
              }}
              placeholder="Paste any YouTube video or podcast URL..."
              aria-label="YouTube video URL"
              className="w-full bg-transparent py-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-98 disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
            ) : (
              <>
                <span>Create Shorts</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {urlError && (
          <p className="text-left text-xs text-rose-400 font-medium px-1">{urlError}</p>
        )}
      </form>
    </div>
  );
};
