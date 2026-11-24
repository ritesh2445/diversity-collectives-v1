import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Award, 
  Sparkles,
  Target,
  Eye,
  Users,
  Mail,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { orgInfo, boardMembers, sponsorsList, staffMembers, getBoardMemberSlug } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import CardSpotlight from '../components/CardSpotlight';
import MemoryLaneSection from '../components/MemoryLaneSection';
import MobileCarousel from '../components/MobileCarousel';

export default function About() {
  const location = useLocation();
  const [board, setBoard] = useState(() => cmsStore.getBoardMembers?.() || boardMembers);
  const [operationalStaff, setOperationalStaff] = useState(() => cmsStore.getStaffMembers?.() || staffMembers);
  const [showOperationalStaff, setShowOperationalStaff] = useState(() => cmsStore.getSettings?.()?.showOperationalStaff !== false);
  const [sponsors, setSponsors] = useState(() => cmsStore.getSponsors?.() || sponsorsList);
  const [activeLeadershipTab, setActiveLeadershipTab] = useState('all'); // 'all' | 'board' | 'staff'

  useEffect(() => {
    return cmsStore.subscribe(() => {
      setBoard(cmsStore.getBoardMembers?.() || boardMembers);
      setOperationalStaff(cmsStore.getStaffMembers?.() || staffMembers);
      setShowOperationalStaff(cmsStore.getSettings?.()?.showOperationalStaff !== false);
      setSponsors(cmsStore.getSponsors?.() || sponsorsList);
    });
  }, []);

  // Handle direct anchor links such as /about#operational-staff
  useEffect(() => {
    if (location.hash === '#operational-staff') {
      setActiveLeadershipTab('staff');
      const el = document.getElementById('operational-staff');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else if (location.hash === '#board') {
      setActiveLeadershipTab('board');
      const el = document.getElementById('board');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash]);
  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Editorial Flagship Header with 3D Depth */}
      <section className="container-clean pb-12 sm:pb-16 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div 
          className="absolute -top-24 -right-10 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
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

      {/* DCVC Historical Memory Lane (Relocated to About) */}
      <MemoryLaneSection />

      {/* Leadership & Staff Navigation Bar */}
      <section className="pt-16 pb-6 container-clean" id="leadership">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200 mb-2 inline-block">
              LEADERSHIP & GOVERNANCE
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
              Leadership & Team
            </h2>
            <p className="text-sm md:text-base text-slate-600 mt-1 max-w-2xl">
              Meet our volunteer Board of Directors guiding policy and governance, and our everyday Operational Staff managing direct community services.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          {showOperationalStaff && operationalStaff.length > 0 && (
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-2xs shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveLeadershipTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeLeadershipTab === 'all'
                    ? 'bg-[#5A1E65] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                All Team
              </button>
              <button
                type="button"
                onClick={() => setActiveLeadershipTab('board')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeLeadershipTab === 'board'
                    ? 'bg-[#5A1E65] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Board of Directors ({board.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLeadershipTab('staff');
                  const el = document.getElementById('operational-staff');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeLeadershipTab === 'staff'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Operational Staff ({operationalStaff.length})</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Board of Directors Section */}
      {(activeLeadershipTab === 'all' || activeLeadershipTab === 'board') && (
        <section className="py-12 container-clean" id="board">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-block mb-2">
              GOVERNANCE & FIDUCIARY STEWARDSHIP
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Board of Directors
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Dedicated leaders from banking, public libraries, healthcare consulting, and grassroots advocacy guiding the vision of Diversity Collective.
            </p>
          </div>

          <MobileCarousel cols={3} autoScrollMs={0} className="perspective-1000 items-stretch" cardClassName="h-full flex flex-col">
            {board.map((member) => {
              const slug = getBoardMemberSlug(member);
              return (
                <Link
                  key={slug || member.name}
                  to={`/board/${slug}`}
                  aria-label={`View full profile for ${member.name}, ${member.role}`}
                  className="block flex-1 h-full group focus:outline-none focus:ring-4 focus:ring-purple-300 rounded-2xl"
                >
                  <CardSpotlight 
                    className="glass-card h-full p-6 sm:p-7 rounded-2xl border-2 border-slate-200/80 group-hover:border-[#5A1E65] group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300 interactive-card-3d flex flex-col justify-between cursor-pointer"
                    tilt={true}
                    maxTilt={6}
                    glare={true}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {member.role}
                        </span>
                        <Award className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                      </div>

                      {/* Circular Board Member Portrait */}
                      <div className="flex justify-center py-2">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-purple-200/90 group-hover:border-amber-400 shadow-md ring-4 ring-purple-50 bg-purple-50 flex-shrink-0 transition-colors">
                          <img 
                            src={member.photo || member.image || "/images/volunteers.jpg"} 
                            alt={member.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.target.src = "/images/volunteers.jpg"; }}
                          />
                        </div>
                      </div>

                      <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                          <h4 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight group-hover:text-[#5A1E65] transition-colors">
                            {member.name}
                          </h4>
                          {member.pronouns && (
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              {member.pronouns}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mt-2 line-clamp-4">
                          {member.bio}
                        </p>
                      </div>
                    </div>
                    <div className="pt-5 mt-5 border-t border-slate-100 text-xs font-bold text-[#5A1E65] flex items-center justify-between">
                      <span>Explore Full Profile</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 group-hover:bg-[#5A1E65] group-hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider">
                        Read Bio <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </CardSpotlight>
                </Link>
              );
            })}
          </MobileCarousel>
        </section>
      )}

      {/* Operational Staff Section (Direct Section on /about) */}
      {showOperationalStaff && operationalStaff.length > 0 && (activeLeadershipTab === 'all' || activeLeadershipTab === 'staff') && (
        <section className="py-12 container-clean border-t border-slate-100" id="operational-staff">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
              COMMUNITY RESOURCE CENTER STAFF
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Operational Staff Leadership
            </h3>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              The everyday professionals managing drop-in hours, health screenings, and sanctuaries at 2471 Portola Road.
            </p>
          </div>

          <MobileCarousel cols={4} autoScrollMs={0} className="items-stretch" cardClassName="h-full flex flex-col">
            {operationalStaff.map((staff, idx) => (
              <div 
                key={staff.id || staff.slug || idx}
                className="p-6 rounded-3xl bg-white border-2 border-slate-200/80 hover:border-emerald-500 hover:shadow-xl transition-all flex flex-col justify-between gap-4 flex-1 h-full"
              >
                <div className="space-y-3">
                  <div className="h-44 rounded-2xl overflow-hidden bg-purple-50 border border-slate-100">
                    <img 
                      src={staff.photo || staff.image || "/images/volunteers.jpg"} 
                      alt={staff.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "/images/volunteers.jpg"; }}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {staff.role || staff.title || 'Staff'}
                    </span>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <h4 className="font-display text-lg font-black text-slate-900">{staff.name}</h4>
                      {staff.pronouns && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {staff.pronouns}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {staff.department || 'Community Resource Center'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-4">
                    {staff.bio}
                  </p>
                  {staff.isPlaceholder && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 block italic">
                      {staff.placeholderNote}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#5A1E65]">
                  <a 
                    href={`mailto:${staff.email || 'info@diversitycollective.org'}`} 
                    className="hover:underline flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact Lead</span>
                  </a>
                  <span className="text-[10px] text-slate-400 font-medium">Ventura CRC</span>
                </div>
              </div>
            ))}
          </MobileCarousel>
        </section>
      )}

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

          <div className="max-w-5xl mx-auto w-full">
          <MobileCarousel cols={3} autoScrollMs={0} className="items-stretch" cardClassName="h-full flex flex-col">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.shortName}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="sponsor-card flex-1 h-full w-full bg-white p-5 sm:p-6 lg:p-7 rounded-2xl border-2 border-slate-200/80 hover:border-[#5A1E65] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-center shadow-md group cursor-pointer flex flex-col justify-between overflow-hidden min-w-0 box-border"
              >
                <div className="h-20 flex items-center justify-center mb-5 shrink-0 w-full overflow-hidden">
                  <img 
                    src={sponsor.logo} 
                    alt={sponsor.name}
                    className="max-h-full max-w-[80%] object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="w-full min-w-0 flex flex-col items-center">
                  <h3 className="font-display text-sm sm:text-base font-black text-slate-900 group-hover:text-[#5A1E65] transition-colors leading-snug w-full text-center break-words [overflow-wrap:anywhere]">
                    <span>{sponsor.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#5A1E65] shrink-0 inline-block ml-1 align-baseline" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium break-words [overflow-wrap:anywhere] leading-relaxed text-center w-full">
                    {sponsor.role}
                  </p>
                </div>
              </a>
            ))}
          </MobileCarousel>
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
