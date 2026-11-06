import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  ShieldCheck, 
  MapPin, 
  Globe 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitBusiness } from '../services/api';
import { usePageMeta } from '../utils/seo';

export default function DirectorySubmit() {
  usePageMeta({
    title: 'Submit Your Business to the Affirming Directory',
    description: 'Join the Ventura County LGBTQ+ Affirming Business Directory. Submit your establishment for community review.',
    canonicalPath: '/directory/submit'
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Dining & Coffee',
    city: 'Ventura',
    address: '',
    website: '',
    phone: '',
    email: '',
    description: '',
    ownerName: '',
    ownerEmail: '',
    isLGBTQOwned: false,
    termsConsent: false
  });

  const categories = [
    'Dining & Coffee',
    'Health & Wellness',
    'Legal & Financial',
    'Retail & Gifts',
    'Fitness & Recreation',
    'Professional Services',
    'Arts & Creative',
    'Community Organization'
  ];

  const cities = [
    'Ventura',
    'Oxnard',
    'Camarillo',
    'Ojai',
    'Thousand Oaks',
    'Simi Valley',
    'Moorpark',
    'Santa Paula',
    'Port Hueneme',
    'Fillmore'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termsConsent) {
      setStatus('error');
      setStatusMsg('You must agree to the Non-Discrimination Community Pledge.');
      return;
    }

    setStatus('loading');
    const res = await submitBusiness(formData);

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
      setStatusMsg(res.message || 'Submission error. Please check your inputs.');
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Back link */}
      <div className="container-clean mb-6">
        <Link 
          to="/directory" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Business Directory</span>
        </Link>
      </div>

      <section className="container-clean max-w-3xl">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-200 shadow-xl space-y-8">
          
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
              DIRECTORY INCLUSION
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Submit Your Business
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Join the official Ventura County LGBTQ+ Affirming Directory. All submissions are moderated by DCVC staff before public listing to ensure safe, inclusive spaces for our community.
            </p>
          </div>

          {status === 'success' ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-emerald-950">
                Submission Received for Review!
              </h2>
              <p className="text-sm text-emerald-900 max-w-lg mx-auto font-medium leading-relaxed">
                {statusMsg}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link to="/directory" className="btn-primary py-2.5 px-6 text-xs font-bold">
                  Browse Active Directory
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

              {/* Business Basics */}
              <div className="space-y-4">
                <h3 className="font-display text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                  1. Business Information
                </h3>

                <div className="space-y-1.5">
                  <label htmlFor="bizName" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Business or Enterprise Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="bizName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Coastal Sol Cafe"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="cat" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      Primary Category <span className="text-rose-600">*</span>
                    </label>
                    <select
                      id="cat"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      Ventura County City <span className="text-rose-600">*</span>
                    </label>
                    <select
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white font-medium"
                    >
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Physical Street Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 123 Main St, Ventura, CA 93001"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="website" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      Website URL
                    </label>
                    <input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      Public Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(805) 555-0100"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Business Description & Community Mission <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="desc"
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell patrons about your products, services, welcoming culture, and why your business is an affirming space..."
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    id="lgbtqOwned"
                    type="checkbox"
                    checked={formData.isLGBTQOwned}
                    onChange={(e) => setFormData({ ...formData, isLGBTQOwned: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                  />
                  <label htmlFor="lgbtqOwned" className="text-xs font-bold text-slate-800 cursor-pointer">
                    🌈 This is an LGBTQ+ Owned Business (51%+ queer / trans ownership)
                  </label>
                </div>
              </div>

              {/* Submitter & Verification */}
              <div className="space-y-4 pt-4">
                <h3 className="font-display text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                  2. Submitter & Verification Details (Private to DCVC Staff)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="ownerName" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      Your Name & Title <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="ownerName"
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="e.g. Maria Gonzalez, Owner"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ownerEmail" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      Verification Email <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="ownerEmail"
                      type="email"
                      required
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="maria@example.com"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Affirming Pledge Consent */}
              <div className="flex items-start gap-3 p-4 bg-purple-50/60 rounded-xl border border-purple-200">
                <input
                  id="consentPledge"
                  type="checkbox"
                  required
                  checked={formData.termsConsent}
                  onChange={(e) => setFormData({ ...formData, termsConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                />
                <label htmlFor="consentPledge" className="text-xs text-slate-700 leading-relaxed font-medium">
                  <strong>Community Affirming Pledge:</strong> I confirm this business adheres to strict non-discrimination, respects pronouns, provides a safe environment for all gender identities and expressions, and consents to DCVC staff verification. <span className="text-rose-600">*</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-2xl hover:scale-102 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{status === 'loading' ? 'Transmitting Listing...' : 'Submit Business for Staff Approval'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </section>

    </div>
  );
}

