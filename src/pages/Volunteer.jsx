import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Heart, 
  Sparkles, 
  Calendar, 
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitVolunteer } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';
import { orgInfo } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

export default function Volunteer() {
  usePageMeta({
    title: 'Volunteer Pathways & Community Action',
    description: 'Join our grassroots volunteer team. Assist with LGBTQ+ youth groups, free health screening kit packing, Pride festival operations, and center hospitality.',
    canonicalPath: '/volunteer'
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    areasOfInterest: [],
    availability: 'Weekdays (Afternoons)',
    message: '',
    backgroundCheckConsent: false,
    turnstileToken: ''
  });

  const interestOptions = [
    { id: 'center', label: 'Community Resource Center Hospitality & Reception' },
    { id: 'youth', label: 'Youth Programs (Rainbow Umbrella & Little Unicorns)' },
    { id: 'health', label: 'Diversity SHINES Outreach & Safer-Sex Kit Packing' },
    { id: 'events', label: 'Ventura County Pride Festival & Gala Event Logistics' },
    { id: 'marketing', label: 'Social Media, Photography & Community Outreach' },
    { id: 'library', label: 'Lending Library & Archive Curation' }
  ];

  const handleInterestToggle = (id) => {
    setFormData(prev => {
      const exists = prev.areasOfInterest.includes(id);
      return {
        ...prev,
        areasOfInterest: exists
          ? prev.areasOfInterest.filter(x => x !== id)
          : [...prev.areasOfInterest, id]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.backgroundCheckConsent) {
      setStatus('error');
      setStatusMsg('Please provide consent for our standard volunteer vetting policy.');
      return;
    }

    setStatus('loading');
    const res = await submitVolunteer(formData);

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
      setStatusMsg(res.message || 'Submission error. Please call (805) 644-5428.');
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-emerald-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200/90 shadow-xs">
            GRASSROOTS ACTION & PARTICIPATION
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Volunteer With Us & <br />
            <span className="font-serif italic font-normal text-emerald-700">Make an Impact.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            "We do what we do, because of you." Our volunteers are the warm heart of our Community Resource Center, youth peer circles, and festival operations.
          </p>
        </div>
      </section>

      {/* Volunteer Pathways Showcase */}
      <section className="container-clean py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3">
            <span className="text-2xl">🏠</span>
            <h3 className="font-display text-lg font-bold text-slate-950">Center Hospitality</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Welcoming drop-in guests, assisting with computer lab access, and answering community telephone inquiries.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3">
            <span className="text-2xl">🌈</span>
            <h3 className="font-display text-lg font-bold text-slate-950">Youth Mentorship</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Supporting adult facilitation for Friday Rainbow Umbrella circles and craft workshops for Little Unicorns.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3">
            <span className="text-2xl">🩺</span>
            <h3 className="font-display text-lg font-bold text-slate-950">Health & Outreach</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Packing 'SHINE With Me' safer-sex kits and tabling at local college wellness fairs and community festivals.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3">
            <span className="text-2xl">🎉</span>
            <h3 className="font-display text-lg font-bold text-slate-950">Pride & Galas</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Ventura County Pride staging, ticketing, green-room coordination, and AIDS Walk operations.</p>
          </div>
        </div>
      </section>

      {/* Main Application Form */}
      <section className="container-clean py-8 max-w-3xl">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-200 shadow-2xl space-y-8">
          
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <span className="glass-pill text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200">
              JOIN THE TEAM
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-950">
              Volunteer Application Form
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Please share your background, availability, and areas of passion. Our volunteer coordinator conducts monthly orientation sessions.
            </p>
          </div>

          {status === 'success' ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-emerald-950">
                Application Received!
              </h3>
              <p className="text-sm text-emerald-900 max-w-md mx-auto font-medium leading-relaxed">
                {statusMsg}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Full Legal Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Jordan Bailey"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

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
                    placeholder="jordan@example.com"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(805) 555-0144"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="avail" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    General Availability <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="avail"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white font-medium"
                  >
                    <option value="Weekdays (Afternoons 1-5 PM)">Weekdays (Afternoons 1:00 – 5:00 PM)</option>
                    <option value="Friday Evenings (Youth Circles 5-8 PM)">Friday Evenings (Youth Circles 5:00 – 8:00 PM)</option>
                    <option value="Weekends (Special Events & Festivals)">Weekends (Special Events & Festivals)</option>
                    <option value="Flexible / As Needed">Flexible / As Needed</option>
                  </select>
                </div>
              </div>

              {/* Areas of Interest Checkboxes */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Select Areas of Interest (Check all that apply):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {interestOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-start gap-2.5 ${
                        formData.areasOfInterest.includes(opt.id)
                          ? 'border-[#5A1E65] bg-purple-50 text-[#5A1E65] font-bold'
                          : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.areasOfInterest.includes(opt.id)}
                        onChange={() => handleInterestToggle(opt.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="msg" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Why do you wish to volunteer with Diversity Collective?
                </label>
                <textarea
                  id="msg"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share a little about yourself, your hobbies, or any past volunteer experience..."
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                />
              </div>

              {/* Vetting & Background Check Consent */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <input
                  id="bgCheck"
                  type="checkbox"
                  required
                  checked={formData.backgroundCheckConsent}
                  onChange={(e) => setFormData({ ...formData, backgroundCheckConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <label htmlFor="bgCheck" className="text-xs text-slate-700 leading-relaxed font-medium">
                  <strong>Volunteer Safety & Vetting Consent:</strong> Because Diversity Collective provides safe spaces for minor youth and vulnerable adults, I agree to comply with our <Link to="/terms" className="text-emerald-700 font-bold underline hover:text-emerald-900">Code of Conduct</Link> and standard volunteer vetting policies under our <Link to="/privacy" className="text-emerald-700 font-bold underline hover:text-emerald-900">Privacy Policy</Link>. <span className="text-rose-600">*</span>
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
                  className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-2xl hover:scale-102 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{status === 'loading' ? 'Submitting Application...' : 'Submit Volunteer Application'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </section>

    </div>
  );
}

