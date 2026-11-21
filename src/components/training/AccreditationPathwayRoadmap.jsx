import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Store, 
  Users, 
  ShieldCheck, 
  Sparkles,
  Award,
  Calendar,
  FileCheck2,
  Package
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DcvcApprovedBadge from '../DcvcApprovedBadge';

const STEPS = [
  {
    step: "01",
    title: "Request & Customize",
    subtitle: "Tailored to your sector",
    description: "Submit a 60-second workshop request. Choose on-site training at your Ventura County storefront or an interactive virtual session for your shift leads and team.",
    deliverable: "Customized syllabus, scheduling consultation & participant materials.",
    icon: Calendar,
    color: "from-purple-500 to-indigo-600",
    badge: "Step 1: Intake"
  },
  {
    step: "02",
    title: "Interactive Team Workshop",
    subtitle: "2.5 Hours · Engaging & Practical",
    description: "Led by certified DCVC educators. Frontline staff and leadership master gender-affirming customer hospitality, pronoun etiquette, de-escalation, and California SB 396 workplace compliance.",
    deliverable: "Roleplaying scenarios, de-escalation protocols & CEU certificates.",
    icon: Users,
    color: "from-indigo-600 to-blue-600",
    badge: "Step 2: Training"
  },
  {
    step: "03",
    title: "Affirming Space Walkthrough",
    subtitle: "Physical & Policy Verification",
    description: "Verify inclusive single-occupancy geometric restroom signage (CA Health & Safety Code § 118600) and sign the DCVC Affirming Business Non-Discrimination Charter.",
    deliverable: "Facility checklist verification & formal charter agreement.",
    icon: FileCheck2,
    color: "from-blue-600 to-teal-500",
    badge: "Step 3: Verification"
  },
  {
    step: "04",
    title: "DCVC Approved Certification",
    subtitle: "Storefront & Directory Verification",
    description: "Graduate as an accredited DCVC Approved Business Partner! Receive your physical window cling, framed certificate, and unlock your 3D flipping verified badge and rainbow glow in the Directory.",
    deliverable: "Physical Window Cling, Framed Certificate, 3D Directory Badge & Live Hype Meter.",
    icon: Award,
    color: "from-emerald-500 to-green-600",
    badge: "Step 4: Certified Partner"
  }
];

export default function AccreditationPathwayRoadmap({ content }) {
  return (
    <div className="w-full space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="glass-pill text-xs font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border-purple-200">
          {content?.roadmapEyebrow || 'OFFICIAL ACCREDITATION ROADMAP'}
        </span>
        <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
          {content?.roadmapTitle ? (
            <span>{content.roadmapTitle}</span>
          ) : (
            <>
              How Your Business Becomes <br />
              <span className="bg-gradient-to-r from-[#5A1E65] via-purple-700 to-emerald-600 bg-clip-text text-transparent">
                DCVC Approved & Certified
              </span>
            </>
          )}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          {content?.roadmapSubtitle || 'A seamless 4-step journey from staff education to trusted community storefront status across Ventura County.'}
        </p>
      </div>

      {/* Grid of 4 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div 
              key={idx}
              className="p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-md hover:shadow-xl transition-all flex flex-col justify-between gap-6 relative group"
            >
              <div className="space-y-4">
                {/* Step Pill & Step Number */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    {step.badge}
                  </span>
                  <span className="font-display text-3xl font-black text-slate-200 group-hover:text-purple-200 transition-colors">
                    {step.step}
                  </span>
                </div>

                {/* Icon Bubble */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-lg font-black text-slate-950 leading-tight">
                    {step.title}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 block">
                    {step.subtitle}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>

              {/* Deliverable Footer */}
              <div className="pt-4 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Deliverable:
                </span>
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {step.deliverable}
                </span>

                {idx === 3 && (
                  <div className="pt-2">
                    <DcvcApprovedBadge />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pathway Callout Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#5A1E65] via-purple-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-purple-400/30">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              FAST-TRACK ONBOARDING
            </span>
          </div>
          <h4
            className="font-display text-2xl font-black tracking-tight text-white !text-white"
            style={{ color: '#FFFFFF' }}
          >
            {content?.roadmapBannerHeading || 'Ready to train your team and earn the DCVC Approved seal?'}
          </h4>
          <p className="text-xs sm:text-sm text-purple-200 max-w-xl font-medium">
            {content?.roadmapBannerText || 'Join over 40+ accredited Ventura County cafes, health clinics, salons, and offices that pride themselves on authentic inclusivity.'}
          </p>
        </div>

        <Link
          to="/training/dcvc-affirming-business/book"
          className="py-3 px-7 text-xs font-black tracking-wide rounded-full text-white !text-white bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 border border-purple-300/40 shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-102 shrink-0"
          style={{ color: '#FFFFFF' }}
        >
          <span className="text-white !text-white font-black" style={{ color: '#FFFFFF' }}>
            {content?.roadmapBannerButtonText || 'Schedule Storefront Training'}
          </span>
          <ArrowRight className="w-4 h-4 text-white !text-white" style={{ color: '#FFFFFF' }} />
        </Link>
      </div>
    </div>
  );
}
