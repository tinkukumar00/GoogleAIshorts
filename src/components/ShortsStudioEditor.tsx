import React, { useState, useEffect, useRef } from 'react';
import { ShortClip, CaptionStyleId, CaptionSegment } from '../types/shorts';
import { formatDuration, generateSrtContent } from '../utils/videoUtils';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Send,
  Download,
  Copy,
  Check,
  FileDown,
} from 'lucide-react';

interface ShortsStudioEditorProps {
  clip: ShortClip;
  onUpdateClip: (updated: ShortClip) => void;
  onPublish: (clip: ShortClip) => void;
}

export const ShortsStudioEditor: React.FC<ShortsStudioEditorProps> = ({
  clip,
  onUpdateClip,
  onPublish,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedMetadata, setCopiedMetadata] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyleId>(clip.captionStyle || 'hormozi');
  const [reframeMode, setReframeMode] = useState<'smart-face' | 'center-crop'>('smart-face');
  const [title, setTitle] = useState(clip.title);

  const animRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setTitle(clip.title);
  }, [clip.id]);

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    lastTickRef.current = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTickRef.current) / 1000;
      lastTickRef.current = time;

      setCurrentTime((prev) => {
        const next = prev + delta * playbackSpeed;
        if (next >= clip.duration) {
          return 0;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, playbackSpeed, clip.duration]);

  const activeSegment: CaptionSegment | undefined = clip.captions.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  );

  const activeWordIndex = activeSegment?.words.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, clip.duration)));
  };

  const handleCopyBundle = () => {
    const textToCopy = `${title}\n\n${clip.hashtags.join(' ')}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedMetadata(true);
    setTimeout(() => setCopiedMetadata(false), 2000);
  };

  const handleDownloadSrt = () => {
    const srt = generateSrtContent(clip.captions);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Shorts Review & Edit
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">{title}</h2>
        </div>

        <button
          onClick={() => onPublish({ ...clip, title, captionStyle })}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Send className="h-4 w-4" />
          <span>Publish to YouTube & Instagram</span>
        </button>
      </div>

      {/* Main Studio layout: 9:16 Video Player on Left, Controls on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: 9:16 Vertical Video Player */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative aspect-[9/16] w-full max-w-[280px] sm:max-w-[300px] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-lg">
            {/* Video Canvas */}
            <div className="relative h-full w-full overflow-hidden select-none bg-zinc-950">
              <img
                src={clip.previewThumbnail}
                alt="Reframed video"
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${
                  reframeMode === 'smart-face' ? 'scale-110' : 'scale-100'
                }`}
              />

              {isPlaying && clip.youtubeId && (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-10 opacity-95">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${clip.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&playsinline=1&modestbranding=1&rel=0&loop=1&playlist=${clip.youtubeId}&start=${Math.floor(clip.startTime + currentTime)}`}
                    title={clip.title}
                    className={`w-[340%] h-full max-w-none transition-transform duration-300 ${
                      reframeMode === 'smart-face' ? 'scale-115' : 'scale-100'
                    }`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {/* Animated Karaoke Captions */}
              <div className="absolute inset-x-3 bottom-12 flex justify-center z-10 pointer-events-none text-center">
                {activeSegment ? (
                  captionStyle === 'hormozi' ? (
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {activeSegment.words.map((w, idx) => {
                        const isWordActive =
                          idx === activeWordIndex || (activeWordIndex === -1 && idx === 0);
                        return (
                          <span
                            key={idx}
                            className={`font-black uppercase tracking-tight transition-transform ${
                              isWordActive
                                ? 'bg-amber-400 text-zinc-950 px-1.5 py-0.5 rounded text-sm scale-110'
                                : 'bg-black/70 text-white px-1 py-0.5 rounded text-xs'
                            }`}
                          >
                            {w.word}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                      {activeSegment.text}
                    </div>
                  )
                ) : (
                  <div className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-zinc-300">
                    {clip.captions[0]?.text || title}
                  </div>
                )}
              </div>
            </div>

            {/* Tap to Play/Pause Overlay */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors z-20 cursor-pointer"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {!isPlaying && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-zinc-950 shadow-md">
                  <Play className="h-5 w-5 fill-zinc-950 ml-0.5" />
                </div>
              )}
            </button>
          </div>

          {/* Player controls */}
          <div className="mt-3 w-full max-w-[300px] space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
                {formatDuration(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={clip.duration}
                step="0.1"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                aria-label="Seek time scrubber"
                className="flex-1 h-1.5 rounded-lg appearance-none bg-zinc-800 accent-white cursor-pointer"
              />
              <span className="text-[11px] font-mono text-zinc-400 w-10">
                {formatDuration(clip.duration)}
              </span>
            </div>

            <div className="flex items-center justify-between bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="p-1 rounded text-zinc-300 hover:text-white"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSeek(0)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                  aria-label="Restart"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-1 font-mono text-[11px]">
                {[1, 1.25, 1.5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-1.5 py-0.5 rounded ${
                      playbackSpeed === s ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Title */}
        <div className="md:col-span-7 space-y-4">
          {/* Title Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Short Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                onUpdateClip({ ...clip, title: e.target.value });
              }}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
          </div>

          {/* Reframing */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              9:16 Reframing
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReframeMode('smart-face')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  reframeMode === 'smart-face'
                    ? 'border-white bg-zinc-800 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Face Center (9:16)
              </button>
              <button
                type="button"
                onClick={() => setReframeMode('center-crop')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  reframeMode === 'center-crop'
                    ? 'border-white bg-zinc-800 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Center Crop (9:16)
              </button>
            </div>
          </div>

          {/* Caption Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Animated Captions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCaptionStyle('hormozi')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  captionStyle === 'hormozi'
                    ? 'border-white bg-zinc-800 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Yellow Highlighter (Hormozi)
              </button>
              <button
                type="button"
                onClick={() => setCaptionStyle('apple-clean')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  captionStyle === 'apple-clean'
                    ? 'border-white bg-zinc-800 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Minimal White Pill
              </button>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Hashtags
            </label>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-xs font-mono text-zinc-400">
              {clip.hashtags.join(' ')}
            </div>
          </div>

          {/* Export buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSrt}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Export .SRT Captions</span>
            </button>

            <button
              type="button"
              onClick={handleCopyBundle}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              {copiedMetadata ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Title & Tags</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
