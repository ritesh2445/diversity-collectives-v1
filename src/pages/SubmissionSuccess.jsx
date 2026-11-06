import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Heart, Calendar, Building2, BookOpen, Mail } from 'lucide-react';
import { usePageMeta } from '../utils/seo';

export default function SubmissionSuccess() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') || location.state?.type || 'general';
  const reference = searchParams.get('ref') || location.state?.reference || null;

  usePageMeta({
    title: 'Submission Received | Diversity Collective Ventura County',
    description: 'Thank you for connecting with Diversity Collective Ventura County. Your submission has been received.',
    canonicalPath: '/submission-success'
  });

  const typeConfig = {
    contact: {
      title: 'Message Received',
      subtitle: 'Thank you for reaching out to Diversity Collective.',
      description: 'Our team will review your inquiry and respond within 2 to 3 business days. If this is an urgent matter, please feel free to call our Community Resource Center directly at (805) 644-5428.',
      nextStep: 'While you wait, explore upcoming community programs and events.',
      ctaText: 'Browse Events',
      ctaLink: '/events',
      icon: Mail,
      accent: 'from-amber-500 to-rose-500'
    },
    volunteer: {
      title: 'Volunteer Application Received',
      subtitle: 'Welcome to the movement! Thank you for offering your time and talents.',
      description: 'Our volunteer coordinator reviews submissions weekly. We will be in touch with upcoming orientation dates, background clearance requirements, and scheduling opportunities based on your interest areas.',
      nextStep: 'Check out our community programs to see where our volunteers make an impact.',
      ctaText: 'Explore Programs',
      ctaLink: '/programs',
      icon: Heart,
      accent: 'from-purple-600 to-indigo-600'
    },
    business: {
      title: 'Directory Listing Submitted',
      subtitle: 'Thank you for joining our network of affirming Ventura County businesses.',
      description: 'All directory submissions undergo review by DCVC staff to verify business details and affirmation pledges before publication. Reviews typically take 3 to 5 business days.',
      nextStep: 'Explore existing listings in the Affirming Business Directory.',
      ctaText: 'View Directory',
      ctaLink: '/directory',
      icon: Building2,
      accent: 'from-emerald-600 to-teal-600'
    },
    training: {
      title: 'Training Request Received',
      subtitle: 'Thank you for prioritizing LGBTQ+ cultural competency in your organization.',
      description: 'Our education and training team will review your requested course, dates, and group size. We will provide a tailored training proposal, scheduling confirmation, and invoicing details within 2 business days.',
      nextStep: 'Review our complete P.R.I.D.E. course catalog and curriculum.',
      ctaText: 'View Training Catalog',
      ctaLink: '/training',
      icon: BookOpen,
      accent: 'from-violet-600 to-purple-700'
    },
    accessibility: {
      title: 'Accessibility Report Received',
      subtitle: 'Thank you for helping us make our digital spaces accessible to all.',
      description: 'Our technical accessibility team reviews every barrier report. If you provided contact information, we will notify you once a remediation or workaround is in place.',
      nextStep: 'Review our full accessibility commitments and testing standards.',
      ctaText: 'Accessibility Statement',
      ctaLink: '/accessibility',
      icon: CheckCircle2,
      accent: 'from-blue-600 to-cyan-600'
    },
    newsletter: {
      title: 'Subscribed to DCVC Updates',
      subtitle: 'You are now on our community dispatch list!',
      description: 'You will receive our monthly newsletter featuring local LGBTQ+ news, wellness resources, Pride updates, and upcoming gatherings. You may unsubscribe at any time.',
      nextStep: 'Read recent stories and dispatches on our news feed.',
      ctaText: 'Read News',
      ctaLink: '/news',
      icon: Mail,
      accent: 'from-fuchsia-600 to-pink-600'
    },
    general: {
      title: 'Submission Confirmed',
      subtitle: 'Thank you for connecting with Diversity Collective.',
      description: 'We have received your submission and our staff will review it promptly. Diversity Collective has proudly served Ventura County LGBTQ+ community members since 2014.',
      nextStep: 'Return to our homepage or explore our community resources.',
      ctaText: 'Back to Home',
      ctaLink: '/',
      icon: CheckCircle2,
      accent: 'from-purple-600 to-amber-500'
    }
  };

  const config = typeConfig[type] || typeConfig.general;
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center p-8 sm:p-12">
        {/* Success Icon */}
        <div className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr ${config.accent} text-white flex items-center justify-center shadow-lg shadow-purple-900/10 mb-6`}>
          <IconComponent className="w-10 h-10" aria-hidden="true" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Submission Status: Confirmed</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-3 tracking-tight">
          {config.title}
        </h1>

        <p className="text-lg font-medium text-purple-900 mb-4">
          {config.subtitle}
        </p>

        {reference && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 inline-block font-mono text-xs text-slate-600">
            Reference ID: <span className="font-bold text-slate-900">{reference}</span>
          </div>
        )}

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
          {config.description}
        </p>

        {/* What Happens Next Card */}
        <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-5 mb-8 text-left">
          <h2 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">Next Steps</h2>
          <p className="text-sm text-purple-950 mb-4">{config.nextStep}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={config.ctaLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-900 text-white text-sm font-semibold hover:bg-purple-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            >
              <span>{config.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            >
              Return Home
            </Link>
          </div>
        </div>

        {/* Direct contact note */}
        <div className="text-xs text-slate-500 border-t border-slate-100 pt-6">
          Need immediate support? Contact our Ventura Resource Center at{' '}
          <a href="tel:8056445428" className="text-purple-700 font-semibold underline hover:text-purple-900">
            (805) 644-5428
          </a>{' '}
          or email{' '}
          <a href="mailto:info@diversitycollective.org" className="text-purple-700 font-semibold underline hover:text-purple-900">
            info@diversitycollective.org
          </a>
        </div>
      </div>
    </div>
  );
}

