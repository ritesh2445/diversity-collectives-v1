import React from 'react';
import { 
  Heart, 
  Users, 
  Briefcase, 
  Award, 
  ArrowUpRight, 
  ArrowRight, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  Sparkles,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { orgInfo } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function GetInvolved() {
  const triggerConfetti = (e) => {
    try {
      const rect = e?.currentTarget?.getBoundingClientRect();
      const originX = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
      const originY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.7;

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: originX, y: originY },
        colors: ['#5A1E65', '#F59E0B', '#10B981', '#38BDF8'],
        disableForReducedMotion: true
      });
    } catch (err) {
      // Graceful fallback
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-white text-slate-800">
      
      {/* Editorial Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            PARTICIPATION & SUSTAINABILITY
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Get Involved & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Support Our Mission.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            "We do what we do, because of you." Join our passionate network of sponsors, donors, and grassroots volunteers building safety, care, and visibility across Ventura County.
          </p>
        </div>

        {/* 4 Interactive Jump Links with Smooth Scroll */}
        <div className="flex flex-wrap items-center gap-3 pt-8">
          <button 
            onClick={() => scrollToSection('donate')}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#5A1E65] text-white hover:bg-purple-900 transition-all shadow-md interactive-card-3d cursor-pointer flex items-center gap-1.5"
          >
            <Heart className="w-3.5 h-3.5 fill-current text-rose-300" />
            <span>01 Donate</span>
          </button>
          <button 
            onClick={() => scrollToSection('volunteer')}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300 hover:bg-slate-50 transition-all shadow-xs interactive-card-3d cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>02 Volunteer</span>
          </button>
          <button 
            onClick={() => scrollToSection('sponsor')}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300 hover:bg-slate-50 transition-all shadow-xs interactive-card-3d cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>03 Sponsor</span>
          </button>
          <button 
            onClick={() => scrollToSection('careers')}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300 hover:bg-slate-50 transition-all shadow-xs interactive-card-3d cursor-pointer flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <span>04 Careers</span>
          </button>
        </div>
      </section>

      {/* 01 DONATE SECTION */}
      <section id="donate" className="py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="container-clean">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block">
                PATHWAY 01 · TAX-DEDUCTIBLE CONTRIBUTIONS
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
                Donate to Diversity Collective
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-medium">
                Donations keep Diversity Collective Ventura County growing and thriving. It is our mission to make our Community Resource Center self-sustaining through individual donations, monthly sustainer pledges, and community fundraisers. We do not rely solely on government subsidies.
              </p>
              
              <div className="p-6 bg-white rounded-2xl border-2 border-purple-100 shadow-sm space-y-2 text-xs">
                <p className="font-black text-slate-900 text-sm">Tax Status & Financial Integrity:</p>
                <p className="text-slate-600 font-medium">
                  Diversity Collective is a California nonprofit public benefit corporation exempt under Section 501(c)(3) of the Internal Revenue Code. All contributions are fully tax-deductible.
                </p>
                <p className="font-bold text-[#5A1E65] pt-1">
                  Federal EIN: <strong>{orgInfo.ein}</strong> · California Corp ID: <strong>{orgInfo.caCorpNumber}</strong>
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href={orgInfo.donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerConfetti}
                  className="btn-primary py-3.5 px-7 text-sm font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-current text-rose-400 animate-bounce" />
                  <span>Donate Online (Official Portal)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <a
                  href={orgInfo.brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-3.5 px-6 text-sm font-bold inline-flex items-center gap-2 bg-white"
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Download Giving Brochure</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 perspective-1000">
              <CardSpotlight
                className="p-8 bg-white rounded-3xl border-2 border-purple-200 shadow-xl space-y-6 interactive-card-3d glow-amethyst"
                tilt={true}
                maxTilt={6}
                glare={true}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-black text-slate-950">
                    Where Your Gift Goes
                  </h3>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <ul className="space-y-4 text-xs sm:text-sm text-slate-600 font-medium">
                  <li className="flex items-start gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Free confidential rapid HIV and STI screenings each month</span>
                  </li>
                  <li className="flex items-start gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Safe weekly meeting space for LGBTQ+ youth (Rainbow Umbrella)</span>
                  </li>
                  <li className="flex items-start gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Free 'SHINE With Me' safer sex and hygiene supplies</span>
                  </li>
                  <li className="flex items-start gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Operating costs for the 2471 Portola Road Community Center</span>
                  </li>
                </ul>
              </CardSpotlight>
            </div>

          </div>
        </div>
      </section>

      {/* 02 VOLUNTEER SECTION */}
      <section id="volunteer" className="py-20 border-b border-slate-100">
        <div className="container-clean">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 order-2 lg:order-1 perspective-1000">
              <CardSpotlight 
                className="rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] border-2 border-slate-200 group interactive-card-3d"
                tilt={true}
                maxTilt={6}
                glare={true}
              >
                <img 
                  src="/images/volunteers.jpg" 
                  alt="Diversity Collective Volunteers at community information booth"
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                />
              </CardSpotlight>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                PATHWAY 02 · GRASSROOTS COMMUNITY IMPACT
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
                Volunteer With Us!
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-medium">
                Our volunteers have many avenues in which to best express their passion. We have great events, weekly circles, and outreach campaigns that leave you knowing you made a tangible difference.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1 text-sm">Center & Front Desk</h4>
                  <p className="text-slate-600">Welcoming guests to the Community Resource Center, library support, and hospitality.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1 text-sm">Youth & Cultural Events</h4>
                  <p className="text-slate-600">Assisting with Pride Prom, Little Unicorns family craft days, and youth logistics.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1 text-sm">Festival & Gala Support</h4>
                  <p className="text-slate-600">Ventura County Pride staging, ticketing, vendor coordination, and AIDS Walk operations.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1 text-sm">Health & Outreach</h4>
                  <p className="text-slate-600">Packing 'SHINE With Me' safer sex kits and distributing resources at local community fairs.</p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={orgInfo.volunteerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary py-3.5 px-8 text-sm font-bold inline-flex items-center gap-2 shadow-md hover:shadow-xl"
                >
                  <Users className="w-4 h-4" />
                  <span>Fill Out Volunteer Application Form</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 03 SPONSOR SECTION */}
      <section id="sponsor" className="py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="container-clean">
          <div className="max-w-3xl space-y-6">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
              PATHWAY 03 · CORPORATE & CIVIC PARTNERSHIP
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Sponsor Our Initiatives
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Our sponsors help fund programs and projects that promote diversity through education-focused community outreach. This allows for the development of new resources that translate into greater mental and physical wellness for the LGBTQ+ community across Ventura County.
            </p>
            
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${orgInfo.email}?subject=Corporate%20Sponsorship%20Inquiry`}
                className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-md hover:shadow-xl"
              >
                <Mail className="w-4 h-4" />
                <span>Email Our Sponsorship Team</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={`tel:${orgInfo.phoneRaw}`}
                className="btn-secondary py-3 px-6 text-xs sm:text-sm font-bold inline-flex items-center gap-2 bg-white"
              >
                <Phone className="w-4 h-4 text-purple-600" />
                <span>Call {orgInfo.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 04 CAREERS SECTION */}
      <section id="careers" className="py-20">
        <div className="container-clean">
          <div className="max-w-3xl space-y-6">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block">
              PATHWAY 04 · EMPLOYMENT & CAREERS
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Careers at Diversity Collective
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Interested in helping your community and joining the Diversity Collective Ventura County team? We are an equal opportunity employer dedicated to building a team that reflects the beautiful diversity of our community.
            </p>

            {/* Current Status with Actionable CTA */}
            <div className="p-8 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-200/60 px-3 py-1 rounded-full">
                  CURRENT HIRING STATUS
                </span>
                <span className="text-xs text-slate-400 font-medium">Updated 2026</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-black text-slate-900">
                No Open Staff Positions At This Time
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                We do not currently have any vacant staff positions. However, we always welcome passionate resumes and general interest inquiries from qualified community members for future openings.
              </p>
              <div className="pt-2">
                <a
                  href={`mailto:${orgInfo.email}?subject=General%20Employment%20Interest%20-%20Resume%20Submission`}
                  className="btn-secondary text-xs py-2.5 px-5 font-bold inline-flex items-center gap-2 bg-white"
                >
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Send Resume to Leadership ({orgInfo.email})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
