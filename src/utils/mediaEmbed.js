/**
 * Parses any media URL into an embeddable frame descriptor.
 * Supports YouTube, Spotify, Apple Podcasts, SoundCloud, direct MP3/audio streams, and direct video.
 */
export function parseMediaSource(url, audioUrl = '') {
  const targetUrl = (url || audioUrl || '').trim();
  if (!targetUrl) return { type: 'none', embedUrl: '', rawUrl: '' };

  // 1. YouTube video or shorts
  const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1&rel=0`,
      videoId: ytMatch[1],
      rawUrl: targetUrl
    };
  }

  // 2. Spotify episode, show, or track
  const spotifyMatch = targetUrl.match(/open\.spotify\.com\/(episode|show|track)\/([a-zA-Z0-9]+)/i);
  if (spotifyMatch && spotifyMatch[1] && spotifyMatch[2]) {
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}?utm_source=generator&theme=0`,
      rawUrl: targetUrl
    };
  }

  // 3. Apple Podcasts
  if (targetUrl.includes('podcasts.apple.com')) {
    const embedUrl = targetUrl.replace('podcasts.apple.com', 'embed.podcasts.apple.com');
    return {
      type: 'apple',
      embedUrl,
      rawUrl: targetUrl
    };
  }

  // 4. SoundCloud
  if (targetUrl.includes('soundcloud.com')) {
    return {
      type: 'soundcloud',
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(targetUrl)}&color=%235A1E65&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
      rawUrl: targetUrl
    };
  }

  // 5. Direct audio files (.mp3, .wav, .m4a, .aac, .ogg) or audioUrl provided
  if (audioUrl || /\.(mp3|wav|m4a|aac|ogg)(\?.*)?$/i.test(targetUrl)) {
    return {
      type: 'audio',
      src: audioUrl || targetUrl,
      rawUrl: targetUrl
    };
  }

  // 6. Direct video files (.mp4, .webm, .mov)
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(targetUrl)) {
    return {
      type: 'video',
      src: targetUrl,
      rawUrl: targetUrl
    };
  }

  // 7. Generic web preview / iframe fallback
  return {
    type: 'generic_frame',
    embedUrl: targetUrl,
    rawUrl: targetUrl
  };
}

export function formatMediaTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
