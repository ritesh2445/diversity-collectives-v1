import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  HelpCircle,
  Phone,
  Mail 
} from 'lucide-react';
import { submitAccessibilityFeedback } from '../services/api';
import { orgInfo } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

export default function AccessibilityFeedback() {
  usePageMeta({
    title: 'Accessibility Feedback & Barrier Report',
    description: 'Encountered a digital barrier on our website? Help Diversity Collective ensure equitable access for all community members.',
    canonicalPath: '/accessibility-feedback'
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pageUrl: '',
    assistiveTechnology: 'Screen Reader',
    barrierDescription: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    const res = await submitAccessibilityFeedback(formData);

    if (res.success) {
      setStatus('success');
      setStatusMsg(res.message);
    } else {
      setStatus('error');
      setStatusMsg(res.message || 'Submission error. Please email info@diversitycollective.org directly.');
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Back button */}
      <div className="container-clean mb-6">
        <Link 
          to="/accessibility" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Accessibility Statement</span>
        </Link>
      </div>

      <section className="container-clean max-w-3xl">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-200 shadow-xl space-y-8">
          
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
              WCAG 2.2 AA FEEDBACK & REMEDIATION
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Report an Accessibility Barrier
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              We are committed to delivering equal digital access. If you experienced any difficulty navigating with a screen reader, keyboard, voice assistant, or magnifier, please let our team know.
            </p>
          </div>

          {status === 'success' ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-emerald-950">
                Thank You for Your Feedback!
              </h2>
              <p className="text-sm text-emerald-900 max-w-md mx-auto font-medium leading-relaxed">
                {statusMsg} Our engineering and accessibility leads review every barrier report to remediate issues promptly.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link to="/" className="btn-primary py-2.5 px-6 text-xs font-bold">
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="barrier" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Describe the Barrier or Difficulty <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="barrier"
                  rows={5}
                  required
                  minLength={10}
                  value={formData.barrierDescription}
                  onChange={(e) => setFormData({ ...formData, barrierDescription: e.target.value })}
                  placeholder="Tell us what you were trying to do, what happened, and any error message displayed..."
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="url" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Page URL Where Issue Occurred
                  </label>
                  <input
                    id="url"
                    type="text"
                    value={formData.pageUrl}
                    onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
                    placeholder="e.g. /events or /resources"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tech" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Assistive Technology Used
                  </label>
                  <select
                    id="tech"
                    value={formData.assistiveTechnology}
                    onChange={(e) => setFormData({ ...formData, assistiveTechnology: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white font-medium"
                  >
                    <option value="Screen Reader (JAWS, NVDA, VoiceOver)">Screen Reader (JAWS, NVDA, VoiceOver)</option>
                    <option value="Keyboard-Only Navigation">Keyboard-Only Navigation</option>
                    <option value="Screen Magnifier / Zoom">Screen Magnifier / High Zoom</option>
                    <option value="Voice Dictation / Speech Control">Voice Dictation / Speech Control</option>
                    <option value="High Contrast / Color Mode">High Contrast / Inverted Colors</option>
                    <option value="Other / Cognitive Aid">Other Assistive Technology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Your Name (Optional)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Optional name"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Your Email (Optional, if you wish a reply)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-2xl hover:scale-102 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{status === 'loading' ? 'Sending Report...' : 'Submit Accessibility Report'}</span>
                </button>
              </div>

            </form>
          )}

          {/* Direct Phone Assistance Alternative */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-900 block">Prefer to speak with someone directly?</span>
            <p>
              Our staff is happy to read any web document aloud, take event registrations over the phone, or provide materials in an alternative format:
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 font-bold text-[#5A1E65]">
              <a href={`tel:${orgInfo.phoneRaw}`} className="flex items-center gap-1.5 hover:underline">
                <Phone className="w-3.5 h-3.5" />
                <span>Call {orgInfo.phone}</span>
              </a>
              <a href={`mailto:${orgInfo.email}`} className="flex items-center gap-1.5 hover:underline">
                <Mail className="w-3.5 h-3.5" />
                <span>Email {orgInfo.email}</span>
              </a>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

