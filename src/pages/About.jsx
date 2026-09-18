import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowUpRight, 
  ShieldCheck, 
  Heart, 
  Award, 
  Users, 
  CheckCircle2,
  Sparkles,
  Target,
  Eye,
  Compass
} from 'lucide-react';
import { orgInfo, boardMembers, sponsorsList } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function About() {
  return (
    <div className="pt-8 md:pt-14 pb-20 bg-white text-slate-800">
      
      {/* Editorial Flagship Header with 3D Depth */}
      <section className="container-clean pb-16 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            ESTABLISHED 2014 · 501(C)(3) NONPROFIT
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Advocacy, safety & celebration <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">since 2014.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            "We believe that all people deserve a diverse, inclusive, accepting, and welcoming safe space. In lifting each other up even when it's hard, we build allies, opportunities, and resources to live our best lives."
          </p>
        </div>
      </section>

      {/* Mission, Vision & DEI Section with 3D Tilt Cards */}
      <section className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-100 relative">
        <div className="container-clean">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch perspective-1000">
            
            <div className="lg:col-span-6 flex flex-col gap-6">
              <CardSpotlight 
                className="glass-card p-8 rounded-3xl border-2 border-purple-200/80 shadow-lg interactive-card-3d glow-amethyst h-full flex flex-col justify-between"
                tilt={true}
                maxTilt={6}
                glare={true}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-[#5A1E65] uppercase tracking-wider bg-purple-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#5A1E65]" />
                      <span>OUR MISSION</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Ventura County</span>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-black text-slate-950 mb-3 tracking-tight">
                    Providing advocacy, visibility, safety, and wellness for the LGBTQ+ community.
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    We exist to eliminate isolation, combat discriminatory stigmas, and guarantee that LGBTQ+ individuals in Ventura County have immediate access to health, fellowship, and care.
                  </p>
                </div>
              </CardSpotlight>

              <CardSpotlight 
                className="glass-card p-8 rounded-3xl border-2 border-emerald-200/80 shadow-lg interactive-card-3d glow-teal h-full flex flex-col justify-between"
                tilt={true}
                maxTilt={6}
                glare={true}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>OUR VISION</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Equity & Dignity</span>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-black text-slate-950 mb-3 tracking-tight">
                    Immediate access to services, celebrated and treated with equity.
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {orgInfo.vision}
                  </p>
                </div>
              </CardSpotlight>
            </div>

            <div className="lg:col-span-6">
              <CardSpotlight 
                className="glass-card p-8 md:p-10 rounded-3xl border-2 border-amber-200/80 shadow-xl interactive-card-3d glow-amber h-full flex flex-col justify-between"
                tilt={true}
                maxTilt={6}
                glare={true}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-amber-800 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>DIVERSITY, EQUITY & INCLUSION</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Core Values</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    Fostering a Culture of Authentic Belonging
                  </h3>
                  <div className="space-y-3.5 text-sm text-slate-600 leading-relaxed font-medium">
                    <p>
                      DCVC is committed to fostering, cultivating, and preserving a culture of diversity, equity, and inclusion as we carry out our mission. This commitment applies to both the mission of the organization and the ways we interact with and provide opportunities for our staff, volunteers, and community.
                    </p>
                    <p>
                      We recognize that we cannot be successful without welcoming all perspectives, incorporating all points of view, and driving toward a world where everyone is provided the same opportunity to thrive.
                    </p>
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                      <p className="font-serif italic text-sm text-amber-950 leading-relaxed">
                        "The collective sum of individual differences, life experiences, knowledge, and unique capabilities that our employees, volunteers, and community invest in their work shapes our shared culture and organizational achievement."
                      </p>
                    </div>
                  </div>
                </div>
              </CardSpotlight>
            </div>

          </div>
        </div>
      </section>

      {/* Leadership & Board of Directors with 3D Cards */}
      <section className="py-20 container-clean">
        <div className="max-w-2xl mb-12">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200 mb-3 block">
            LEADERSHIP & GOVERNANCE
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
            Meet Our Board of Directors
          </h2>
          <p className="text-sm md:text-base text-slate-600 mt-2">
            Dedicated leaders from banking, public libraries, healthcare consulting, and grassroots advocacy guiding the vision of Diversity Collective.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
          {boardMembers.map((member) => (
            <CardSpotlight 
              key={member.name}
              className="glass-card p-7 rounded-2xl border-2 border-slate-200/80 hover:border-purple-300 interactive-card-3d flex flex-col justify-between"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {member.role}
                  </span>
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  {member.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {member.bio}
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100 text-xs font-bold text-[#5A1E65] flex items-center justify-between">
                <span>Diversity Collective VC</span>
                <span className="text-[10px] text-slate-400 font-medium">Board Member</span>
              </div>
            </CardSpotlight>
          ))}
        </div>
      </section>

      {/* Verified Sponsors & Partners */}
      <section className="py-20 bg-slate-50/60 border-t border-slate-100">
        <div className="container-clean">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="glass-pill text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200 mb-3 block">
              COLLABORATIVE PARTNERS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Thank You to Our Partners & Sponsors
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Our sponsors help fund programs and outreach that promote mental and physical wellness for the LGBTQ+ community across Ventura County.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto perspective-1000">
            {sponsorsList.map((sponsor) => (
              <a
                key={sponsor.shortName}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-7 rounded-2xl border-2 border-slate-200/80 hover:border-[#5A1E65] transition-all text-center shadow-md hover:shadow-2xl interactive-card-3d group cursor-pointer"
              >
                <div className="h-20 flex items-center justify-center mb-5">
                  <img 
                    src={sponsor.logo} 
                    alt={sponsor.name}
                    className="max-h-full max-w-[80%] object-contain group-hover:scale-108 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-display text-base font-black text-slate-900 group-hover:text-[#5A1E65] transition-colors flex items-center justify-center gap-1.5">
                  <span>{sponsor.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#5A1E65]" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{sponsor.role}</p>
              </a>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/contact"
              className="btn-primary py-3.5 px-8 inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <span>Partner With Diversity Collective</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
