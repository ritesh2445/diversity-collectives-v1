import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Radio
} from 'lucide-react';
import { submitVoicemail } from '../services/api';

const MAX_DURATION_SECONDS = 120; // 2 minutes

export default function VoicemailRecorder({
  defaultOpen = false,
  defaultSubject = '',
  onSubmitted = null,
  embedded = false
} = {}) {
  const [isOpen, setIsOpen] = useState(defaultOpen || embedded);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(defaultSubject);

  // Recording lifecycle state: 'idle' | 'recording' | 'paused' | 'stopped'
  const [recordState, setRecordState] = useState('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const streamRef = useRef(null);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Clean up streams & timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = async () => {
    setStatusMsg(null);
    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your name before recording.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address so we can reply.' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm'
        });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        setRecordState('stopped');

        // Stop mic tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setRecordState('recording');
      setDuration(0);

      // Start duration timer
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= MAX_DURATION_SECONDS) {
            stopRecording();
            return MAX_DURATION_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setStatusMsg({
        type: 'error',
        text: 'Microphone access is required to record a voice message. Please check your browser permissions.'
      });
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordState === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecordState('paused');
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordState('recording');
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= MAX_DURATION_SECONDS) {
            stopRecording();
            return MAX_DURATION_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Reset / Re-record
  const handleReRecord = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordState('idle');
    setDuration(0);
    setIsPlaying(false);
    setPlaybackTime(0);
    setStatusMsg(null);
  };

  // Play / Pause preview playback
  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
      if (onSubmitted) {
        try {
          onSubmitted();
        } catch {}
      }
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  // Submit voice message
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!audioBlob) {
      setStatusMsg({ type: 'error', text: 'Please record your message first.' });
      return;
    }
    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'Name is required.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatusMsg({ type: 'error', text: 'A valid email is required so our team can follow up.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    const res = await submitVoicemail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim() || 'General Community Voicemail',
      duration,
      audioBlob
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatusMsg({
        type: 'success',
        text: res.message || 'Thank you! Your voice message has been received, and someone from our team will get back to you.'
      });
      // Reset recording form while preserving success message
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setRecordState('idle');
      setDuration(0);
      setName('');
      setEmail('');
      setSubject('');
      if (onSubmitted) {
        try {
          onSubmitted();
        } catch {}
      }
    } else {
      setStatusMsg({
        type: 'error',
        text: res.message || 'Failed to submit voice message. Please try again or email us directly.'
      });
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 transition-all">
      {/* Header / Trigger */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5A1E65] flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-100">
            <Mic className="w-5 h-5 text-[#5A1E65]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Leave Us a Voice Message</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 tracking-wider">
                Voicemail Active
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 leading-relaxed">
              Can't reach our team right now? Leave us a voice message, and someone from our team will get back to you.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
          title={isOpen ? 'Collapse voice message recorder' : 'Expand voice message recorder'}
          aria-expanded={isOpen}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Recorder Panel */}
      {isOpen && (
        <div className="pt-3 border-t border-slate-100 space-y-4 animate-fade-in">
          {/* Status Alert Banner */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium'
                  : 'bg-rose-50 border border-rose-200 text-rose-900 font-medium'
              }`}
              role="alert"
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{statusMsg.text}</div>
            </div>
          )}

          {/* Contact Information Fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Your Name <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={recordState === 'recording'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First & last name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-500 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={recordState === 'recording'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.org"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-500 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Subject / Topic <span className="text-slate-600 font-medium lowercase">(optional)</span>
              </label>
              <input
                type="text"
                disabled={recordState === 'recording'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Youth peer circle, resource inquiry, event question..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-500 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Recording & Playback Control Center */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            {/* Live Progress & Timer Bar */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {recordState === 'recording' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
                )}
                {recordState === 'paused' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                )}
                <span className="font-bold text-slate-900">
                  {recordState === 'recording'
                    ? 'Recording voice message...'
                    : recordState === 'paused'
                    ? 'Recording paused'
                    : recordState === 'stopped'
                    ? 'Message recorded'
                    : 'Ready to record'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-800 font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>{formatTime(duration)}</span>
                <span className="text-slate-600 font-semibold">/ 02:00 max</span>
              </div>
            </div>

            {/* Visual duration progress bar */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  recordState === 'recording'
                    ? 'bg-rose-600'
                    : recordState === 'paused'
                    ? 'bg-amber-500'
                    : 'bg-[#5A1E65]'
                }`}
                style={{ width: `${Math.min(100, (duration / MAX_DURATION_SECONDS) * 100)}%` }}
              />
            </div>

            {/* Action Buttons based on current recordState */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {recordState === 'idle' && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-amber-300" />
                  <span>Start Recording (Up to 2 minutes)</span>
                </button>
              )}

              {recordState === 'recording' && (
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Finish Recording</span>
                  </button>
                </div>
              )}

              {recordState === 'paused' && (
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Finish Recording</span>
                  </button>
                </div>
              )}

              {recordState === 'stopped' && (
                <div className="space-y-3 w-full">
                  {/* Hidden native audio element for preview */}
                  {audioUrl && (
                    <audio
                      ref={audioPlayerRef}
                      src={audioUrl}
                      onTimeUpdate={(e) => setPlaybackTime(e.target.currentTime)}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  )}

                  {/* Playback & Re-record toolbar */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#5A1E65] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={isPlaying ? 'Pause playback' : 'Play recorded message'}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Pause' : 'Listen Back'}</span>
                    </button>

                    <div className="text-xs font-mono text-slate-800 font-bold">
                      {formatTime(Math.floor(playbackTime))} / {formatTime(duration)}
                    </div>

                    <button
                      type="button"
                      onClick={handleReRecord}
                      className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Clear recording and start over"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      <span>Re-record</span>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Voice Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-amber-300" />
                        <span>Submit Voice Message</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
