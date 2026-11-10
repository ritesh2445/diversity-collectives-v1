import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck,
  Lock,
  Heart,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitInquiry } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';
import { usePageMeta } from '../utils/seo';

const SERVICES = [
  'Confidential Rapid HIV Antibody Screening (20-Minute Results)',
  'Rapid Hepatitis C Screening',
  'PrEP & PEP Preventative Navigation & Linkage',
  'Gender-Affirming Healthcare & Hormone Therapy Navigation',
  'Harm Reduction & Safer Sex Kit Pickup / Counseling',
  'General Community Resource Center Intake & Peer Support'
];

export default function AppointmentBooking() {
  usePageMeta({
    title: 'Confidential Appointment & Health Screening Booking',
    description: 'Book a free, confidential HIV/STI screening, PrEP navigation, or peer intake appointment at Diversity Collective Ventura County.',
    canonicalPath: '/appointments'
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    pronouns: '',
    email: '',
    phone: '',
    preferredContactMethod: 'email',
    service: SERVICES[0],
    preferredDate: '',
    preferredTime: 'Afternoon (1:00 PM – 3:00 PM)',
    notes: '',
    confidentialityConsent: false,
    turnstileToken: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.confidentialityConsent) {
      setStatus('error');
      setStatusMsg('Please confirm our confidential appointment agreement.');
      return;
    }

    setStatus('loading');
    const res = await submitInquiry({
      type: 'appointment',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: `Appointment Booking: ${formData.service}`,
      message: `Service Requested: ${formData.service}\nPronouns: ${formData.pronouns}\nPreferred Contact: ${formData.preferredContactMethod}\nPreferred Date: ${formData.preferredDate}\nPreferred Time: ${formData.preferredTime}\nNotes: ${formData.notes || 'None'}`,
      turnstileToken: formData.turnstileToken
    });

    if (res.success) {
      setStatus('success');
      setStatusMsg('Your confidential booking request has been securely received. Our clinical navigation team will confirm discreetly.');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } else {
      setStatus('error');
      setStatusMsg(res.error || 'Failed to submit booking request. Please reach out to info@diversitycollective.org or call (805) 644-5428.');
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      <div className="container-clean max-w-3xl">
        
        {/* Navigation Breadcrumb */}
        <Link 
          to="/programs/diversity-shines" 
          className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 mb-8 p-1 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Diversity SHINES</span>
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border-emerald-200">
              100% Free · 100% Confidential
            </span>
            <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-50 border-purple-200">
              In-App Scheduling
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Schedule a Confidential <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Health Screening or Intake.</span>
          </h1>
          <p className="font-serif italic text-base sm:text-lg text-slate-600 mt-3 leading-relaxed">
            Our trauma-informed healthcare navigators provide non-judgmental, culturally competent testing, harm reduction kits, and linkage at 2471 Portola Road, Suite 100, Ventura.
          </p>
        </div>

        {/* Security / Confidentiality Notice */}
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 flex items-start gap-3 mb-8">
          <Lock className="w-5 h-5 text-[#5A1E65] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Discreet, Protected Sanctuary</span>
            <p className="text-[11px] text-purple-900/90 leading-relaxed mt-0.5">
              Your appointment request is encrypted and routed exclusively to certified clinical navigators. We never disclose your visit or personal information to third parties or insurance agencies without explicit consent.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border-2 border-slate-200 shadow-xl">
          
          {status === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl font-black text-slate-900">Appointment Request Received!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {statusMsg}
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-w-md mx-auto text-left space-y-1">
                <p><strong>Location:</strong> Community Resource Center, 2471 Portola Rd, Suite 100, Ventura, CA 93003</p>
                <p><strong>Direct Helpline:</strong> (805) 644-5428</p>
                <p><strong>Walk-Ins:</strong> Tuesdays & Thursdays 1:00 PM – 5:00 PM</p>
              </div>
              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Link to="/programs" className="btn-primary py-2.5 px-6 text-xs font-bold">
                  Explore Free Programs
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setStatusMsg('');
                  }}
                  className="py-2.5 px-5 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Book Another Appointment
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Requested Clinical Service or Support *
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  required
                >
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Name & Pronouns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Name (Affirmed or Chosen Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="What name should we call you?"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Pronouns (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. they/them, she/her, he/him"
                    value={formData.pronouns}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Discreet Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Discreet Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="(805) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Date & Time Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Preferred Time Window
                  </label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  >
                    <option value="Early Afternoon (1:00 PM – 2:30 PM)">Early Afternoon (1:00 PM – 2:30 PM)</option>
                    <option value="Late Afternoon (2:30 PM – 4:30 PM)">Late Afternoon (2:30 PM – 4:30 PM)</option>
                    <option value="Friday Youth Drop-in (5:30 PM – 7:30 PM)">Friday Youth Drop-in (5:30 PM – 7:30 PM)</option>
                    <option value="Any Available Time">Any Available Time</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Special Accommodations, Accessibility Needs, or Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Need Spanish translation? Wheelchair access? Any question for the nurse?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={formData.confidentialityConsent}
                  onChange={(e) => setFormData({ ...formData, confidentialityConsent: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-700 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  I understand this is a confidential appointment request with Diversity Collective Ventura County. I consent to be contacted discreetly at the email or phone number provided.
                </span>
              </label>

              {/* Turnstile Bot Protection */}
              <TurnstileWidget 
                onSuccess={(token) => setFormData({ ...formData, turnstileToken: token })}
                action="appointment_booking"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#5A1E65] to-purple-800 hover:from-purple-900 hover:to-purple-950 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Transmitting Secure Booking...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Confidential Appointment Request</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}

