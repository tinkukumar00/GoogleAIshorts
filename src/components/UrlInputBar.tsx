import React, { useState } from 'react';
import { ArrowRight, Link as LinkIcon, Upload, ShieldAlert, Film } from 'lucide-react';
import { extractYouTubeId } from '../utils/videoUtils';

interface UrlInputBarProps {
  onAnalyze: (url: string) => void;
  onUploadFile?: (fileName: string, fileData: string) => void;
  onOpenCookiesManager?: () => void;
  isAnalyzing: boolean;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  onAnalyze,
  onUploadFile,
  onOpenCookiesManager,
  isAnalyzing,
}) => {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleSubmitUrl = (e: React.FormEvent) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('File size exceeds 100MB limit. Please choose a smaller video clip.');
      return;
    }

    setUploadError('');
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (onUploadFile && result) {
        onUploadFile(file.name, result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read video file.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-3xl text-center space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          Paste a YouTube Link or Upload MP4 Video
        </h1>
        <p className="text-sm text-zinc-400">
          AI detects the best moments, reframes to 1080×1920 full-screen vertical Reels with sound, and publishes to your accounts.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 transition-colors cursor-pointer ${
            mode === 'url' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          <span>YouTube URL</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 transition-colors cursor-pointer ${
            mode === 'upload' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Upload className="h-3.5 w-3.5 text-rose-400" />
          <span>Upload Local MP4</span>
        </button>
      </div>

      {mode === 'url' ? (
        <form onSubmit={handleSubmitUrl} className="space-y-2">
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
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Film className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Upload Your Video File (MP4, WEBM, MOV)</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Guarantees 100% original video frames and original audio sound with zero cloud bot checks.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-md">
            <Upload className="h-4 w-4 text-rose-600" />
            <span>{isAnalyzing ? 'Processing Upload...' : 'Choose MP4 Video File'}</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/mkv"
              onChange={handleFileChange}
              disabled={isAnalyzing}
              className="hidden"
            />
          </label>

          {selectedFileName && (
            <p className="text-xs font-mono text-emerald-400">
              Selected: {selectedFileName}
            </p>
          )}

          {uploadError && (
            <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
          )}
        </div>
      )}

      {/* Quick Sample Links & Cookies Bypass Helper */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-zinc-400">
        <span className="text-zinc-500 text-[11px]">Try samples:</span>
        <button
          type="button"
          onClick={() => {
            setMode('url');
            const sample = 'https://www.youtube.com/watch?v=d1zge_JMIIU';
            setUrl(sample);
            onAnalyze(sample);
          }}
          className="rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          🎙️ Podcast Interview
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('url');
            const sample = 'https://www.youtube.com/watch?v=UF8uR6Z6KLc';
            setUrl(sample);
            onAnalyze(sample);
          }}
          className="rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          🚀 Tech & AI Keynote
        </button>

        {onOpenCookiesManager && (
          <button
            type="button"
            onClick={onOpenCookiesManager}
            className="flex items-center gap-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[11px] text-amber-300 transition-colors cursor-pointer"
            title="Bypass YouTube server bot checks with Netscape cookies"
          >
            <ShieldAlert className="h-3 w-3 text-amber-400" />
            <span>YouTube Cookies Helper</span>
          </button>
        )}
      </div>
    </div>
  );
};
