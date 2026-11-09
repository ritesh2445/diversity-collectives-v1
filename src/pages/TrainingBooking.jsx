import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Users, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { trainingCourses, orgInfo } from '../data/dcvcData';
import { submitTrainingBooking } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';
import { usePageMeta } from '../utils/seo';

export default function TrainingBooking() {
  const { slug } = useParams();
  const selectedCourse = slug ? trainingCourses.find(c => c.slug === slug) : null;

  usePageMeta({
    title: 'Book P.R.I.D.E. Educational Training',
    description: 'Schedule a certified LGBTQ+ cultural competency workshop for your school, clinic, corporate team, or community agency.',
    canonicalPath: '/training/book'
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    phone: '',
    courseSlug: selectedCourse ? selectedCourse.slug : (trainingCourses[0]?.slug || ''),
    estimatedAttendees: '25-50',
    preferredFormat: 'In-Person at Our Facility',
    requestedDate: '',
    notes: '',
    termsConsent: false,
    turnstileToken: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termsConsent) {
      setStatus('error');
      setStatusMsg('Please accept the non-discrimination and privacy consent agreement.');
      return;
    }

    setStatus('loading');
    const res = await submitTrainingBooking(formData);

    if (res.success) {
      setStatus('success');
      setStatusMsg(res.message);
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5A1E65', '#10B981', '#F59E0B']
        });
      } catch {
        // Fallback
      }
    } else {
      setStatus('error');
      setStatusMsg(res.message || 'Submission failed. Please call (805) 644-5428.');
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Back button */}
      <div className="container-clean mb-6">
        <Link 
          to="/training" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Training Catalog</span>
        </Link>
      </div>

      <section className="container-clean max-w-4xl">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-200 shadow-xl space-y-8">
          
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
              WORKSHOP BOOKING & INQUIRY
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Request a P.R.I.D.E. Workshop
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Equip your organization with actionable LGBTQ+ cultural competency grounded in Ventura County lived experience. Our training leads will review your inquiry and coordinate scheduling.
            </p>
          </div>

          {status === 'success' ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-emerald-950">
                Inquiry Successfully Logged!
              </h2>
              <p className="text-sm text-emerald-900 max-w-lg mx-auto font-medium leading-relaxed">
                {statusMsg}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link to="/training" className="btn-primary py-2.5 px-6 text-xs font-bold">
                  Browse More Workshops
                </Link>
                <Link to="/" className="btn-secondary py-2.5 px-5 text-xs font-bold bg-white">
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

              {/* Organization and Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="orgName" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Organization or Agency Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="e.g. Ventura County Unified School District"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contactName" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Contact Person Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="e.g. Jordan Smith"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jordan@example.org"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(805) 555-0199"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>

              {/* Module and Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="course" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Select Training Curriculum <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="course"
                    value={formData.courseSlug}
                    onChange={(e) => setFormData({ ...formData, courseSlug: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white font-medium"
                  >
                    {trainingCourses.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title} ({c.duration})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="attendees" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Estimated Attendee Count <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="attendees"
                    value={formData.estimatedAttendees}
                    onChange={(e) => setFormData({ ...formData, estimatedAttendees: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white font-medium"
                  >
                    <option value="Under 15">Under 15 Participants</option>
                    <option value="15-30">15 – 30 Participants</option>
                    <option value="30-60">30 – 60 Participants</option>
                    <option value="60-100">60 – 100 Participants</option>
                    <option value="100+">100+ Participants (Assembly or Conference)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="format" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Preferred Delivery Format <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="format"
                    value={formData.preferredFormat}
                    onChange={(e) => setFormData({ ...formData, preferredFormat: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white font-medium"
                  >
                    <option value="In-Person at Our Facility">In-Person at Our Facility</option>
                    <option value="In-Person at DCVC Center (Ventura)">In-Person at DCVC Center (Ventura)</option>
                    <option value="Interactive Live Virtual (Zoom)">Interactive Live Virtual (Zoom)</option>
                    <option value="Hybrid">Hybrid Delivery</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="requestedDate" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Target Date or Preferred Timeframe
                  </label>
                  <input
                    id="requestedDate"
                    type="text"
                    value={formData.requestedDate}
                    onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                    placeholder="e.g. November 2026 or Next Quarter"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Specific Organizational Goals or Questions
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Share details about your team's background, past training, or specific scenarios you wish to address..."
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                />
              </div>

              {/* Consent */}
              <div className="flex items-start gap-3 p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  checked={formData.termsConsent}
                  onChange={(e) => setFormData({ ...formData, termsConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                />
                <label htmlFor="terms" className="text-xs text-slate-700 leading-relaxed font-medium">
                  I consent to Diversity Collective Ventura County using my contact details to coordinate this educational workshop inquiry under our <Link to="/privacy" className="text-[#5A1E65] font-bold underline hover:text-purple-900">Privacy Policy</Link>. <span className="text-rose-600">*</span>
                </label>
              </div>

              {/* Cloudflare Turnstile Spam Protection */}
              <TurnstileWidget
                onVerify={(token) => setFormData(prev => ({ ...prev, turnstileToken: token }))}
                onExpire={() => setFormData(prev => ({ ...prev, turnstileToken: '' }))}
              />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-2xl hover:scale-102 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{status === 'loading' ? 'Submitting Request...' : 'Send Booking Inquiry'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </section>

    </div>
  );
}

