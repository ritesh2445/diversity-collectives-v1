import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, Mail, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { boardMembers, staffMembers, getBoardMemberSlug } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import CardSpotlight from '../components/CardSpotlight';
import MobileCarousel from '../components/MobileCarousel';
import { usePageMeta } from '../utils/seo';

export default function BoardAndStaff() {
  usePageMeta({
    title: 'Board of Directors & Staff',
    description: 'Meet the dedicated board of directors and operational staff stewarding Diversity Collective Ventura County.',
    canonicalPath: '/board-and-staff'
  });

  const [allStaff, setAllStaff] = useState(() => cmsStore.getStaff());

  useEffect(() => {
    const unsub = cmsStore.subscribe(() => {
      setAllStaff(cmsStore.getStaff());
    });
    return unsub;
  }, []);

  const operationalStaff = allStaff.filter(s => s.category === 'staff').length > 0 
    ? allStaff.filter(s => s.category === 'staff') 
    : staffMembers.map(s => ({ ...s, category: 'staff', title: s.title || s.role }));

  const boardTeam = allStaff.filter(s => s.category === 'board').length > 0
    ? allStaff.filter(s => s.category === 'board')
    : boardMembers.map(b => ({ ...b, category: 'board', title: b.title || b.role }));

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            LEADERSHIP & GOVERNANCE
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Board of Directors <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">& Operational Staff.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Diversity Collective is steered by community advocates, healthcare professionals, banking leaders, and educators passionate about LGBTQ+ wellbeing across Ventura County.
          </p>
        </div>
      </section>

      {/* Operational Staff Section */}
      <section className="container-clean py-16 border-b border-slate-100">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-3">
            COMMUNITY RESOURCE CENTER STAFF
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Our Everyday Team
          </h2>
          <p className="text-sm text-slate-600 mt-2 font-medium">
            The dedicated individuals managing daily drop-in hours, health screenings, and youth sanctuaries at 2471 Portola Road.
          </p>
        </div>

        <MobileCarousel cols={4} autoScrollMs={0} cardClassName="h-full flex flex-col">
          {operationalStaff.map((staff, idx) => (
            <div 
              key={staff.id || idx}
              className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex flex-col justify-between gap-4 h-full"
            >
              <div className="space-y-3">
                <div className="h-44 rounded-2xl overflow-hidden bg-purple-50 border border-slate-100">
                  <img 
                    src={staff.image || staff.photo || "/images/volunteers.jpg"} 
                    alt={staff.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "/images/volunteers.jpg"; }}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {staff.role || staff.title || 'Staff'}
                  </span>
                  <h3 className="font-display text-lg font-black text-slate-900 mt-2">{staff.name}</h3>
                  <span className="text-xs text-slate-500 font-medium block">{staff.department || 'Community Resource Center'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {staff.bio}
                </p>
                {staff.isPlaceholder && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 block italic">
                    {staff.placeholderNote}
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#5A1E65]">
                <a href={`mailto:${staff.email || 'info@diversitycollective.org'}`} className="hover:underline flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Lead</span>
                </a>
              </div>
            </div>
          ))}
        </MobileCarousel>
      </section>

      {/* Board of Directors Section */}
      <section className="container-clean py-16">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-block mb-3">
            GOVERNANCE & FIDUCIARY STEWARDSHIP
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
            Board of Directors
          </h2>
          <p className="text-sm md:text-base text-slate-600 mt-2 font-medium">
            Providing legal governance, institutional growth oversight, and community leadership for Diversity Collective Ventura County since 2014.
          </p>
        </div>

        <MobileCarousel cols={3} autoScrollMs={0} cardClassName="h-full flex flex-col">
          {boardTeam.map((member, idx) => {
            const slug = getBoardMemberSlug(member);
            return (
              <Link
                key={member.id || slug || idx}
                to={`/board/${slug}`}
                aria-label={`View full profile for ${member.name}, ${member.role || 'Board Member'}`}
                className="block group focus:outline-none focus:ring-4 focus:ring-purple-300 rounded-2xl"
              >
                <CardSpotlight 
                  className="glass-card h-full p-7 rounded-2xl border-2 border-slate-200/80 group-hover:border-[#5A1E65] group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  tilt={true}
                  maxTilt={5}
                  glare={true}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {member.role || member.title || 'Board Member'}
                      </span>
                      <Award className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                    </div>

                    {/* Circular Board Member Avatar */}
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
                      <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight group-hover:text-[#5A1E65] transition-colors">
                        {member.name}
                      </h3>
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

      {/* Volunteer or Join the Board CTA */}
      <section className="container-clean pt-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">CIVIC LEADERSHIP</span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-white">Interested in Serving on Our Board or Committees?</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              We continually seek passionate community members with legal, financial, healthcare, and grassroots outreach expertise to guide our mission.
            </p>
          </div>
          <Link to="/contact" className="btn-primary py-3 px-6 text-xs font-bold whitespace-nowrap shadow-lg">
            <span>Inquire About Board Service</span>
          </Link>
        </div>
      </section>

    </div>
  );
}

