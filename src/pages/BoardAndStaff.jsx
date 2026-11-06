import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, Mail, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { boardMembers, staffMembers } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import CardSpotlight from '../components/CardSpotlight';
import { usePageMeta } from '../utils/seo';

export default function BoardAndStaff() {
  usePageMeta({
    title: 'Board of Directors & Staff',
    description: 'Meet the dedicated board of directors and operational staff stewarding Diversity Collective Ventura County.',
    canonicalPath: '/board-and-staff'
  });

  const [allStaff, setAllStaff] = useState(() => cmsStore.getStaff?.() || []);

  useEffect(() => {
    const unsub = cmsStore.subscribe((data) => {
      if (data?.staff) setAllStaff(data.staff);
    });
    return unsub;
  }, []);

  const operationalStaff = (allStaff.filter(s => s.category === 'staff').length > 0)
    ? allStaff.filter(s => s.category === 'staff')
    : staffMembers;

  const boardTeam = (allStaff.filter(s => s.category === 'board').length > 0)
    ? allStaff.filter(s => s.category === 'board')
    : boardMembers;

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {operationalStaff.map((staff, idx) => (
            <div 
              key={staff.id || idx}
              className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex flex-col justify-between gap-4"
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
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boardTeam.map((member, idx) => (
            <CardSpotlight 
              key={member.id || member.name || idx}
              className="glass-card p-7 rounded-2xl border-2 border-slate-200/80 hover:border-purple-300 flex flex-col justify-between"
              tilt={true}
              maxTilt={5}
              glare={true}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {member.role || member.title || 'Board Member'}
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
                <span className="text-[10px] text-slate-400 font-medium">501(c)(3) Board</span>
              </div>
            </CardSpotlight>
          ))}
        </div>
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

