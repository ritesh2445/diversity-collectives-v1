// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — NATIVE US ENGLISH FEMALE VOICE HELPER
// Selects optimal American English female voice with Chrome keep-alive heartbeat.
// ==========================================================================

let speechKeepAliveTimer = null;

export function getOptimalNativeUSFemaleVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Tier 1: Celebrated high-clarity US English female voices
  const preferredNames = [
    'Samantha',
    'Microsoft Zira',
    'Zira',
    'Microsoft Jenny',
    'Jenny',
    'Microsoft Aria',
    'Aria',
    'Victoria',
    'Google US English',
    'Ava',
    'Allison',
    'Sara',
    'Karen',
    'Siri',
  ];

  for (const name of preferredNames) {
    const found = voices.find(
      (v) =>
        v.name.toLowerCase().includes(name.toLowerCase()) &&
        (v.lang === 'en-US' || v.lang === 'en_US' || v.lang.startsWith('en'))
    );
    if (found) return found;
  }

  // Tier 2: Any en-US voice marked female
  const usFemale = voices.find(
    (v) =>
      (v.lang === 'en-US' || v.lang === 'en_US') &&
      v.name.toLowerCase().includes('female')
  );
  if (usFemale) return usFemale;

  // Tier 3: Any en-US voice
  const usAny = voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US');
  if (usAny) return usAny;

  // Fallback
  return voices.find((v) => v.lang.startsWith('en')) || voices[0];
}

export function createAccessibleUtterance(text, voice, rate = 0.95) {
  // Sanitize text for pronunciation
  const sanitized = text
    .replace(/DCVC/g, 'D C V C')
    .replace(/501\(c\)\(3\)/g, '501 c 3 non-profit')
    .replace(/LGBTQ\+/g, 'L G B T Q plus');

  const utterance = new SpeechSynthesisUtterance(sanitized);
  utterance.rate = rate; // 0.95 optimal comprehension cadence
  utterance.pitch = 1.0;

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || 'en-US';
  } else {
    utterance.lang = 'en-US';
  }

  // Chrome 15-second speech silence watchdog
  const originalOnStart = utterance.onstart;
  const originalOnEnd = utterance.onend;
  const originalOnError = utterance.onerror;

  utterance.onstart = (e) => {
    clearInterval(speechKeepAliveTimer);
    speechKeepAliveTimer = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (!window.speechSynthesis.speaking) {
          clearInterval(speechKeepAliveTimer);
        } else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 10000);

    if (originalOnStart) originalOnStart(e);
  };

  const cleanup = () => {
    clearInterval(speechKeepAliveTimer);
  };

  utterance.onend = (e) => {
    cleanup();
    if (originalOnEnd) originalOnEnd(e);
  };

  utterance.onerror = (e) => {
    cleanup();
    if (originalOnError) originalOnError(e);
  };

  return utterance;
}
