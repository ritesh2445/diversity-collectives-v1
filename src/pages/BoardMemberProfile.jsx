import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Compass,
  Heart,
  MapPin,
  Quote,
  ShieldCheck,
  Users
} from 'lucide-react';
import { boardMembers, getBoardMemberSlug } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import { usePageMeta } from '../utils/seo';

export default function BoardMemberProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(() => cmsStore.getBoardMembers?.() || boardMembers);

  useEffect(() => {
    const unsub = cmsStore.subscribe(() => {
      setBoard(cmsStore.getBoardMembers?.() || boardMembers);
    });
    return unsub;
  }, []);

  const list = board.length > 0 ? board : boardMembers;
  const activeIndex = list.findIndex((m) => getBoardMemberSlug(m) === slug || String(m.id || '') === slug);
  const member = activeIndex >= 0 ? list[activeIndex] : list[0];
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0;

  const prevMember = list[(resolvedIndex - 1 + list.length) % list.length];
  const nextMember = list[(resolvedIndex + 1) % list.length];

  usePageMeta({
    title: member ? `${member.name} — Board of Directors` : 'Board Leadership Profile',
    description: member?.bio || 'Executive Board leadership stewarding Diversity Collective Ventura County.',
    canonicalPath: `/board/${getBoardMemberSlug(member)}`,
    ogImage: member?.photo || member?.image
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && nextMember) {
        navigate(`/board/${getBoardMemberSlug(nextMember)}`);
      } else if (e.key === 'ArrowLeft' && prevMember) {
        navigate(`/board/${getBoardMemberSlug(prevMember)}`);
      } else if (e.key === 'Escape') {
        navigate('/board-and-staff');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, nextMember, prevMember]);

  if (!member) return null;

  const portraitUrl = member.photo || member.image || '/images/volunteers.jpg';
  const focusAreas = member.focusAreas && member.focusAreas.length > 0
    ? member.focusAreas
    : ['501(c)(3) Institutional Stewardship', 'LGBTQ+ Sanctuary Advocacy', 'Community Partnership Building', 'Ventura County Equity'];
  const paragraphs = member.extendedBio && member.extendedBio.length > 0
    ? member.extendedBio
    : [member.bio];
  const ordinal = String(resolvedIndex + 1).padStart(2, '0');
  const totalCount = String(list.length).padStart(2, '0');

  return (
    <div className="relative min-h-[100svh] w-full bg-[#FCFAFE] text-slate-950 overflow-hidden">
      {/* Subtle Calm Lavender Architectural Wash */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-0 w-[34rem] h-[34rem] rounded-full bg-purple-100/60 blur-[120px]" />
        <div className="absolute bottom-0 -left-32 w-[28rem] h-[28rem] rounded-full bg-slate-100/80 blur-[110px]" />
      </div>

      {/* Minimalist Top Navigation Bar */}
      <div className="relative z-20 border-b border-slate-200/85 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Link
              to="/board-and-staff"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-xs font-bold tracking-wide text-slate-900 hover:text-[#5A1E65] transition-all shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#5A1E65]" />
              <span>Board &amp; Staff Directory</span>
            </Link>
            <Link
              to="/about"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-[#5A1E65] hover:bg-purple-50/60 transition-all"
            >
              <span>About DCVC</span>
            </Link>
          </div>

          {/* Roster Switcher Pills */}
          <nav aria-label="Switch board member profile" className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
            {list.map((b, i) => {
              const s = getBoardMemberSlug(b);
              const isActive = i === resolvedIndex;
              return (
                <Link
                  key={s}
                  to={`/board/${s}`}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-[#5A1E65] !text-white text-white border-[#5A1E65] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:text-[#5A1E65] hover:bg-purple-50/50'
                  }`}
                >
                  {b.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Minimalist Editorial Split Layout */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-20 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* LEFT COLUMN: Clean Portrait Frame + Minimalist Identity Strip + Pull Quote */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-[2rem] p-3 border border-slate-200/90 shadow-lg shadow-purple-950/[0.04] group">
              <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-100 aspect-[4/5]">
                <img
                  src={portraitUrl}
                  alt={member.name}
                  className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700"
                  onError={(e) => { e.target.src = '/images/volunteers.jpg'; }}
                />
              </div>

              {/* Clean Below-Portrait Caption Strip */}
              <div className="px-3 pt-4 pb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A1E65] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-[#5A1E65]" />
                    <span className="truncate">{member.city || 'Ventura County, CA'}</span>
                  </p>
                  <p className="font-display text-lg font-extrabold text-slate-950 truncate mt-0.5">
                    {member.name}
                    {member.pronouns ? (
                      <span className="ml-2 text-xs font-semibold text-slate-500">({member.pronouns})</span>
                    ) : null}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 font-mono text-xs font-bold text-[#5A1E65] flex-shrink-0">
                  {ordinal} / {totalCount}
                </span>
              </div>
            </div>

            {/* Minimalist Editorial Quote Card */}
            {member.quote && (
              <blockquote className="relative p-6 sm:p-7 rounded-3xl bg-white border border-purple-100 shadow-xs">
                <Quote className="w-6 h-6 text-[#5A1E65]/35 mb-3" />
                <p className="font-serif italic text-[1.1rem] sm:text-xl leading-relaxed text-slate-900 font-normal">
                  &ldquo;{member.quote}&rdquo;
                </p>
                <footer className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">&mdash; {member.name}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A1E65]">DCVC Steward</span>
                </footer>
              </blockquote>
            )}
          </aside>

          {/* RIGHT COLUMN: Executive Dossier, Bio Narrative & Strategic Focus */}
          <div className="lg:col-span-7 space-y-9">

            {/* Executive Header */}
            <header className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#5A1E65] text-xs font-extrabold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5A1E65]" />
                  <span>{member.role}</span>
                </span>
                {member.tenure && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold">
                    <Award className="w-3.5 h-3.5 text-[#5A1E65]" />
                    <span>{member.tenure}</span>
                  </span>
                )}
                {member.committee && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold">
                    <Compass className="w-3.5 h-3.5 text-[#5A1E65]" />
                    <span>{member.committee}</span>
                  </span>
                )}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 leading-[1.06]">
                {member.name}
              </h1>

              <p className="font-serif italic text-xl sm:text-[1.4rem] text-slate-800 leading-[1.6] max-w-2xl border-l-4 border-[#5A1E65] pl-5">
                {member.bio}
              </p>
            </header>

            {/* Minimalist Architectural Quick Facts Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A1E65] block mb-1.5">
                  Governance Seat
                </span>
                <p className="text-sm font-bold text-slate-950 leading-snug">{member.role}</p>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A1E65] block mb-1.5">
                  Home Base
                </span>
                <p className="text-sm font-bold text-slate-950 flex items-center gap-1.5 leading-snug">
                  <MapPin className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                  <span>{member.city || 'Ventura County, CA'}</span>
                </p>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A1E65] block mb-1.5">
                  Institution
                </span>
                <p className="text-sm font-bold text-slate-950 leading-snug">501(c)(3) Public Charity</p>
              </div>
            </div>

            {/* Clean Editorial Narrative */}
            <article className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-950 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#5A1E65]" />
                  </span>
                  <span>Leadership &amp; Community Impact</span>
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5A1E65]">
                  Biography
                </span>
              </div>

              <div className="space-y-4 text-[16px] sm:text-[16.5px] text-slate-800 leading-[1.78] font-normal">
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="text-slate-800">{p}</p>
                ))}
              </div>
            </article>

            {/* Strategic Focus Pillars */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#5A1E65] px-1">
                Strategic Focus Pillars
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {focusAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 transition-colors flex items-center gap-3.5 shadow-2xs"
                  >
                    <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-[#5A1E65] font-mono text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                      0{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimalist Calm Lavender Callout */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F7F3FB] border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A1E65] flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-[#5A1E65] text-[#5A1E65]" />
                  <span>Steward Our Mission Together</span>
                </span>
                <p className="font-display text-lg sm:text-xl font-extrabold text-slate-950">
                  Interested in joining a committee or supporting DCVC programs?
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 flex-shrink-0">
                <Link
                  to="/contact"
                  className="px-5 py-2.5 rounded-full bg-[#5A1E65] hover:bg-purple-900 !text-white text-white text-xs font-extrabold transition-all shadow-xs"
                >
                  Connect with Leadership
                </Link>
                <Link
                  to="/donate"
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-purple-50 border border-purple-200 text-[#5A1E65] text-xs font-extrabold transition-all"
                >
                  Support Our Sanctuary
                </Link>
              </div>
            </div>

            {/* Previous / Next Board Member Navigation */}
            {list.length > 1 && (
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to={`/board/${getBoardMemberSlug(prevMember)}`}
                  className="group p-4 rounded-2xl bg-white hover:bg-purple-50/40 border border-slate-200 hover:border-purple-300 transition-all flex items-center gap-4 shadow-2xs"
                >
                  <img
                    src={prevMember.photo || prevMember.image || '/images/volunteers.jpg'}
                    alt={prevMember.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 group-hover:text-[#5A1E65] flex items-center gap-1 transition-colors">
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                      <span>Previous Steward</span>
                    </span>
                    <p className="font-display font-extrabold text-base text-slate-950 truncate mt-0.5">{prevMember.name}</p>
                    <p className="text-[11px] font-semibold text-[#5A1E65] truncate">{prevMember.role}</p>
                  </div>
                </Link>

                <Link
                  to={`/board/${getBoardMemberSlug(nextMember)}`}
                  className="group p-4 rounded-2xl bg-white hover:bg-purple-50/40 border border-slate-200 hover:border-purple-300 transition-all flex items-center justify-between gap-4 text-right shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 group-hover:text-[#5A1E65] inline-flex items-center justify-end gap-1 w-full transition-colors">
                      <span>Next Steward</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <p className="font-display font-extrabold text-base text-slate-950 truncate mt-0.5">{nextMember.name}</p>
                    <p className="text-[11px] font-semibold text-[#5A1E65] truncate">{nextMember.role}</p>
                  </div>
                  <img
                    src={nextMember.photo || nextMember.image || '/images/volunteers.jpg'}
                    alt={nextMember.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                  />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
