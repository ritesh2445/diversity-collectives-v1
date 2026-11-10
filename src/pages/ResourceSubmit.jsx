import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  MapPin, 
  Globe, 
  Phone, 
  Mail,
  ShieldCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitInquiry } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';
import { usePageMeta } from '../utils/seo';

const RESOURCE_CATEGORIES = [
  'Healthcare & Mental Health',
  'Youth & Family Services',
  'Legal Aid & Advocacy',
  'Crisis & Emergency Housing',
  'Transgender & Non-Binary Care',
  'HIV/STI Testing & Prevention',
  'Seniors & Elder Care',
  'Education & GSA Support',
  'Faith & Affirming Communities',
  'Other Affirming Community Resource'
];

export default function ResourceSubmit() {
  usePageMeta({
    title: 'Submit an LGBTQ+ Affirming Resource',
    description: 'Recommend an LGBTQ+ friendly healthcare provider, support agency, or non-profit resource for the Ventura County directory.',
    canonicalPath: '/resources/submit'
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    organizationName: '',
    category: RESOURCE_CATEGORIES[0],
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: 'Ventura',
    description: '',
    spanishAvailable: false,
    freeOrSlidingScale: false,
    affirmingVerificationConsent: false,
    turnstileToken: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.affirmingVerificationConsent) {
      setStatus('error');
      setStatusMsg('Please verify that this resource is LGBTQ+ affirming and safe.');
      return;
    }

    setStatus('loading');
    const res = await submitInquiry({
      type: 'resource',
      name: formData.contactPerson || formData.organizationName,
      email: formData.email,
      phone: formData.phone,
      subject: `Resource Submission: ${formData.organizationName} (${formData.category})`,
      message: `Organization: ${formData.organizationName}\nCategory: ${formData.category}\nCity: ${formData.city}\nAddress: ${formData.address}\nWebsite: ${formData.website}\nSpanish Available: ${formData.spanishAvailable ? 'Yes' : 'No'}\nSliding Scale / Free: ${formData.freeOrSlidingScale ? 'Yes' : 'No'}\nDescription: ${formData.description}`,
      turnstileToken: formData.turnstileToken
    });

    if (res.success) {
      setStatus('success');
      setStatusMsg('Thank you! Your resource submission has been received. Our community curation team will review and publish it.');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } else {
      setStatus('error');
      setStatusMsg(res.error || 'Failed to submit resource. Please contact info@diversitycollective.org directly.');
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      <div className="container-clean max-w-3xl">
        
        {/* Navigation Breadcrumb */}
        <Link 
          to="/resources" 
          className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 mb-8 p-1 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Verified Resources</span>
        </Link>

        {/* Header */}
        <div className="mb-10">
          <span className="glass-pill text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border-purple-200 mb-3 block">
            VENTURA COUNTY AFFIRMING NETWORK
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Submit a Community <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Resource or Provider.</span>
          </h1>
          <p className="font-serif italic text-base sm:text-lg text-slate-600 mt-3 leading-relaxed">
            Help us expand Ventura County's network of vetted, LGBTQ+ affirming healthcare practitioners, social services, and grassroots programs.
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border-2 border-slate-200 shadow-xl">
          
          {status === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl font-black text-slate-900">Resource Submitted Successfully!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {statusMsg}
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Link to="/resources" className="btn-primary py-2.5 px-6 text-xs font-bold">
                  View Community Resources
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setStatusMsg('');
                  }}
                  className="py-2.5 px-5 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Submit Another Resource
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

              {/* Organization & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Organization or Provider Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ventura Coast Wellness Center"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Primary Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  >
                    {RESOURCE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@agency.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="(805) 555-0123"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Website & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.org"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    City in Ventura County
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  >
                    {['Ventura', 'Oxnard', 'Camarillo', 'Ojai', 'Thousand Oaks', 'Simi Valley', 'Santa Paula', 'Moorpark', 'Port Hueneme', 'Fillmore', 'Countywide'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Description of Services & LGBTQ+ Affirming Practices *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe services offered, intake processes, languages spoken, insurance or low-cost options, and specific LGBTQ+ competency..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Checkboxes for Spanish and Low Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.spanishAvailable}
                    onChange={(e) => setFormData({ ...formData, spanishAvailable: e.target.checked })}
                    className="w-4 h-4 text-purple-700 rounded border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-800">Spanish Language Services Available</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.freeOrSlidingScale}
                    onChange={(e) => setFormData({ ...formData, freeOrSlidingScale: e.target.checked })}
                    className="w-4 h-4 text-purple-700 rounded border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-800">Free, Medi-Cal, or Sliding-Scale Accepted</span>
                </label>
              </div>

              {/* Verification Consent */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-2">
                <input
                  type="checkbox"
                  required
                  checked={formData.affirmingVerificationConsent}
                  onChange={(e) => setFormData({ ...formData, affirmingVerificationConsent: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-700 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  I confirm that this organization/provider maintains an actively affirming, safe, and non-discriminatory environment for all LGBTQIA+ individuals.
                </span>
              </label>

              {/* Turnstile Bot Protection */}
              <TurnstileWidget 
                onSuccess={(token) => setFormData({ ...formData, turnstileToken: token })}
                action="resource_submission"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#5A1E65] to-purple-800 hover:from-purple-900 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Resource for Review...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Affirming Resource for Review</span>
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

