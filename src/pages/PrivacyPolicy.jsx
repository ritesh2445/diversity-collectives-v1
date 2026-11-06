import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { orgInfo } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

export default function PrivacyPolicy() {
  usePageMeta({
    title: 'Privacy Policy & Data Protection',
    description: 'Privacy policy and data protection disclosures for Diversity Collective Ventura County.',
    canonicalPath: '/privacy'
  });

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            LEGAL DISCLOSURES & PRIVACY PLEDGE
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Privacy Policy & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Data Protection.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Diversity Collective Ventura County is committed to protecting the privacy, confidentiality, and authentic safety of all who seek our services.
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <section className="container-clean py-14 max-w-4xl space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base font-medium">
        
        {/* Core Sanctuary Commitment Box */}
        <div className="p-8 rounded-3xl bg-purple-50/70 border-2 border-purple-200 space-y-3">
          <div className="flex items-center gap-2 text-[#5A1E65] font-display font-black text-xl">
            <ShieldCheck className="w-6 h-6 flex-shrink-0" />
            <span>Our Non-Negotiable Privacy Promise</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            As an LGBTQ+ community organization, we recognize that privacy is a matter of physical safety, psychological wellbeing, and dignity. <strong>We do not sell, rent, trade, or monetize your personal information, donor history, or health inquiries to any commercial entity or third-party broker under any circumstances.</strong>
          </p>
        </div>

        {/* 1. Information We Collect */}
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black text-slate-950">1. Information We Collect</h2>
          <p>We only collect personal information that you voluntarily choose to provide when interacting with our services:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Inquiries and Contact Forms:</strong> Name, email address, telephone number, and message content.</li>
            <li><strong>Volunteer Applications:</strong> Contact details, availability, areas of program interest, and vetting consent.</li>
            <li><strong>Affirming Business Directory:</strong> Business contact details, physical address, and non-discrimination pledge confirmation.</li>
            <li><strong>P.R.I.D.E. Workshop Requests:</strong> Organization name, contact lead, estimated attendees, and logistics notes.</li>
            <li><strong>Newsletter Subscriptions:</strong> Email address for community announcements.</li>
          </ul>
        </div>

        {/* 2. Health and Clinical Testing Confidentiality */}
        <div className="space-y-3 p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <h2 className="font-display text-xl font-black text-slate-950 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#5A1E65]" />
            <span>2. Health & Clinical Testing Confidentiality (Diversity SHINES)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            HIV and STI screenings conducted through Diversity SHINES are administered under strict California Department of Public Health certified counseling standards. <strong>No sensitive health or screening data is stored in the public website database or transferred across unencrypted web channels.</strong>
          </p>
        </div>

        {/* 3. Donations & Zero Card Storage */}
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black text-slate-950">3. Donations & Payment Processing</h2>
          <p>
            Online donations are processed directly through <strong>Zeffy</strong>, a certified secure platform for 501(c)(3) nonprofits. Diversity Collective Ventura County never stores, sees, or logs your credit card, debit card, or bank account numbers on our web servers.
          </p>
        </div>

        {/* 4. Cookies & Web Analytics */}
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black text-slate-950">4. Cookies & Privacy-Preserving Analytics</h2>
          <p>
            We use minimal, essential cookies and privacy-first analytics to monitor aggregated site traffic (such as page views and broken links) without fingerprinting your device or tracking you across external websites. You may disable cookies in your browser settings without affecting your access to our programs.
          </p>
        </div>

        {/* 5. California Privacy Rights */}
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black text-slate-950">5. Your California Privacy Rights</h2>
          <p>
            You have the right to request access to the personal information we have on file, to request correction of inaccurate data, or to request the complete deletion of your contact records from our mailing lists.
          </p>
        </div>

        {/* 6. Contacting the Privacy Officer */}
        <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-4">
          <h3 className="font-display text-xl font-bold text-white">Questions or Data Deletion Requests?</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            To update your communication preferences, unsubscribe from newsletters, or exercise your privacy rights, please reach out directly:
          </p>
          <div className="pt-2 text-xs space-y-1 text-slate-300 border-t border-slate-800">
            <p><strong>Diversity Collective Ventura County, Inc.</strong></p>
            <p>Attention: Privacy & Compliance Officer</p>
            <p>2471 Portola Road, Suite 100, Ventura, CA 93003</p>
            <p>Email: <a href={`mailto:${orgInfo.email}`} className="text-amber-300 underline font-bold">{orgInfo.email}</a> · Telephone: {orgInfo.phone}</p>
          </div>
        </div>

      </section>

    </div>
  );
}

