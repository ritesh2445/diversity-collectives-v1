import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Mail, Phone, MapPin, ArrowLeft, HeartHandshake } from 'lucide-react';
import { usePageMeta } from '../utils/seo';

export default function SubmissionError() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const errorMessage = searchParams.get('message') || location.state?.error || 'We encountered an unexpected issue while transmitting your submission to our servers.';
  const retryPath = searchParams.get('retry') || location.state?.retryPath || '/contact';

  usePageMeta({
    title: 'Submission Issue | Diversity Collective Ventura County',
    description: 'We encountered an issue submitting your form. Contact Diversity Collective directly by phone or email.',
    canonicalPath: '/submission-error'
  });

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8 sm:p-12">
        {/* Error Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-900/10 mb-6">
          <AlertTriangle className="w-10 h-10" aria-hidden="true" />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-3">
            <span>Transmission Issue</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-3">
            We couldn't process your submission
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            {errorMessage}
          </p>
        </div>

        {/* Direct Communication Fallbacks */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>Connect With Us Directly</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <a
              href="tel:8056445428"
              className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
            >
              <Phone className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Direct Phone</p>
                <p className="text-slate-600 text-xs">(805) 644-5428</p>
                <p className="text-[11px] text-slate-400">Mon–Fri, 9am–5pm PT</p>
              </div>
            </a>

            <a
              href="mailto:info@diversitycollective.org"
              className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
            >
              <Mail className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Email Staff</p>
                <p className="text-slate-600 text-xs">info@diversitycollective.org</p>
                <p className="text-[11px] text-slate-400">Response in 1–2 business days</p>
              </div>
            </a>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-start gap-3 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-slate-800">Diversity Collective Community Resource Center</span>
              <p>2471 Portola Rd, Suite 100, Ventura, CA 93003</p>
            </div>
          </div>
        </div>

        {/* Crisis Support Section */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-950 mb-1">If You Are Experiencing a Crisis</h3>
              <p className="text-xs text-rose-800 leading-relaxed mb-3">
                If you or someone you know is in immediate distress or needs confidential LGBTQ+ affirming crisis support:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-rose-900 font-semibold">
                  The Trevor Project: <a href="tel:18664887386" className="underline hover:text-rose-700">1-866-488-7386</a>
                </span>
                <span className="px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-rose-900 font-semibold">
                  Suicide & Crisis Lifeline: <a href="tel:988" className="underline hover:text-rose-700">988</a>
                </span>
                <span className="px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-rose-900 font-semibold">
                  Trans Lifeline: <a href="tel:8775658860" className="underline hover:text-rose-700">877-565-8860</a>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            to={retryPath}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-900 text-white font-semibold text-sm hover:bg-purple-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Submitting Again</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

