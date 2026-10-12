import React, { useState, useEffect, useRef } from 'react';
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
  Check
} from 'lucide-react';
import { a11yStore } from '../../accessibility/a11yStore';
import { focusAudio } from '../../accessibility/focusAudio';
import { getOptimalNativeUSFemaleVoice, createAccessibleUtterance } from '../../accessibility/voiceHelper';

export default function ReciteToolbar() {
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

  // Voice command state
  const [isListening, setIsListening] = useState(false);

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
        clearHighlight();
        setActiveFlyout(null);
      }
    });
    return unsubscribe;
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

  // Voice Command (Microphone)
  const handleToggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      a11yStore.announce('Voice command listening stopped.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        a11yStore.announce('Voice listening active. Say: scroll down, scroll up, or reset.');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        if (transcript.includes('scroll down')) {
          window.scrollBy({ top: 400, behavior: 'smooth' });
        } else if (transcript.includes('scroll up')) {
          window.scrollBy({ top: -400, behavior: 'smooth' });
        } else if (transcript.includes('play')) {
          handlePlayPause();
        } else if (transcript.includes('stop')) {
          window.speechSynthesis.cancel();
          clearHighlight();
        } else if (transcript.includes('close')) {
          a11yStore.update('toolbarOpen', false);
        } else if (transcript.includes('reset')) {
          a11yStore.resetAll();
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
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

  if (!settings.toolbarOpen) return null;

  return (
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
              isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#059669] text-white hover:bg-[#047857]'
            }`}
            title={isListening ? 'Listening for voice commands...' : 'Enable hands-free voice command navigation'}
            aria-label="Voice command microphone"
          >
            <Mic className="w-4 h-4" />
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
              <div className="absolute top-full left-0 mt-2 w-56 p-3 bg-[#0B1528] text-white rounded-2xl shadow-2xl border-2 border-slate-700 z-[100002] space-y-2">
                <span className="font-extrabold text-xs text-purple-400 uppercase tracking-wider block">Language</span>
                {[
                  { code: 'en', label: 'English (US)' },
                  { code: 'es', label: 'Español (Spanish)' },
                  { code: 'tl', label: 'Tagalog' },
                  { code: 'vi', label: 'Tiếng Việt' },
                  { code: 'zh', label: '中文 (Chinese)' },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      a11yStore.update('currentLanguage', l.code);
                      a11yStore.announce(`Language set to ${l.label}`);
                      setActiveFlyout(null);
                    }}
                    className={`w-full p-2 text-xs font-bold rounded-lg text-left flex items-center justify-between cursor-pointer ${
                      settings.currentLanguage === l.code ? 'bg-[#5A1E65] text-white' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{l.label}</span>
                    {settings.currentLanguage === l.code && <Check className="w-3.5 h-3.5" />}
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
  );
}
