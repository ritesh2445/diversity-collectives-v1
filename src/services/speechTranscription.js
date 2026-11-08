/**
 * Diversity Collective Ventura County — Universal Speech Transcription Client
 * Enables network-based voice recognition across ALL browsers (including Brave, Firefox, Safari)
 * Powered by on-demand keyless AI transcription (Puter.js) and Cloudflare Workers AI Whisper.
 */

let puterPromise = null;

/**
 * Lazily loads the Puter.js SDK on-demand
 * @returns {Promise<any>}
 */
export function loadPuterSdk() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.puter?.ai?.speech2txt) return Promise.resolve(window.puter);
  if (puterPromise) return puterPromise;

  puterPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src*="js.puter.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.puter || null));
      if (window.puter) return resolve(window.puter);
    }
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.onload = () => resolve(window.puter || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return puterPromise;
}

/**
 * Transcribes an audio blob into text using network services
 * @param {Blob} audioBlob 
 * @returns {Promise<string>} Transcribed text string
 */
export async function transcribeAudio(audioBlob) {
  if (!audioBlob || audioBlob.size === 0) return '';

  // 1. Try Cloudflare Workers AI backend endpoint (/api/transcribe)
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-command.webm');

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });

    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      if (data?.text?.trim()) {
        return data.text.trim();
      }
    }
  } catch (err) {
    // Cloudflare Worker endpoint unavailable in standalone dev mode, proceed to Puter
  }

  // 2. Try Puter.js Keyless AI Transcription (OpenAI Whisper backend)
  try {
    const puter = await loadPuterSdk();
    if (puter?.ai?.speech2txt) {
      const audioFile = (typeof File !== 'undefined' && !(audioBlob instanceof File))
        ? new File([audioBlob], 'voice-command.webm', { type: audioBlob.type || 'audio/webm' })
        : audioBlob;
      
      const response = await puter.ai.speech2txt(audioFile);
      const text = typeof response === 'string' ? response : (response?.text || '');
      if (text?.trim()) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('[SpeechTranscription] Puter.js transcription error:', err);
  }

  return '';
}
