import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  ExternalLink,
  Share2,
  X,
  Radio,
  Headphones,
  Sparkles,
  Clock,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { parseMediaSource, formatMediaTime } from '../utils/mediaEmbed.js';

/**
 * Professional In-Frame Media Player
 * Plays audio, podcasts, and media directly on the site inside an interactive frame
 * with full professional controls (play, pause, scrub, +/-15s, playback rate, volume, theater mode).
 */
export default function ProfessionalMediaPlayerFrame({
  episode,
  onClose,
  theaterMode = false,
  onToggleTheater = () => {}
}) {
  const mediaInfo = parseMediaSource(episode?.link, episode?.audioUrl);

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  // Auto-play audio or video element when source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);

    const activeEl = audioRef.current || videoRef.current;
    if (activeEl) {
      activeEl.currentTime = 0;
      activeEl.playbackRate = playbackSpeed;
      activeEl.volume = isMuted ? 0 : volume;
      activeEl.play().then(() => setIsPlaying(true)).catch(() => {
        // Browser autoplay policy might block unmuted audio initially
        setIsPlaying(false);
      });
    }
  }, [episode?.id, episode?.link, episode?.audioUrl]);

  const togglePlay = () => {
    const el = audioRef.current || videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const skipSeconds = (offset) => {
    const el = audioRef.current || videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + offset));
  };

  const handleSeek = (e) => {
    const el = audioRef.current || videoRef.current;
    if (!el) return;
    const target = parseFloat(e.target.value);
    el.currentTime = target;
    setCurrentTime(target);
  };

  const cycleSpeed = () => {
    const nextIdx = (speedOptions.indexOf(playbackSpeed) + 1) % speedOptions.length;
    const nextSpeed = speedOptions[nextIdx];
    setPlaybackSpeed(nextSpeed);
    const el = audioRef.current || videoRef.current;
    if (el) el.playbackRate = nextSpeed;
  };

  const toggleMute = () => {
    const el = audioRef.current || videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (el) el.muted = nextMuted;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    const el = audioRef.current || videoRef.current;
    if (el) {
      el.volume = val;
      el.muted = val === 0;
    }
  };

  const handleShare = () => {
    if (navigator.clipboard && episode?.slug) {
      const url = `${window.location.origin}/media#${episode.slug}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      });
    }
  };

  if (!episode) return null;

  const isNativeMedia = mediaInfo.type === 'audio' || mediaInfo.type === 'video';

  return (
    <div
      className={`transition-all duration-300 w-full ${
        theaterMode
          ? 'fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto'
          : 'relative mb-10'
      }`}
    >
      <div
        className={`w-full bg-slate-950 text-white rounded-3xl border border-purple-500/30 shadow-2xl overflow-hidden transition-all duration-300 ${
          theaterMode ? 'max-w-5xl my-auto' : 'max-w-7xl mx-auto'
        }`}
      >
        {/* Frame Top Navigation & Header */}
        <div className="bg-gradient-to-r from-purple-950 via-[#3B0E44] to-slate-950 p-4 sm:p-5 px-6 border-b border-purple-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center shrink-0 text-amber-300">
              {mediaInfo.type === 'video' || mediaInfo.type === 'youtube' ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : (
                <Headphones className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  {mediaInfo.type === 'youtube'
                    ? 'YouTube Video Frame'
                    : mediaInfo.type === 'spotify'
                    ? 'Spotify Frame'
                    : mediaInfo.type === 'apple'
                    ? 'Apple Podcasts Frame'
                    : 'DCVC In-Site Player'}
                </span>
                {episode.category && (
                  <span className="text-[11px] font-semibold text-purple-300 hidden sm:inline">
                    · {episode.category}
                  </span>
                )}
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
                {episode.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Copy episode share link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copiedShare && (
              <span className="text-[10px] font-bold text-emerald-400 hidden sm:inline">Copied!</span>
            )}

            <button
              type="button"
              onClick={onToggleTheater}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={theaterMode ? 'Exit Theater Frame' : 'Expand Theater Frame'}
            >
              {theaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {episode.link && (
              <a
                href={episode.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Open original media link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer ml-1"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Frame Screen / Media Canvas */}
        <div className="relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* A. YouTube Video Frame */}
          {mediaInfo.type === 'youtube' && (
            <div className="w-full aspect-video max-h-[560px] bg-black">
              <iframe
                src={mediaInfo.embedUrl}
                title={episode.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* B. Spotify Embed Frame */}
          {mediaInfo.type === 'spotify' && (
            <div className="w-full p-4 sm:p-6 bg-slate-900">
              <iframe
                src={mediaInfo.embedUrl}
                title={episode.title}
                className="w-full h-[232px] sm:h-[352px] rounded-2xl border-0 shadow-lg"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          )}

          {/* C. Apple Podcasts Embed Frame */}
          {mediaInfo.type === 'apple' && (
            <div className="w-full p-4 sm:p-6 bg-slate-900">
              <iframe
                src={mediaInfo.embedUrl}
                title={episode.title}
                className="w-full h-[380px] rounded-2xl border-0 shadow-lg"
                allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                loading="lazy"
              />
            </div>
          )}

          {/* D. SoundCloud Embed Frame */}
          {mediaInfo.type === 'soundcloud' && (
            <div className="w-full p-4 sm:p-6 bg-slate-900">
              <iframe
                src={mediaInfo.embedUrl}
                title={episode.title}
                className="w-full h-[200px] rounded-2xl border-0 shadow-lg"
                allow="autoplay"
                loading="lazy"
              />
            </div>
          )}

          {/* E. Direct Video File (.mp4, .webm) */}
          {mediaInfo.type === 'video' && (
            <div className="w-full aspect-video max-h-[560px] bg-black relative">
              <video
                ref={videoRef}
                src={mediaInfo.src}
                className="w-full h-full object-contain"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setIsPlaying(false)}
                playsInline
              />
            </div>
          )}

          {/* F. Audio / Podcast Stream Mode (Interactive Visualizer Screen) */}
          {(mediaInfo.type === 'audio' || mediaInfo.type === 'generic_frame') && (
            <div className="w-full py-8 sm:py-12 px-6 sm:px-12 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 relative overflow-hidden">
              {/* Cover Artwork with Animated Glow */}
              <div className="relative w-40 sm:w-48 aspect-square rounded-2xl overflow-hidden shadow-2xl border border-purple-500/40 shrink-0 group">
                <img
                  src={episode.coverImage || '/images/community-gathering.jpg'}
                  alt={episode.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-amber-300">
                  <span>Episode {episode.episodeNumber || 1}</span>
                  {episode.duration && <span>{episode.duration}</span>}
                </div>
              </div>

              {/* Episode Metadata & Animated Soundwave Bars */}
              <div className="flex-1 min-w-0 text-center md:text-left space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs font-bold text-amber-300">
                  <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse text-amber-400' : 'text-slate-400'}`} />
                  <span>{isPlaying ? 'Live In-Site Playback' : 'Ready to Play'}</span>
                </div>

                <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                  {episode.title}
                </h2>

                {episode.guests && (
                  <p className="text-xs sm:text-sm text-purple-200/90 font-medium">
                    <span className="text-amber-300 font-bold">Featured Guests:</span> {episode.guests}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl line-clamp-2">
                  {episode.summary || episode.description}
                </p>

                {/* Animated Sound Equalizer Waves */}
                <div className="pt-2 flex items-center justify-center md:justify-start gap-1 h-6">
                  {[40, 75, 55, 95, 60, 85, 45, 90, 65, 80, 50, 70].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full bg-gradient-to-t from-amber-400 to-purple-400 transition-all duration-300 ${
                        isPlaying ? 'animate-pulse' : 'opacity-40'
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(15, (h * ((i % 3) + 1)) % 100)}%` : '20%',
                        animationDelay: `${i * 90}ms`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Hidden native audio element */}
              {mediaInfo.src && (
                <audio
                  ref={audioRef}
                  src={mediaInfo.src}
                  onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                  onEnded={() => setIsPlaying(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Professional Media Controls Console (Active for native audio & video) */}
        {(isNativeMedia || mediaInfo.type === 'generic_frame') && (
          <div className="bg-slate-900/95 border-t border-purple-500/20 p-4 sm:p-6 space-y-4">
            {/* Timeline Progress Scrubber */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
                <span className="text-amber-300">{formatMediaTime(currentTime)}</span>
                <span>{formatMediaTime(duration || (parseFloat(episode.duration) * 60) || 0)}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition-all focus:outline-none"
                  aria-label="Seek timeline"
                />
              </div>
            </div>

            {/* Transport & Setting Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left: Playback Rate & Skip */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cycleSpeed}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-amber-300 border border-slate-700 hover:border-amber-400 transition-all cursor-pointer"
                  title="Playback speed"
                >
                  {playbackSpeed}x
                </button>

                <button
                  type="button"
                  onClick={() => skipSeconds(-15)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Rewind 15 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Center: Main Play / Pause Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => skipSeconds(15)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fast-forward 15 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Right: Volume & Mute */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-300" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
                  aria-label="Volume slider"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
