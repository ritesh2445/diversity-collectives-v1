import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw as RewindIcon, 
  RotateCw as ForwardIcon,
  Music, 
  Mic, 
  Minus, 
  Plus, 
  Languages, 
  Palette, 
  Ruler, 
  MousePointer2, 
  Layers, 
  FileText, 
  Search, 
  BookOpen, 
  Download, 
  BookMarked, 
  RotateCcw, 
  SunMoon, 
  X,
  Volume2,
  Check,
  HelpCircle,
  Compass,
  WifiOff,
  Send,
  RefreshCw,
  Copy,
  Loader2,
  MicOff
} from 'lucide-react';
import { a11yStore } from '../../accessibility/a11yStore';
import { focusAudio } from '../../accessibility/focusAudio';
import { getOptimalNativeUSFemaleVoice, createAccessibleUtterance } from '../../accessibility/voiceHelper';
import { translationService, SUPPORTED_LANGUAGES } from '../../services/translationService';
import { 
  parseVoiceIntent, 
  tapElementByVoice, 
  VOICE_COMMAND_CATEGORIES 
} from '../../accessibility/voiceCommands';
import { transcribeAudio } from '../../services/speechTranscription';

export default function ReciteToolbar() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(a11yStore.getState());
  const [activeFlyout, setActiveFlyout] = useState(null); // 'music' | 'font' | 'focusText' | 'lang' | 'color' | 'dict' | 'guide'
  
  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [femaleVoice, setFemaleVoice] = useState(null);

  // Focus Music state
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null); // 'focus' | 'deeper' | null
  const [musicVolume, setMusicVolume] = useState(0.5);

  // Voice command state & Live Speech HUD (Native & Network Mode)
  const [isListening, setIsListening] = useState(false);
  const [isNetworkRecording, setIsNetworkRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceHudVisible, setVoiceHudVisible] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isBraveBrowser, setIsBraveBrowser] = useState(false);
  const [copiedSiteUrl, setCopiedSiteUrl] = useState(false);
  const [offlineInput, setOfflineInput] = useState('');
  const [networkHelpOpen, setNetworkHelpOpen] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechFeedback, setSpeechFeedback] = useState('');
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [micError, setMicError] = useState(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const networkErrorCountRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const lastVoiceCommandRef = useRef({ text: '', timestamp: 0 });

  // Dictionary state
  const [dictWord, setDictWord] = useState('');
  const [dictDefinition, setDictDefinition] = useState(null);
  const [dictLoading, setDictLoading] = useState(false);

  const toolbarRef = useRef(null);
  const currentHoveredElRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Helper to query readable DOM elements
  const getReadableElements = () => {
    if (typeof document === 'undefined') return [];
    const elements = Array.from(document.querySelectorAll('main p, main h1, main h2, main h3, main li'));
    return elements.filter(el => {
      const text = el.innerText?.trim();
      return text && text.length > 2 && !el.closest('.a11y-toolbar-isolated');
    });
  };

  const clearHighlight = () => {
    const list = getReadableElements();
    list.forEach(p => p.classList.remove('recite-reading-active-paragraph'));
    if (currentHoveredElRef.current) {
      currentHoveredElRef.current.classList.remove('recite-reading-active-paragraph');
      currentHoveredElRef.current = null;
    }
  };

  // Sync settings
  useEffect(() => {
    const unsubscribe = a11yStore.subscribe((newSettings) => {
      setSettings(newSettings);
      if (!newSettings.toolbarOpen) {
        focusAudio.stop();
        setMusicPlaying(false);
        setActiveTrack(null);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) {}
          recognitionRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          try { mediaRecorderRef.current.stop(); } catch (e) {}
        }
        if (mediaStreamRef.current) {
          try { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) {}
        }
        clearTimeout(vadIntervalRef.current);
        isListeningRef.current = false;
        setIsListening(false);
        setIsNetworkRecording(false);
        setIsTranscribing(false);
        setVoiceHudVisible(false);
        setIsOfflineMode(false);
        networkErrorCountRef.current = 0;
        clearHighlight();
        setActiveFlyout(null);
      }
    });
    return () => {
      unsubscribe();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) {}
      }
      clearTimeout(vadIntervalRef.current);
      isListeningRef.current = false;
      setIsNetworkRecording(false);
      setIsTranscribing(false);
      setVoiceHudVisible(false);
      setIsOfflineMode(false);
      networkErrorCountRef.current = 0;
    };
  }, []);

  // Detect Brave Browser (Brave shields Google Speech cloud by default)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.navigator?.brave && typeof window.navigator.brave.isBrave === 'function') {
        window.navigator.brave.isBrave().then((val) => {
          if (val) setIsBraveBrowser(true);
        }).catch(() => {});
      } else if (navigator.userAgent && navigator.userAgent.toLowerCase().includes('brave')) {
        setIsBraveBrowser(true);
      }
    }
  }, []);

  // Initialize Native US Female Voice
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoice = () => {
        const bestVoice = getOptimalNativeUSFemaleVoice();
        if (bestVoice) {
          setFemaleVoice(bestVoice);
        }
      };
      loadVoice();
      window.speechSynthesis.onvoiceschanged = loadVoice;
    }
  }, []);

  // CURSOR HOVER SPEECH: Speaks the exact element where the cursor moves
  useEffect(() => {
    if (!settings.toolbarOpen || !settings.autoReadHover) {
      if (currentHoveredElRef.current) {
        currentHoveredElRef.current.classList.remove('recite-reading-active-paragraph');
        currentHoveredElRef.current = null;
      }
      return;
    }

    const handlePointerOver = (e) => {
      // Ignore toolbar controls
      if (e.target.closest('.a11y-toolbar-isolated')) return;

      // Find the specific text element directly under the cursor
      const target = e.target.closest('h1, h2, h3, h4, h5, h6, p, a, button, li, label, blockquote, [role="button"]') || e.target;
      if (!target) return;

      const text = target.innerText?.trim() || (target.tagName === 'IMG' ? target.alt : '');
      if (!text || text.length < 2) return;

      // Don't re-read if cursor is already within the same element
      if (currentHoveredElRef.current === target) return;
      currentHoveredElRef.current = target;

      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        // Clear all other highlights
        document.querySelectorAll('.recite-reading-active-paragraph').forEach(el => {
          el.classList.remove('recite-reading-active-paragraph');
        });

        // Visually highlight the exact element where cursor is
        target.classList.add('recite-reading-active-paragraph');

        // Stop any previous audio
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }

        // Play the speech where the cursor is
        const utterance = createAccessibleUtterance(text, femaleVoice, 0.95);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }, 100);
    };

    document.addEventListener('pointerover', handlePointerOver);

    return () => {
      document.removeEventListener('pointerover', handlePointerOver);
      clearTimeout(hoverTimeoutRef.current);
    };
  }, [settings.toolbarOpen, settings.autoReadHover, femaleVoice]);


  // Speak element at specific index
  const speakAtIndex = (index) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }

    const list = getReadableElements();
    if (!list || list.length === 0) {
      a11yStore.announce('No readable text elements found on page.');
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, list.length - 1));
    setCurrentParagraphIndex(safeIndex);

    clearHighlight();
    const targetElement = list[safeIndex];
    targetElement.classList.add('recite-reading-active-paragraph');
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.speechSynthesis.cancel();
    const utterance = createAccessibleUtterance(targetElement.innerText, femaleVoice, 0.95);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      clearHighlight();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      clearHighlight();
    };

    window.speechSynthesis.speak(utterance);
    a11yStore.announce(`Reading section ${safeIndex + 1} of ${list.length}`);
  };

  // Play / Pause
  const handlePlayPause = () => {
    if (isSpeaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsSpeaking(true);
        a11yStore.announce('Speech resumed');
      } else {
        window.speechSynthesis.pause();
        setIsSpeaking(false);
        a11yStore.announce('Speech paused');
      }
    } else {
      const selected = window.getSelection()?.toString().trim();
      if (selected) {
        window.speechSynthesis.cancel();
        const utterance = createAccessibleUtterance(selected, femaleVoice, 0.95);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        a11yStore.announce('Reading selected text');
      } else {
        speakAtIndex(currentParagraphIndex);
      }
    }
  };

  const handleSkipBack = () => {
    const newIdx = Math.max(0, currentParagraphIndex - 1);
    speakAtIndex(newIdx);
  };

  const handleSkipForward = () => {
    const list = getReadableElements();
    const newIdx = Math.min(list.length - 1, currentParagraphIndex + 1);
    speakAtIndex(newIdx);
  };

  // Rewind slightly
  const handleRewindSmall = () => {
    speakAtIndex(currentParagraphIndex);
  };

  // Forward slightly
  const handleForwardSmall = () => {
    handleSkipForward();
  };

  // Focus Audio Handlers
  const handleToggleFocusTrack = (trackName) => {
    if (activeTrack === trackName && musicPlaying) {
      focusAudio.stop();
      setMusicPlaying(false);
      setActiveTrack(null);
      a11yStore.announce('Focus music stopped');
    } else {
      if (trackName === 'focus') {
        focusAudio.playFocusTrack();
      } else {
        focusAudio.playDeeperReadingTrack();
      }
      focusAudio.setVolume(musicVolume);
      setMusicPlaying(true);
      setActiveTrack(trackName);
      a11yStore.announce(`${trackName === 'focus' ? 'Focus 432Hz ambient track' : 'Deeper reading ambient track'} playing`);
    }
  };

  const handleVolumeChange = (newVol) => {
    setMusicVolume(newVol);
    focusAudio.setVolume(newVol);
  };

  // Smooth programmatic route navigation by voice (keeps mic listening alive without full document reload)
  const handleNavigateByVoice = (routePath, pageLabel) => {
    setSpeechFeedback(`Opening ${pageLabel}... 🚀`);
    a11yStore.announce(`Opening ${pageLabel}`);
    navigate(routePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // High-Precision Hands-Free Voice Controller with Comprehensive Intent Dispatcher
  const executeVoiceCommand = (rawText, isFinal = false) => {
    if (!rawText) return;
    const text = rawText.trim().toLowerCase();

    // Prevent rapid double-firing of duplicate commands within 1200ms
    const now = Date.now();
    if (
      lastVoiceCommandRef.current.text === text &&
      now - lastVoiceCommandRef.current.timestamp < 1200
    ) {
      return;
    }

    const intent = parseVoiceIntent(text);
    if (!intent) return;

    lastVoiceCommandRef.current = { text, timestamp: now };

    switch (intent.type) {
      case 'HELP':
        setShowVoiceHelp((prev) => !prev);
        setSpeechFeedback('Voice Commands Cheat Sheet 📖');
        a11yStore.announce('Showing voice command cheat sheet: scroll to top, tap buttons, open pages, read, or contrast.');
        break;

      case 'SCROLL':
        if (intent.target === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setSpeechFeedback('Scrolled to Top ⬆');
          a11yStore.announce('Scrolled to top of page');
        } else if (intent.target === 'bottom') {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          setSpeechFeedback('Scrolled to Bottom ⬇');
          a11yStore.announce('Scrolled to bottom of page');
        } else if (intent.target === 'halfway') {
          window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
          setSpeechFeedback('Scrolled to Middle ↕');
          a11yStore.announce('Scrolled to middle of page');
        } else if (intent.target === 'fast_down') {
          window.scrollBy({ top: 850, behavior: 'smooth' });
          setSpeechFeedback('Fast Scrolled Down ⏬');
        } else if (intent.target === 'small_down') {
          window.scrollBy({ top: 220, behavior: 'smooth' });
          setSpeechFeedback('Scrolled a Bit ⬇');
        } else if (intent.target === 'down') {
          window.scrollBy({ top: 480, behavior: 'smooth' });
          setSpeechFeedback('Scrolled Down ⬇');
        } else if (intent.target === 'up') {
          window.scrollBy({ top: -480, behavior: 'smooth' });
          setSpeechFeedback('Scrolled Up ⬆');
        }
        break;

      case 'TAP': {
        const tapped = tapElementByVoice(intent.target, {
          setSpeechFeedback,
          announce: (msg) => a11yStore.announce(msg),
          handleNavigate: handleNavigateByVoice
        });
        if (!tapped) {
          setSpeechFeedback(`Target not found: "${intent.target}"`);
          a11yStore.announce(`Could not find button or link for ${intent.target}`);
        }
        break;
      }

      case 'NAVIGATE':
        handleNavigateByVoice(intent.path, intent.label);
        break;

      case 'SEARCH': {
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i], input[name*="search" i]'
        );
        if (searchInput) {
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          searchInput.focus();
          searchInput.value = intent.query;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          setSpeechFeedback(`Searching: "${intent.query}" 🔍`);
          a11yStore.announce(`Searching for ${intent.query}`);
        } else {
          setSpeechFeedback(`Searching for "${intent.query}" in Directory... 🔍`);
          handleNavigateByVoice(`/directory?q=${encodeURIComponent(intent.query)}`, 'Directory Search');
        }
        break;
      }

      case 'CLEAR_SEARCH': {
        const curSearch = document.querySelector('input[type="search"], input[placeholder*="search" i]');
        if (curSearch) {
          curSearch.value = '';
          curSearch.dispatchEvent(new Event('input', { bubbles: true }));
          setSpeechFeedback('Search Cleared ✕');
        }
        break;
      }

      case 'SUBMIT_FORM': {
        const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], [role="button"][data-submit="true"]');
        if (submitBtn) {
          submitBtn.click();
          setSpeechFeedback('Submitted Form 📤');
        }
        break;
      }

      case 'CHATBOT':
        if (intent.action === 'open') {
          window.dispatchEvent(new CustomEvent('openAskDcvc'));
          setSpeechFeedback('Opened Ask DCVC Chat 💬');
          a11yStore.announce('Ask DCVC Chatbot opened');
        } else {
          window.dispatchEvent(new CustomEvent('closeAskDcvc'));
          setSpeechFeedback('Closed Chatbot ✕');
        }
        break;

      case 'READ_ALOUD':
        if (intent.action === 'play') {
          handlePlayPause();
          setSpeechFeedback('Reading Aloud ▶');
        } else if (intent.action === 'pause') {
          handlePlayPause();
          setSpeechFeedback('Reading Paused ⏸');
        } else if (intent.action === 'stop') {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          clearHighlight();
          setSpeechFeedback('Speech Stopped ⏹');
        } else if (intent.action === 'next') {
          handleSkipForward();
          setSpeechFeedback('Next Paragraph ⏭');
        } else if (intent.action === 'prev') {
          handleSkipBack();
          setSpeechFeedback('Previous Paragraph ⏮');
        }
        break;

      case 'FONT':
        if (intent.action === 'increase') {
          handleIncreaseFont();
          setSpeechFeedback('Font Size Increased (+)');
        } else if (intent.action === 'decrease') {
          handleDecreaseFont();
          setSpeechFeedback('Font Size Decreased (-)');
        } else if (intent.action === 'reset') {
          a11yStore.setFontSize('100%');
          setSpeechFeedback('Font Size Reset (100%)');
        }
        break;

      case 'THEME':
        handleCycleTheme();
        setSpeechFeedback('Color Theme Switched 🎨');
        break;

      case 'TOOL':
        if (intent.tool === 'ruler') {
          a11yStore.toggleRuler();
          setSpeechFeedback('Reading Ruler Toggled 📏');
        } else if (intent.tool === 'mask') {
          a11yStore.toggleScreenMask();
          setSpeechFeedback('Screen Mask Toggled 🎭');
        }
        break;

      case 'MUSIC':
        if (intent.action === 'toggle') {
          handleToggleFocusTrack('focus');
          setSpeechFeedback('Focus Audio Toggled 🎵');
        } else if (intent.action === 'vol_up') {
          const nextVol = Math.min(1, Math.round((musicVolume + 0.2) * 10) / 10);
          handleVolumeChange(nextVol);
          setSpeechFeedback(`Volume: ${Math.round(nextVol * 100)}% 🔊`);
        } else if (intent.action === 'vol_down') {
          const prevVol = Math.max(0, Math.round((musicVolume - 0.2) * 10) / 10);
          handleVolumeChange(prevVol);
          setSpeechFeedback(`Volume: ${Math.round(prevVol * 100)}% 🔉`);
        }
        break;

      case 'TOOLBAR':
        if (intent.action === 'open') {
          a11yStore.update('toolbarOpen', true);
          setSpeechFeedback('Toolbar Opened 🎛️');
        } else {
          a11yStore.update('toolbarOpen', false);
          setSpeechFeedback('Toolbar Closed ✕');
        }
        break;

      case 'RESET_ALL':
        a11yStore.resetAll();
        setSpeechFeedback('All Settings Restored 🔄');
        break;

      case 'QUICK_EXIT':
        setSpeechFeedback('Emergency Quick Exit Activated 🛡️');
        window.location.replace('https://www.google.com');
        break;

      case 'MIC':
        handleToggleMic();
        break;

      case 'REPLAY_WELCOME':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.dispatchEvent(new CustomEvent('replayWelcomeAnimation'));
        setSpeechFeedback('Replaying Welcome Animation 🌈');
        break;

      default:
        break;
    }
  };

  // Offline Command Form Submission
  const handleOfflineSubmit = (e) => {
    if (e) e.preventDefault();
    const cmd = offlineInput.trim();
    if (!cmd) return;
    setSpeechTranscript(cmd);
    executeVoiceCommand(cmd, true);
    setOfflineInput('');
  };

  // Retry Voice Recognition Microphone
  const handleRetryMic = () => {
    setIsOfflineMode(false);
    setMicError(null);
    networkErrorCountRef.current = 0;
    setVoiceHudVisible(true);
    if (isBraveBrowser || (!window.SpeechRecognition && !window.webkitSpeechRecognition)) {
      startNetworkRecording();
    } else {
      setTimeout(() => {
        handleToggleMic();
      }, 120);
    }
  };

  // Copy Site URL to Clipboard (for testing in Chrome / Edge)
  const handleCopySiteUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href || 'http://localhost:5173');
      setCopiedSiteUrl(true);
      setTimeout(() => setCopiedSiteUrl(false), 2500);
    }
  };

  // Universal Network Voice Recording (Supported on 100% of browsers including Brave, Firefox & Safari)
  const startNetworkRecording = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setIsOfflineMode(true);
      setSpeechFeedback('Microphone not supported on this device.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
        recognitionRef.current = null;
      }
      setVoiceHudVisible(true);
      isListeningRef.current = false;
      setIsListening(false);
      setIsOfflineMode(false);
      setMicError(null);
      setSpeechTranscript('');
      setSpeechFeedback('Listening (Network Voice)... Speak now 🎙️');
      setIsNetworkRecording(true);
      a11yStore.announce('Network voice listening active. Speak your command now.');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // AudioContext Analyser for live volume metering & automatic silence detection
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let silenceCount = 0;
          let hasSpoken = false;

          const checkVolume = () => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round(avg * 2.5)));

            if (avg > 14) {
              hasSpoken = true;
              silenceCount = 0;
            } else if (hasSpoken) {
              silenceCount++;
              // Automatically stop and transcribe after 1.4s of silence
              if (silenceCount > 14) {
                stopNetworkRecording();
                return;
              }
            }
            vadIntervalRef.current = setTimeout(checkVolume, 100);
          };
          vadIntervalRef.current = setTimeout(checkVolume, 100);
        } catch (audioErr) {
          console.warn('[AudioContext VAD]', audioErr);
        }
      }

      // MediaRecorder initialization
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        clearTimeout(vadIntervalRef.current);
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch (e) {}
          audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        setIsNetworkRecording(false);
        setAudioLevel(0);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });

        if (audioBlob.size > 800) {
          setIsTranscribing(true);
          setSpeechFeedback('Transcribing voice command... ⚡');
          try {
            const transcript = await transcribeAudio(audioBlob);
            setIsTranscribing(false);
            if (transcript && transcript.trim()) {
              setSpeechTranscript(transcript.trim());
              setSpeechFeedback(`Heard: "${transcript.trim()}"`);
              executeVoiceCommand(transcript.trim(), true);
            } else {
              setSpeechFeedback('No speech detected. Click "Speak" to try again.');
            }
          } catch (err) {
            setIsTranscribing(false);
            setSpeechFeedback('Speech transcription error. Click "Speak" to try again.');
          }
        } else {
          setSpeechFeedback('Recording too short. Click "Speak" to try again.');
        }
      };

      recorder.start(200);
    } catch (err) {
      console.warn('[NetworkRecording Error]', err);
      setIsNetworkRecording(false);
      setIsOfflineMode(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission blocked. Please allow microphone in browser address bar.');
      } else {
        setMicError('Could not start microphone recording.');
      }
    }
  };

  const stopNetworkRecording = () => {
    clearTimeout(vadIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Voice Command (Microphone) Handler with Seamless Universal Browser Support
  const handleToggleMic = () => {
    if (voiceHudVisible || isListeningRef.current || isNetworkRecording || isOfflineMode) {
      if (isNetworkRecording) {
        stopNetworkRecording();
      }
      isListeningRef.current = false;
      setIsListening(false);
      setIsNetworkRecording(false);
      setIsTranscribing(false);
      setIsOfflineMode(false);
      setVoiceHudVisible(false);
      networkErrorCountRef.current = 0;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
        recognitionRef.current = null;
      }
      a11yStore.announce('Voice command listening stopped.');
      setSpeechFeedback('Voice listening paused.');
      return;
    }

    setVoiceHudVisible(true);

    // In Brave or when SpeechRecognition is absent/unsupported, start Universal Network Recording!
    if (isBraveBrowser || (!window.SpeechRecognition && !window.webkitSpeechRecognition)) {
      startNetworkRecording();
      return;
    }

    // In Chrome or Edge, use native Web Speech with instant fallback to Network Recording
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      const detectedLang = (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages && navigator.languages[0]))) || 'en-US';
      recognition.lang = detectedLang;

      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
      setIsOfflineMode(false);
      setMicError(null);
      setSpeechTranscript('');
      setSpeechFeedback('Listening... Speak a command');

      recognition.onstart = () => {
        setIsListening(true);
        setIsOfflineMode(false);
        networkErrorCountRef.current = 0;
        a11yStore.announce('Hands-free voice listening active.');
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += piece;
          } else {
            interim += piece;
          }
        }
        const text = (final || interim).trim().toLowerCase();
        if (text) {
          setSpeechTranscript(text);
          executeVoiceCommand(text, Boolean(final));
        }
      };

      recognition.onerror = (event) => {
        console.warn('[ReciteToolbar Mic Error]', event.error);
        if (event.error === 'network' || event.error === 'not-allowed' || event.error === 'language-not-supported') {
          // Immediately seamlessly fall back to Network Speech Recording!
          isListeningRef.current = false;
          setIsListening(false);
          startNetworkRecording();
        } else if (event.error !== 'no-speech') {
          setSpeechFeedback(`Notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && !isOfflineMode && !isNetworkRecording) {
          try {
            recognition.start();
          } catch (e) {
            setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current && !isOfflineMode) {
                try { recognitionRef.current.start(); } catch (err) {}
              }
            }, 300);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (err) {
      startNetworkRecording();
    }
  };

  // Font Size Steps
  const handleDecreaseFont = () => {
    const sizes = [100, 110, 125, 150, 175, 200];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      const newSize = sizes[currentIndex - 1];
      a11yStore.update('fontSize', newSize);
      a11yStore.announce(`Font size ${newSize}%`);
    }
  };

  const handleIncreaseFont = () => {
    const sizes = [100, 110, 125, 150, 175, 200];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex < sizes.length - 1) {
      const newSize = sizes[currentIndex + 1];
      a11yStore.update('fontSize', newSize);
      a11yStore.announce(`Font size ${newSize}%`);
    }
  };

  // Dictionary Lookup
  const handleLookup = async () => {
    const word = dictWord.trim() || window.getSelection()?.toString().trim();
    if (!word) {
      a11yStore.announce('Please enter or select a word to look up.');
      return;
    }

    setDictLoading(true);
    setDictWord(word);
    setDictDefinition(null);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (res.ok) {
        const data = await res.json();
        setDictDefinition(data[0]);
      } else {
        setDictDefinition({
          word,
          meanings: [{
            partOfSpeech: 'noun',
            definitions: [{ definition: 'Definition not found in public database. Please verify spelling.' }]
          }]
        });
      }
    } catch {
      setDictDefinition({
        word,
        meanings: [{
          partOfSpeech: 'general',
          definitions: [{ definition: 'Offline or connection interrupted. Please try again.' }]
        }]
      });
    } finally {
      setDictLoading(false);
    }
  };

  // Download Audio Transcript
  const handleDownloadTranscript = () => {
    const selected = window.getSelection()?.toString().trim();
    const mainEl = document.querySelector('main');
    const textToSave = selected || (mainEl ? mainEl.innerText : document.body.innerText);

    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DCVC-Accessible-Audio-Transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    a11yStore.announce('Accessible transcript text file downloaded.');
  };

  // Quick contrast theme cycler
  const handleCycleTheme = () => {
    const themes = ['default', 'yellow-on-black', 'black-on-yellow', 'white-on-blue', 'black-on-peach', 'inverted', 'monochrome'];
    const nextIdx = (themes.indexOf(settings.colorTheme) + 1) % themes.length;
    a11yStore.update('colorTheme', themes[nextIdx]);
    a11yStore.announce(`Theme set to ${themes[nextIdx]}`);
  };

  // Close flyout on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (activeFlyout && toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setActiveFlyout(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [activeFlyout]);

  if (!settings.toolbarOpen && !voiceHudVisible && !isListening && !isNetworkRecording && !isTranscribing && !isOfflineMode && !micError) return null;

  return (
    <>
      {/* ================================================================
          TOP ACCESSIBILITY COMPANION RIBBON
          ================================================================ */}
      {settings.toolbarOpen && (
        <div
          ref={toolbarRef}
          id="native-accessibility-companion-ribbon"
      role="region"
      aria-label="Native Accessibility Companion Toolbar"
      className="fixed top-0 left-0 right-0 z-[100000] bg-[#0B1528] text-white shadow-2xl border-b-2 border-slate-700 a11y-toolbar-isolated select-none"
    >
      <div className="max-w-[1920px] mx-auto px-2 sm:px-3 py-1 flex items-center justify-between gap-1 overflow-x-auto">

        {/* ================================================================
            CLUSTER 1: SPEECH HEAD + AUDIO PLAYBACK CONTROLS
            ================================================================ */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          
          {/* Active Speech / Cursor Audio Toggle Button */}
          <button 
            type="button"
            onClick={() => {
              const next = !settings.autoReadHover;
              a11yStore.update('autoReadHover', next);
              a11yStore.announce(next ? 'Cursor hover audio enabled: moving cursor over text plays audio' : 'Cursor hover audio turned off');
              if (!next && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                clearHighlight();
              }
            }}
            className={`w-9 h-9 rounded-md flex items-center justify-center relative cursor-pointer shadow-xs transition-all ${
              settings.autoReadHover ? 'bg-[#059669] text-white ring-2 ring-emerald-300' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={settings.autoReadHover ? `Cursor Audio is ACTIVE (Playing sound where cursor moves). Click to pause.` : `Cursor Audio is OFF. Click to enable hover-to-read.`}
            aria-pressed={settings.autoReadHover}
            aria-label="Toggle Cursor Hover Audio"
          >
            <div className="flex flex-col items-center">
              <Volume2 className="w-4 h-4 fill-current" />
              <div className={`w-5 h-0.5 rounded-full mt-0.5 ${settings.autoReadHover ? 'bg-red-500' : 'bg-slate-500'}`} />
            </div>
          </button>

          {/* Skip Back |◀ */}
          <button
            onClick={handleSkipBack}
            className="w-8 h-9 rounded-md bg-transparent hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Previous section (|◀)"
            aria-label="Previous section"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Rewind ↶ */}
          <button
            onClick={handleRewindSmall}
            className="w-8 h-9 rounded-md bg-transparent hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Rewind (↶)"
            aria-label="Rewind"
          >
            <RewindIcon className="w-4 h-4" />
          </button>

          {/* Play / Pause ▶ */}
          <button
            onClick={handlePlayPause}
            className="w-9 h-9 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title={isSpeaking ? 'Pause reading' : 'Play reading aloud'}
            aria-label={isSpeaking ? 'Pause reading' : 'Play reading aloud'}
          >
            {isSpeaking ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Forward ↷ */}
          <button
            onClick={handleForwardSmall}
            className="w-8 h-9 rounded-md bg-transparent hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Forward (↷)"
            aria-label="Forward"
          >
            <ForwardIcon className="w-4 h-4" />
          </button>

          {/* Skip Forward ▶| */}
          <button
            onClick={handleSkipForward}
            className="w-8 h-9 rounded-md bg-transparent hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Next section (▶|)"
            aria-label="Next section"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* ================================================================
            CLUSTER 2: FOCUS MUSIC (ROYALTY-FREE) + MICROPHONE VOICE
            ================================================================ */}
        <div className="flex items-center gap-1 px-1 border-l border-slate-800 flex-shrink-0">
          
          {/* Focus Audio Button & Dropdown Flyout */}
          <div className="relative">
            <button
              onClick={() => setActiveFlyout(activeFlyout === 'music' ? null : 'music')}
              className={`w-9 h-9 rounded-md flex items-center justify-center relative transition-all cursor-pointer ${
                musicPlaying ? 'bg-[#059669] text-white ring-2 ring-emerald-400' : 'bg-[#059669] text-white hover:bg-[#047857]'
              }`}
              title="Focus Audio (Royalty-free ambient tones for reading)"
              aria-haspopup="true"
              aria-expanded={activeFlyout === 'music'}
            >
              <Music className="w-4 h-4" />
              <div className="w-5 h-0.5 bg-emerald-300 rounded-full absolute bottom-1" />
            </button>

            {/* Exact Focus Audio Flyout Dialog matching user request */}
            {activeFlyout === 'music' && (
              <div className="absolute top-full left-0 mt-2 w-80 p-5 bg-[#0B1528] text-white rounded-2xl shadow-2xl border-2 border-slate-700 z-[100002] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-white tracking-tight">Focus Audio</h3>
                  <button
                    onClick={() => setActiveFlyout(null)}
                    className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                    aria-label="Close Focus Audio"
                  >
                    ✕
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Volume</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={musicVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Status Message */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">⏸</span>
                  <p>
                    {musicPlaying 
                      ? `Now playing: ${activeTrack === 'focus' ? 'Focus 432Hz Ambient Resonance' : 'Deeper Reading Calming Waves'}`
                      : 'Audio paused. Click below to start playing royalty-free calming tones.'}
                  </p>
                </div>

                {/* Track 1: Focus */}
                <button
                  onClick={() => handleToggleFocusTrack('focus')}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    activeTrack === 'focus' && musicPlaying
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm">Focus (432Hz Calm)</span>
                  {activeTrack === 'focus' && musicPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                {/* Track 2: Deeper Reading */}
                <button
                  onClick={() => handleToggleFocusTrack('deeper')}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    activeTrack === 'deeper' && musicPlaying
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm">Deeper Reading (Brown Noise)</span>
                  {activeTrack === 'deeper' && musicPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
              </div>
            )}
          </div>

          {/* Microphone / Voice Recognition Navigation */}
          <button
            onClick={handleToggleMic}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              isListening || isNetworkRecording || isTranscribing
                ? 'bg-rose-600 text-white animate-pulse'
                : isOfflineMode
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : voiceHudVisible
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                    : 'bg-[#059669] text-white hover:bg-[#047857]'
            }`}
            title={
              isListening || isNetworkRecording || isTranscribing
                ? 'Listening for voice commands (Click to stop)...'
                : voiceHudVisible || isOfflineMode
                  ? 'Voice command HUD active (Click to close)'
                  : 'Enable hands-free voice command navigation'
            }
            aria-label="Voice command microphone"
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : isOfflineMode ? (
              <WifiOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* ================================================================
            CLUSTER 3: TEXT STYLING (- | Aa | FT | +)
            ================================================================ */}
        <div className="flex items-center gap-1 px-1 border-l border-slate-800 flex-shrink-0">
          
          {/* Minus: Font Size Decrease */}
          <button
            onClick={handleDecreaseFont}
            className="w-9 h-9 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm flex items-center justify-center transition-colors cursor-pointer"
            title="Decrease Font Size (-)"
            aria-label="Decrease Font Size"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Aa: Font Style Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveFlyout(activeFlyout === 'font' ? null : 'font')}
              className={`w-9 h-9 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer ${
                activeFlyout === 'font' ? 'ring-2 ring-sky-300' : ''
              }`}
              title="Font Family (OpenDyslexic, Atkinson, etc.)"
              aria-haspopup="true"
              aria-expanded={activeFlyout === 'font'}
            >
              Aa
            </button>

            {activeFlyout === 'font' && (
              <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-[#0B1528] text-white rounded-2xl shadow-2xl border-2 border-slate-700 z-[100002] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-extrabold text-xs text-sky-400 uppercase tracking-wider">Font Family</span>
                  <button onClick={() => setActiveFlyout(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'default', label: 'Default Sanctuary' },
                    { id: 'opendyslexic', label: 'OpenDyslexic' },
                    { id: 'atkinson', label: 'Atkinson Legible' },
                    { id: 'arial', label: 'Arial Clean' },
                    { id: 'comicsans', label: 'Comic Sans' },
                    { id: 'verdana', label: 'Verdana' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        a11yStore.update('fontFamily', f.id);
                        a11yStore.announce(`Font set to ${f.label}`);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold text-left border cursor-pointer ${
                        settings.fontFamily === f.id
                          ? 'bg-sky-600 text-white border-sky-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FT: Focus Text / Spacing */}
          <div className="relative">
            <button
              onClick={() => setActiveFlyout(activeFlyout === 'focusText' ? null : 'focusText')}
              className={`w-9 h-9 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer ${
                activeFlyout === 'focusText' ? 'ring-2 ring-sky-300' : ''
              }`}
              title="Focus Text (Line height, letter & word spacing)"
              aria-haspopup="true"
              aria-expanded={activeFlyout === 'focusText'}
            >
              FT
            </button>

            {activeFlyout === 'focusText' && (
              <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-[#0B1528] text-white rounded-2xl shadow-2xl border-2 border-slate-700 z-[100002] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-extrabold text-xs text-sky-400 uppercase tracking-wider">Text Spacing (WCAG 1.4.12)</span>
                  <button onClick={() => setActiveFlyout(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>

                {/* Line Height */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Line Height</span>
                  <div className="grid grid-cols-4 gap-1">
                    {['normal', '1.5', '1.8', '2.0'].map(val => (
                      <button
                        key={val}
                        onClick={() => a11yStore.update('lineHeight', val)}
                        className={`p-1 text-xs rounded border cursor-pointer ${
                          settings.lineHeight === val ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {val === 'normal' ? 'Def' : val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Letter Spacing */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Character Spacing</span>
                  <div className="grid grid-cols-4 gap-1">
                    {['normal', '0.12em', '0.16em', '0.2em'].map(val => (
                      <button
                        key={val}
                        onClick={() => a11yStore.update('letterSpacing', val)}
                        className={`p-1 text-xs rounded border cursor-pointer ${
                          settings.letterSpacing === val ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {val === 'normal' ? 'Def' : val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plus: Font Size Increase */}
          <button
            onClick={handleIncreaseFont}
            className="w-9 h-9 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm flex items-center justify-center transition-colors cursor-pointer"
            title="Increase Font Size (+)"
            aria-label="Increase Font Size"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* ================================================================
            CLUSTER 4: TRANSLATION & COLOR WHEEL
            ================================================================ */}
        <div className="flex items-center gap-1 px-1 border-l border-slate-800 flex-shrink-0">
          
          {/* Translation Button: 文 A */}
          <div className="relative">
            <button
              onClick={() => setActiveFlyout(activeFlyout === 'lang' ? null : 'lang')}
              className={`w-9 h-9 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer font-bold text-xs ${
                activeFlyout === 'lang' ? 'ring-2 ring-purple-400' : ''
              }`}
              title="Translate Page Language"
              aria-haspopup="true"
              aria-expanded={activeFlyout === 'lang'}
            >
              <Languages className="w-4 h-4" />
            </button>

            {activeFlyout === 'lang' && (
              <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-[#0B1528] text-white rounded-2xl shadow-2xl border-2 border-slate-700 z-[100002] space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="font-extrabold text-xs text-purple-400 uppercase tracking-wider block">Translate Page</span>
                  <span className="text-[10px] text-slate-400 font-mono">{SUPPORTED_LANGUAGES.length} Languages</span>
                </div>
                {SUPPORTED_LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      translationService.setLanguage(l.code);
                      a11yStore.update('currentLanguage', l.code);
                      a11yStore.announce(`Language set to ${l.nativeName}`);
                      setActiveFlyout(null);
                    }}
                    className={`w-full p-2 text-xs font-bold rounded-lg text-left flex items-center justify-between cursor-pointer transition-colors ${
                      settings.currentLanguage === l.code ? 'bg-[#5A1E65] text-white' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{l.flag}</span>
                      <span className="truncate">{l.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({l.label})</span>
                    </div>
                    {settings.currentLanguage === l.code && <Check className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Wheel: Rainbow Palette */}
          <div className="relative">
            <button
              onClick={() => setActiveFlyout(activeFlyout === 'color' ? null : 'color')}
              className="w-9 h-9 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Color Palette & Contrast Themes"
              aria-haspopup="true"
              aria-expanded={activeFlyout === 'color'}
            >
              <Palette className="w-4 h-4" />
            </button>

            {activeFlyout === 'color' && (
              <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-[#0B1528] text-white rounded-2xl shadow-2xl border-2 border-slate-700 z-[100002] space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-extrabold text-xs text-amber-400 uppercase tracking-wider">Colour Schemes</span>
                  <button onClick={() => setActiveFlyout(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>
                {[
                  { id: 'default', label: 'Standard Colors' },
                  { id: 'yellow-on-black', label: 'Yellow on Black' },
                  { id: 'black-on-yellow', label: 'Black on Yellow' },
                  { id: 'white-on-blue', label: 'White on Dark Blue' },
                  { id: 'black-on-peach', label: 'Black on Soft Peach' },
                  { id: 'inverted', label: 'Invert Colors' },
                  { id: 'monochrome', label: 'Monochrome Grayscale' },
                ].map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      a11yStore.update('colorTheme', theme.id);
                      a11yStore.announce(`Theme set to ${theme.label}`);
                    }}
                    className={`w-full p-2 rounded-xl text-xs font-bold text-left border flex items-center justify-between cursor-pointer ${
                      settings.colorTheme === theme.id ? 'bg-[#5A1E65] text-white border-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{theme.label}</span>
                    {settings.colorTheme === theme.id && <Check className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================
            CLUSTER 5: READING AIDS (Ruler | Large Cursor | Screen Mask | Plain Text | Magnifier)
            ================================================================ */}
        <div className="flex items-center gap-1 px-1 border-l border-slate-800 flex-shrink-0">
          
          {/* Reading Ruler: Orange square */}
          <button
            onClick={() => {
              const next = !settings.ruler;
              a11yStore.update('ruler', next);
              a11yStore.announce(next ? 'Reading ruler on' : 'Reading ruler off');
            }}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              settings.ruler ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300' : 'bg-[#D97706] text-white hover:bg-[#B45309]'
            }`}
            title="Reading Ruler (Horizontal tracking line)"
            aria-pressed={settings.ruler}
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Large Cursor Pointer: Blue square */}
          <button
            onClick={() => {
              const next = settings.cursorSize === 'large-black' ? 'normal' : 'large-black';
              a11yStore.update('cursorSize', next);
              a11yStore.announce(next === 'large-black' ? 'Large black cursor on' : 'Default cursor');
            }}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              settings.cursorSize === 'large-black' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF]'
            }`}
            title="Large Pointer / Cursor"
            aria-pressed={settings.cursorSize === 'large-black'}
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          {/* Screen Mask (Letterbox): Dark Slate square */}
          <button
            onClick={() => {
              const next = !settings.screenMask;
              a11yStore.update('screenMask', next);
              a11yStore.announce(next ? 'Screen mask on' : 'Screen mask off');
            }}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              settings.screenMask ? 'bg-slate-300 text-slate-950 ring-2 ring-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Screen Mask (Dims page except reading focus aperture)"
            aria-pressed={settings.screenMask}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Plain Text Mode: Teal square */}
          <button
            onClick={() => {
              const next = !settings.plainTextMode;
              a11yStore.update('plainTextMode', next);
              a11yStore.announce(next ? 'Plain text mode on' : 'Standard layout restored');
            }}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              settings.plainTextMode ? 'bg-teal-400 text-slate-950 ring-2 ring-teal-200' : 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
            }`}
            title="Plain Text Mode (Strips images and heavy layout)"
            aria-pressed={settings.plainTextMode}
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Magnifier: Emerald square */}
          <button
            onClick={() => {
              const next = !settings.magnifier;
              a11yStore.update('magnifier', next);
              a11yStore.announce(next ? 'Text magnifier on' : 'Text magnifier off');
            }}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              settings.magnifier ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-200' : 'bg-[#059669] text-white hover:bg-[#047857]'
            }`}
            title="Magnifier Glass (Zooms selected text)"
            aria-pressed={settings.magnifier}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* ================================================================
            CLUSTER 6: DICTIONARY | DOWNLOAD | GUIDE | RESET | CONTRAST
            ================================================================ */}
        <div className="flex items-center gap-1 px-1 border-l border-slate-800 flex-shrink-0">
          
          {/* Dictionary A-Z: Purple square */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveFlyout(activeFlyout === 'dict' ? null : 'dict');
                if (activeFlyout !== 'dict') {
                  const sel = window.getSelection()?.toString().trim();
                  if (sel) {
                    setDictWord(sel);
                    setTimeout(() => handleLookup(), 50);
                  }
                }
              }}
              className="w-9 h-9 rounded-md bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Dictionary Lookup (A-Z)"
              aria-haspopup="true"
              aria-expanded={activeFlyout === 'dict'}
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {activeFlyout === 'dict' && (
              <div className="absolute top-full right-0 mt-2 w-80 p-4 bg-[#0B1528] text-white rounded-2xl shadow-2xl border-2 border-slate-700 z-[100002] space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="font-extrabold text-xs text-purple-400 uppercase tracking-wider">Dictionary Lookup</span>
                  <button onClick={() => setActiveFlyout(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dictWord}
                    onChange={(e) => setDictWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    placeholder="Enter or select word..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    onClick={handleLookup}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Lookup
                  </button>
                </div>

                {dictLoading && <p className="text-xs text-slate-400 py-2">Looking up definition...</p>}

                {dictDefinition && (
                  <div className="max-h-48 overflow-y-auto space-y-2 text-xs pt-1">
                    <span className="font-extrabold text-white text-sm block">{dictDefinition.word}</span>
                    {dictDefinition.meanings?.map((m, i) => (
                      <div key={i} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="italic font-bold text-purple-400 block">{m.partOfSpeech}:</span>
                        <p className="text-slate-300">{m.definitions[0]?.definition}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Download Audio Transcript: Olive/Bronze square */}
          <button
            onClick={handleDownloadTranscript}
            className="w-9 h-9 rounded-md bg-[#CA8A04] hover:bg-[#A16207] text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Download Accessible Text Transcript"
            aria-label="Download Transcript"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* User Guide: Crimson square */}
          <div className="relative">
            <button
              onClick={() => setActiveFlyout(activeFlyout === 'guide' ? null : 'guide')}
              className="w-9 h-9 rounded-md bg-[#E11D48] hover:bg-[#BE123C] text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Accessibility Guide"
              aria-haspopup="true"
              aria-expanded={activeFlyout === 'guide'}
            >
              <BookMarked className="w-4 h-4" />
            </button>

            {activeFlyout === 'guide' && (
              <div className="absolute top-full right-0 mt-2 w-80 p-4 bg-[#0B1528] text-white rounded-2xl shadow-2xl border-2 border-slate-700 z-[100002] space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="font-extrabold text-xs text-rose-400 uppercase tracking-wider">Features Guide</span>
                  <button onClick={() => setActiveFlyout(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2 text-xs text-slate-300">
                  <p><strong>Speech Controls:</strong> Plays page text with natural US female voice and highlights active reading blocks.</p>
                  <p><strong>Focus Audio:</strong> 100% royalty-free ambient harmonic tones & soothing brown noise for ADHD and deep reading focus.</p>
                  <p><strong>Text & Font:</strong> Scales font sizes, sets dyslexia fonts, and adjusts WCAG text spacing.</p>
                  <p><strong>Ruler & Mask:</strong> Eliminates visual distractions with isolated letterbox aperture.</p>
                  <p><strong>Hotkeys:</strong> Press <kbd className="px-1 bg-slate-800 border rounded">Alt + A</kbd> to toggle ribbon anytime.</p>
                </div>
              </div>
            )}
          </div>

          {/* Reset Settings: Dark Gray square */}
          <button
            onClick={() => a11yStore.resetAll()}
            className="w-9 h-9 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Reset All Accessibility Settings to Defaults"
            aria-label="Reset All Settings"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Theme Quick Dial */}
          <button
            onClick={handleCycleTheme}
            className="w-9 h-9 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Cycle High Contrast Themes"
            aria-label="Cycle Contrast Themes"
          >
            <SunMoon className="w-4 h-4" />
          </button>
        </div>

        {/* ================================================================
            RIGHT CORNER: CLEAN NATIVE BRANDING & CLOSE (ZERO RECITE ME LOGO)
            ================================================================ */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800 flex-shrink-0">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="font-black text-xs text-white tracking-wide">
              DCVC <span className="text-amber-400">Sanctuary</span>
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Native A11y Suite
            </span>
          </div>

          {/* Close Ribbon */}
          <button
            onClick={() => a11yStore.update('toolbarOpen', false)}
            className="w-8 h-8 rounded-md bg-transparent hover:bg-rose-950 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Close Accessibility Ribbon (Alt + A)"
            aria-label="Close Accessibility Toolbar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  )}

  {/* ================================================================
      FLOATING HANDS-FREE LIVE SPEECH HUD (Universal Network & Offline Command Mode)
      ================================================================ */}
  {(voiceHudVisible || isListening || isNetworkRecording || isTranscribing || isOfflineMode) && (
    <>
      {/* Voice Commands Cheat Sheet Modal Popover */}
      {showVoiceHelp && (
        <div 
          role="dialog"
          aria-modal="false"
          aria-label="Hands-free Voice Commands Cheat Sheet"
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100006] bg-[#0A1220]/95 text-white border-2 border-emerald-400 p-5 rounded-3xl shadow-2xl backdrop-blur-2xl max-w-2xl w-[94vw] max-h-[72vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-3 duration-200 ring-4 ring-emerald-500/20"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎙️</span>
              <div>
                <h3 className="font-display font-black text-sm text-white">Hands-Free Voice Commands</h3>
                <p className="text-[11px] text-emerald-300">Speak naturally or click any command below — works across all browsers with local client execution.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVoiceHelp(false)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close voice guide"
              aria-label="Close voice guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5 text-xs">
            {VOICE_COMMAND_CATEGORIES.map((cat) => (
              <div key={cat.name} className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <span className="font-black text-[11px] uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.examples.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => executeVoiceCommand(ex, true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-600 hover:text-white text-slate-300 font-mono text-[10px] border border-slate-700 hover:border-emerald-500 transition-colors cursor-pointer text-left"
                      title={`Click or say "${ex}"`}
                    >
                      "{ex}"
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>💡 Say or click <strong>"tap [name]"</strong> or <strong>"open page [name]"</strong> anytime.</span>
            <button
              type="button"
              onClick={() => setShowVoiceHelp(false)}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Primary Floating HUD Bar (Voice or Offline Command Mode) */}
      <div 
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100005] bg-[#0B1528]/95 text-white border-2 ${
          isOfflineMode 
            ? 'border-amber-400 ring-amber-500/20' 
            : isTranscribing 
              ? 'border-cyan-400 ring-cyan-500/25'
              : 'border-emerald-400 ring-emerald-500/20'
        } px-4 sm:px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 select-none animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl w-[94vw] ring-4`}
      >
        <div className="flex items-center gap-3 sm:gap-4 w-full">
          {/* Status Indicator Icon */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            {isTranscribing ? (
              <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center relative shadow-md">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            ) : isNetworkRecording ? (
              <>
                <div className="w-9 h-9 rounded-full bg-emerald-500/30 flex items-center justify-center animate-ping absolute inset-0" />
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center relative shadow-md">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
              </>
            ) : isListening ? (
              <>
                <div className="w-9 h-9 rounded-full bg-emerald-500/30 flex items-center justify-center animate-ping absolute inset-0" />
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center relative shadow-md">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
              </>
            ) : isOfflineMode ? (
              <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center relative shadow-md" title="Offline or Speech Cloud Unreachable">
                <WifiOff className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center relative shadow-md" title="Voice Controller Ready">
                <Mic className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
                isOfflineMode 
                  ? 'text-amber-400' 
                  : isTranscribing 
                    ? 'text-cyan-400' 
                    : 'text-emerald-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isOfflineMode 
                    ? 'bg-amber-400' 
                    : isTranscribing 
                      ? 'bg-cyan-400 animate-ping' 
                      : (isListening || isNetworkRecording)
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-emerald-400'
                }`} />
                {isTranscribing
                  ? 'Transcribing Speech'
                  : isNetworkRecording
                    ? 'Listening (Network Voice)'
                    : isListening
                      ? 'Hands-Free Voice Active'
                      : isOfflineMode
                        ? 'Offline Voice Mode'
                        : 'Voice Ready (Network)'}
              </span>

              {/* Live Volume Meter while Network Recording */}
              {isNetworkRecording && (
                <div className="flex items-center gap-0.5 h-3.5 px-1.5 bg-slate-900/80 rounded-md border border-slate-700" title={`Audio Level: ${audioLevel}%`}>
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 14 * (1 + (bar % 2) * 0.4)))}px`,
                        opacity: audioLevel > bar * 12 ? 1 : 0.35
                      }}
                    />
                  ))}
                </div>
              )}

              {isOfflineMode && (
                <button
                  type="button"
                  onClick={() => setNetworkHelpOpen(true)}
                  className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-700/60 hover:bg-amber-900 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="How to enable microphone voice input? Click for steps"
                >
                  <span>How to Enable</span>
                  <HelpCircle className="w-3 h-3" />
                </button>
              )}

              {speechFeedback && !isOfflineMode && (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold truncate max-w-[220px]">
                  {speechFeedback}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 font-medium truncate mt-0.5">
              {isTranscribing
                ? 'Processing audio via Cloud AI Whisper... ⚡'
                : isNetworkRecording
                  ? (speechTranscript ? `"${speechTranscript}"` : 'Listening... Speak a command ("scroll down", "tap donate", "programs")')
                  : isListening
                    ? (speechTranscript ? `Heard: "${speechTranscript}"` : 'Listening... Say "scroll to top", "tap donate", "open page [name]", "read"')
                    : isOfflineMode
                      ? 'Type command below or click quick action buttons'
                      : (speechTranscript ? `Last Heard: "${speechTranscript}"` : 'Click "Speak" to say a command, or click quick buttons')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* If currently Network Recording, provide Done button to finish speech immediately */}
            {isNetworkRecording && (
              <button
                type="button"
                onClick={stopNetworkRecording}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm animate-pulse"
                title="Finish speaking and process command now"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Done</span>
              </button>
            )}

            {/* If idle in Network mode, show Speak Command button */}
            {!isListening && !isNetworkRecording && !isTranscribing && !isOfflineMode && (
              <button
                type="button"
                onClick={startNetworkRecording}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                title="Speak a voice command"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Speak</span>
              </button>
            )}

            {isOfflineMode && (
              <button
                type="button"
                onClick={handleRetryMic}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                title="Retry Live Microphone"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Retry Mic</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowVoiceHelp((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-amber-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer border border-purple-600 shadow-sm"
              title="View all hands-free voice commands"
              aria-label="View all voice commands cheat sheet"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Commands</span>
            </button>

            <button
              type="button"
              onClick={handleToggleMic}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Close Voice HUD"
              aria-label="Close Voice HUD"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Offline Command Bar & 1-Tap Quick Action Pills */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form onSubmit={handleOfflineSubmit} className="flex-1 flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              value={offlineInput}
              onChange={(e) => setOfflineInput(e.target.value)}
              placeholder='Type command: "scroll down", "tap donate", "open programs", "read"...'
              className="flex-1 px-3 py-1.5 bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
              title="Run command offline"
            >
              <Send className="w-3 h-3" />
              <span>Run</span>
            </button>
          </form>

          {/* Quick Action Pills for Immediate 1-Tap Control */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-shrink-0">
            <button
              type="button"
              onClick={() => executeVoiceCommand('scroll down', true)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 whitespace-nowrap cursor-pointer transition-colors"
              title="Scroll down page"
            >
              Scroll ⬇
            </button>
            <button
              type="button"
              onClick={() => executeVoiceCommand('scroll to top', true)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 whitespace-nowrap cursor-pointer transition-colors"
              title="Scroll to top of page"
            >
              Top ⬆
            </button>
            <button
              type="button"
              onClick={() => executeVoiceCommand('tap donate', true)}
              className="px-2 py-1 rounded-lg bg-purple-900/70 hover:bg-purple-800 text-purple-200 hover:text-white text-[11px] font-semibold border border-purple-700 whitespace-nowrap cursor-pointer transition-colors"
              title="Tap Donate"
            >
              Donate 💜
            </button>
            <button
              type="button"
              onClick={() => executeVoiceCommand('open programs', true)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 whitespace-nowrap cursor-pointer transition-colors"
              title="Open Programs"
            >
              Programs
            </button>
            <button
              type="button"
              onClick={() => executeVoiceCommand('read page', true)}
              className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-semibold border border-emerald-800 whitespace-nowrap cursor-pointer transition-colors"
              title="Read Page Aloud"
            >
              Read 🔊
            </button>
          </div>
        </div>
      </div>

      {/* Network Explanation Dialog */}
      {networkHelpOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Offline Voice Command Information"
          className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setNetworkHelpOpen(false)}
        >
          <div 
            className="bg-[#0A1220] text-white border-2 border-amber-400 p-6 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-black text-base text-white">Why did Offline Mode activate?</h3>
              </div>
              <button
                type="button"
                onClick={() => setNetworkHelpOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="p-3 bg-amber-950/60 border border-amber-700/60 rounded-xl space-y-1.5">
                <p className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <span>🦁</span> Why Brave blocks browser voice recognition:
                </p>
                <p className="text-slate-300">
                  Chromium browsers process microphone audio by streaming it to Google speech servers. To protect privacy, <strong>Brave permanently removes and blocks Google Speech Recognition backend services</strong>, preventing Web Speech API calls from completing.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">How to use hands-free voice commands:</p>
                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                    <p className="font-bold text-white text-xs">Option 1: Open in Google Chrome or Microsoft Edge (Instant)</p>
                    <p className="text-[11px] text-slate-400">
                      Both Chrome and Edge have speech services enabled out of the box with zero setup required. Simply copy the URL and paste it into Google Chrome or Edge:
                    </p>
                    <button
                      type="button"
                      onClick={handleCopySiteUrl}
                      className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedSiteUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSiteUrl ? 'Copied URL!' : 'Copy Site URL (for Chrome / Edge)'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <p className="font-bold text-white text-xs">Option 2: Windows Offline Voice Typing (Win + H)</p>
                    <p className="text-[11px] text-slate-400">
                      Inside Brave, click into the command input box below and press <kbd className="bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">Win</kbd> + <kbd className="bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">H</kbd> to activate Windows Voice Typing. Speak any command and press Enter!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-200 text-[11px]">
                <strong>100% Offline Guarantee:</strong> All voice actions (scrolling, tapping buttons, opening routes, contrast themes, text-to-speech reading, and 432Hz ambient focus music) run entirely in local client JavaScript and require zero external servers!
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setNetworkHelpOpen(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}

  {/* ================================================================
      MICROPHONE PERMISSION ERROR TOAST
      ================================================================ */}
  {micError && (
    <div 
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100005] bg-rose-950/95 text-rose-100 border-2 border-rose-500 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 select-none max-w-lg w-[92vw] sm:w-auto"
    >
      <div className="w-8 h-8 rounded-full bg-rose-800 text-rose-200 flex items-center justify-center flex-shrink-0 font-bold text-sm">
        !
      </div>
      <p className="text-xs font-semibold flex-1">
        {micError}
      </p>
      <button
        onClick={() => setMicError(null)}
        className="p-1 text-rose-300 hover:text-white rounded-lg cursor-pointer"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )}
</>
  );
}
