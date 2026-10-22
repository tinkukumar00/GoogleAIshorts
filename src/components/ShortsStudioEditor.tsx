import React, { useState, useEffect, useRef } from 'react';
import { ShortClip, CaptionStyleId, CaptionSegment, ReframeMode } from '../types/shorts';
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
  Eye,
  EyeOff,
  Sliders,
  Maximize2,
  Layers,
  Sparkles,
  Loader2,
  Heart,
  MessageCircle,
  Share2,
  Disc,
  User,
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
  const [reframeMode, setReframeMode] = useState<ReframeMode>(clip.reframeMode || 'center-crop');
  const [panX, setPanX] = useState<number>(clip.panX ?? 50);
  const [title, setTitle] = useState(clip.title);
  const [showReelsSafeZone, setShowReelsSafeZone] = useState(false);
  const [isRenderingExport, setIsRenderingExport] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const animRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setTitle(clip.title);
    setReframeMode(clip.reframeMode || 'center-crop');
    setPanX(clip.panX ?? 50);
    setExportSuccess(false);
    setExportError(null);
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

  const handleUpdateReframe = (mode: ReframeMode) => {
    setReframeMode(mode);
    onUpdateClip({ ...clip, reframeMode: mode, panX });
  };

  const handleUpdatePan = (newPan: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newPan)));
    setPanX(clamped);
    onUpdateClip({ ...clip, panX: clamped, reframeMode });
  };

  // Direct 1080x1920 MP4 Video Export for Instagram Reels
  const handleExportReelsVideo = async () => {
    setIsRenderingExport(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      const res = await fetch('/api/render-short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: clip.youtubeId,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          reframeMode,
          panX,
          title,
          description: clip.summary,
          previewThumbnail: clip.previewThumbnail,
          cookies: localStorage.getItem('youtube_cookies') || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to render 9:16 Reels video.');
      }

      // Trigger browser download of pristine 1080x1920 vertical MP4
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = data.filename || `reel-${clip.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      console.error('Export video error:', err);
      setExportError(err.message || 'Failed to export video.');
    } finally {
      setIsRenderingExport(false);
    }
  };

  // Visual pan offset calculation for the iframe & preview image
  // 0% = left edge of video in center, 50% = center, 100% = right edge of video in center
  const horizontalOffsetPercent = (50 - panX) * 0.9;

  return (
    <div className="mx-auto max-w-5xl rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-400 border border-rose-500/20">
              <Maximize2 className="h-3 w-3" />
              Reels 9:16 Full Screen Editor
            </span>
            {clip.youtubeId?.startsWith('upload_') ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                🟢 100% Original Video & Sound
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-400 border border-sky-500/20">
                🎬 YouTube Video Stream
              </span>
            )}
            <span className="text-xs font-mono text-zinc-400">
              {formatDuration(clip.duration)} • 1080×1920
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white leading-snug">{title}</h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportReelsVideo}
            disabled={isRenderingExport}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            title="Download rendered 1080x1920 vertical MP4 file for Instagram Reels"
          >
            {isRenderingExport ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                <span>Rendering 9:16 MP4...</span>
              </>
            ) : exportSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Reel Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-rose-400" />
                <span>Download Reel (MP4)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onPublish({ ...clip, title, captionStyle, reframeMode, panX })}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <Send className="h-4 w-4 text-rose-600" />
            <span>Publish to Reels & Shorts</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300">
          ⚠️ {exportError}
        </div>
      )}

      {/* Main Studio layout: 9:16 Video Player on Left, Controls on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: 9:16 Vertical Video Player */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative aspect-[9/16] w-full max-w-[280px] sm:max-w-[310px] rounded-2xl border-2 border-zinc-700/80 bg-zinc-950 overflow-hidden shadow-2xl">
            {/* Ambient Blurred Backdrop (Full Screen Fill) */}
            {reframeMode === 'blur-fill' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  src={clip.previewThumbnail}
                  alt="Backdrop blur"
                  className="h-full w-full object-cover scale-150 blur-2xl opacity-60"
                />
              </div>
            )}

            {/* Video Canvas Container */}
            <div className="relative h-full w-full overflow-hidden select-none bg-zinc-950 flex items-center justify-center">
              {/* Thumbnail Display with Dynamic Pan Offset */}
              <img
                src={clip.previewThumbnail}
                alt="Reframed video"
                style={{
                  objectPosition:
                    reframeMode === 'blur-fill' ? 'center center' : `${panX}% center`,
                }}
                className={`absolute inset-0 h-full w-full transition-all duration-200 ${
                  reframeMode === 'blur-fill'
                    ? 'object-contain z-10 p-1'
                    : reframeMode === 'split-screen'
                    ? 'object-cover scale-125'
                    : 'object-cover scale-120'
                }`}
              />

              {/* YouTube Playback Stream with Real-time Pan Translation */}
              {isPlaying && clip.youtubeId && (
                <div
                  className={`absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-10 opacity-95 ${
                    reframeMode === 'blur-fill' ? 'p-2' : ''
                  }`}
                >
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${clip.youtubeId}?autoplay=1&mute=${
                      isMuted ? 1 : 0
                    }&controls=0&playsinline=1&modestbranding=1&rel=0&loop=1&playlist=${
                      clip.youtubeId
                    }&start=${Math.floor(clip.startTime + currentTime)}`}
                    title={clip.title}
                    style={{
                      transform:
                        reframeMode === 'blur-fill'
                          ? 'scale(1)'
                          : `translateX(${horizontalOffsetPercent}%) scale(1.15)`,
                    }}
                    className={`max-w-none transition-transform duration-200 ${
                      reframeMode === 'blur-fill' ? 'w-full h-auto aspect-video' : 'w-[360%] h-full'
                    }`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {/* Instagram Reels Safe Zone Overlay Guide */}
              {showReelsSafeZone && (
                <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 select-none">
                  {/* Top Header Safe Area */}
                  <div className="flex items-center justify-between text-white/70 text-[10px] font-semibold bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                    <span>Reels Header</span>
                    <span>1080 × 1920</span>
                  </div>

                  {/* Subtitle & Focus Safe Box Guide */}
                  <div className="my-auto mx-1 h-56 border-2 border-dashed border-rose-400/60 rounded-xl flex items-center justify-center bg-rose-500/5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-rose-300 bg-black/60 px-2 py-0.5 rounded shadow">
                      Reels Safe Zone
                    </span>
                  </div>

                  {/* Right Action Rail (Like, Comment, Share, Audio Disc) */}
                  <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3 text-white/90">
                    <div className="flex flex-col items-center">
                      <div className="p-1.5 rounded-full bg-black/40">
                        <Heart className="h-4 w-4 fill-white" />
                      </div>
                      <span className="text-[9px] font-mono mt-0.5">48K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="p-1.5 rounded-full bg-black/40">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-mono mt-0.5">840</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="p-1.5 rounded-full bg-black/40">
                        <Share2 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="p-1.5 rounded-full bg-black/40 animate-spin">
                      <Disc className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Bottom Caption & Audio Meta Safe Area */}
                  <div className="bg-black/60 backdrop-blur-xs p-2 rounded-lg border border-white/10 mr-12 text-[10px] text-zinc-300 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-white">
                      <User className="h-3 w-3" />
                      <span>@youraccount</span>
                    </div>
                    <p className="line-clamp-2 text-[9px] text-zinc-400">{title}</p>
                    <div className="flex items-center gap-1 text-[8px] text-zinc-400">
                      <Disc className="h-2.5 w-2.5" />
                      <span>Original Audio • Viral Sound</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Animated Karaoke Captions */}
              <div className="absolute inset-x-3 bottom-14 flex justify-center z-20 pointer-events-none text-center">
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
                                ? 'bg-amber-400 text-zinc-950 px-2 py-0.5 rounded text-sm scale-110 shadow-lg'
                                : 'bg-black/80 text-white px-1.5 py-0.5 rounded text-xs'
                            }`}
                          >
                            {w.word}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-black/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg border border-white/10">
                      {activeSegment.text}
                    </div>
                  )
                ) : (
                  <div className="rounded-lg bg-black/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 shadow-md">
                    {clip.captions[0]?.text || title}
                  </div>
                )}
              </div>
            </div>

            {/* Tap to Play/Pause Overlay */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors z-25 cursor-pointer"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {!isPlaying && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-zinc-950 shadow-xl transition-transform hover:scale-110">
                  <Play className="h-5 w-5 fill-zinc-950 ml-0.5" />
                </div>
              )}
            </button>
          </div>

          {/* Quick Safe Zone Toggle */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReelsSafeZone(!showReelsSafeZone)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                showReelsSafeZone
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {showReelsSafeZone ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showReelsSafeZone ? 'Hide Safe Area' : 'Instagram Reels Safe Guide'}</span>
            </button>
          </div>

          {/* Player controls */}
          <div className="mt-2 w-full max-w-[310px] space-y-2">
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
              Reel / Short Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                onUpdateClip({ ...clip, title: e.target.value, reframeMode, panX });
              }}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
          </div>

          {/* Full Screen Reels Fit / Reframe Modes */}
          <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-rose-400" />
                Reels Full-Screen Fit Mode
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">1080×1920 (9:16)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateReframe('center-crop')}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                  reframeMode === 'center-crop' || reframeMode === 'smart-face'
                    ? 'border-rose-500/60 bg-rose-500/10 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Maximize2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>Full Screen Cover</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Edge-to-edge fill with 0 black bars
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateReframe('blur-fill')}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                  reframeMode === 'blur-fill'
                    ? 'border-rose-500/60 bg-rose-500/10 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Ambient Blur Fill</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Full 9:16 screen with blurred backdrop
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateReframe('split-screen')}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                  reframeMode === 'split-screen'
                    ? 'border-rose-500/60 bg-rose-500/10 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Layers className="h-3.5 w-3.5 text-sky-400" />
                  <span>Split-Screen Stack</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Dual reaction top & bottom
                </div>
              </button>
            </div>

            {/* Horizontal Speaker Pan Controller (For Full Screen Cover) */}
            {(reframeMode === 'center-crop' || reframeMode === 'smart-face') && (
              <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5 text-rose-400" />
                    Speaker Framing / Horizontal Pan
                  </span>
                  <span className="font-mono text-rose-400 font-semibold">{panX}%</span>
                </div>

                {/* Quick Speaker Presets */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdatePan(20)}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-medium border transition-colors ${
                      panX === 20
                        ? 'border-rose-500 bg-rose-500/20 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    👤 Left Speaker (20%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePan(50)}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-medium border transition-colors ${
                      panX === 50
                        ? 'border-rose-500 bg-rose-500/20 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    🎯 Center Focus (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePan(80)}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-medium border transition-colors ${
                      panX === 80
                        ? 'border-rose-500 bg-rose-500/20 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    👥 Right Speaker (80%)
                  </button>
                </div>

                {/* Pan Slider with fine-grained adjustment */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={panX}
                    onChange={(e) => handleUpdatePan(parseFloat(e.target.value))}
                    aria-label="Horizontal framing pan position"
                    className="w-full h-1.5 rounded-lg appearance-none bg-zinc-800 accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>Left Edge (0%)</span>
                    <span>Center (50%)</span>
                    <span>Right Edge (100%)</span>
                  </div>
                </div>
              </div>
            )}
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
              onClick={handleExportReelsVideo}
              disabled={isRenderingExport}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 active:scale-95 disabled:opacity-50 transition-colors"
            >
              {isRenderingExport ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
              ) : (
                <Download className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span>Export 1080×1920 MP4</span>
            </button>

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
