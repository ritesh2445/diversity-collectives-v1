import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { orgInfo } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

export default function TermsAndConditions() {
  usePageMeta({
    title: 'Terms of Use & Community Standards',
    description: 'Terms and conditions, community standards, and non-discrimination policies for Diversity Collective Ventura County.',
    canonicalPath: '/terms'
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
            TERMS OF USE & COMMUNITY STANDARDS
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Terms of Use & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Community Pledge.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Standards of dignity, mutual respect, safety, and equitable participation across all Diversity Collective digital and physical spaces.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container-clean py-14 max-w-4xl space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base font-medium">
        
        <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-3">
          <h2 className="font-display text-xl font-black text-slate-950">1. Acceptance of Terms</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            By accessing or using the Diversity Collective Ventura County website (diversitycollective.org), our online forms, or participating in our physical sanctuary programs, you agree to comply with these terms, our <Link to="/privacy" className="text-[#5A1E65] font-bold underline hover:text-purple-900">Privacy Policy</Link>, and our Community Code of Conduct.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black text-slate-950">2. Community Code of Conduct & Safe Spaces</h2>
          <p>
            Diversity Collective exists to eliminate isolation and create safe, trauma-informed sanctuaries for LGBTQ+ individuals of all intersecting identities. We maintain a zero-tolerance policy for:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li>Harassment, threats, hate speech, or intimidation targeting race, sexual orientation, gender identity, expression, disability, immigration status, or religious beliefs.</li>
            <li>Doxxing or unconsented recording/photographing of participants inside our physical Center or youth circles.</li>
            <li>Disruption of peer support circles, support groups, or clinical services.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black text-slate-950">3. Affirming Business Directory Disclaimers</h2>
          <p className="text-xs sm:text-sm">
            Listings in our LGBTQ+ Affirming Directory are provided as an educational and community networking resource. While DCVC vets business pledges, we do not officially endorse or guarantee third-party commercial transactions or services. Community members are encouraged to report any non-affirming experiences to our directory team.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black text-slate-950">4. Charitable Contributions & Refunds</h2>
          <p className="text-xs sm:text-sm">
            Donations made to Diversity Collective Ventura County, Inc. are irrevocable charitable gifts recognized under Section 501(c)(3) of the Internal Revenue Code. Tax receipts are issued immediately. If an error occurs during an online payment transaction, please contact our administrative team within 30 days for prompt resolution.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-2xl font-black text-slate-950">5. Intellectual Property</h2>
          <p className="text-xs sm:text-sm">
            The Diversity Collective Ventura County logo, P.R.I.D.E. curriculum, Diversity SHINES materials, and website text are protected by copyright and intellectual property laws. Content may not be reproduced for commercial gain without prior written consent.
          </p>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Terms last revised: October 2026</span>
          <Link to="/contact" className="text-[#5A1E65] font-bold hover:underline">
            Contact Legal & Governance Team
          </Link>
        </div>

      </section>

    </div>
  );
}

