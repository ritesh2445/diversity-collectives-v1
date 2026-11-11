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
  Sparkles,
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
    <div className="relative min-h-[100svh] w-full bg-[#090612] text-white overflow-hidden">
      {/* Dramatic Ambient Architectural Backdrops */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-32 w-[38rem] h-[38rem] rounded-full bg-[#5A1E65]/45 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 w-[34rem] h-[34rem] rounded-full bg-amber-500/20 blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] rounded-full bg-emerald-500/15 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      {/* Top Editorial Navigation Ribbon */}
      <div className="relative z-20 border-b border-white/10 bg-[#090612]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/board-and-staff"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold tracking-wide text-white transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Board &amp; Staff Directory</span>
            </Link>
            <Link
              to="/about"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-purple-200 hover:text-white hover:bg-white/10 transition-all"
            >
              <span>About DCVC</span>
            </Link>
          </div>

          {/* Roster Quick Switcher Pills */}
          <nav aria-label="Switch board member profile" className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
            {list.map((b, i) => {
              const s = getBoardMemberSlug(b);
              const isActive = i === resolvedIndex;
              return (
                <Link
                  key={s}
                  to={`/board/${s}`}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/25'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {b.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Full-Screen Split Editorial Canvas */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-16 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* LEFT MONOLITH: Full-Height Sculpted Portrait + Quote Seal */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="relative group">
              {/* Outer Glowing Metallic Halo */}
              <div
                className="absolute -inset-1 rounded-[2.25rem] bg-gradient-to-tr from-[#5A1E65] via-amber-400/70 to-emerald-400/60 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-500"
                aria-hidden="true"
              />

              <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 border border-white/20 shadow-2xl aspect-[4/5]">
                <img
                  src={portraitUrl}
                  alt={member.name}
                  className="w-full h-full object-cover object-top scale-[1.01] group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => { e.target.src = '/images/volunteers.jpg'; }}
                />

                {/* Editorial Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090612] via-[#090612]/25 to-transparent" />

                {/* Floating Corner Sequence & Role Chip */}
                <div className="absolute top-5 left-5 right-5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#090612]/80 backdrop-blur-md border border-amber-400/40 text-[11px] font-black uppercase tracking-widest text-amber-300">
                    <Award className="w-3.5 h-3.5" />
                    <span>{member.tenure || 'Board Leadership'}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 font-mono text-xs font-black text-white">
                    {ordinal} / {totalCount}
                  </span>
                </div>

                {/* Portrait Bottom Caption Plaque */}
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-[#090612]/80 backdrop-blur-xl border border-white/15 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      {member.city || 'Ventura County, CA'}
                    </p>
                    <p className="font-display text-lg font-extrabold text-white leading-tight">
                      {member.name} {member.pronouns ? <span className="text-xs font-medium text-purple-200/80">({member.pronouns})</span> : null}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5A1E65] to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg border border-white/25">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pull Quote Plaque */}
            {member.quote && (
              <blockquote className="relative p-6 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/15 backdrop-blur-xl shadow-xl">
                <Quote className="w-7 h-7 text-amber-400/80 mb-3" />
                <p className="font-serif italic text-lg sm:text-xl leading-relaxed text-amber-50/95">
                  &ldquo;{member.quote}&rdquo;
                </p>
                <footer className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-purple-200/80 font-semibold">
                  <span>— {member.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-amber-300">DCVC Steward</span>
                </footer>
              </blockquote>
            )}
          </div>

          {/* RIGHT MONOLITH: Editorial Dossier, Pillars & Impact Narrative */}
          <div className="lg:col-span-7 space-y-10">

            {/* Oversized Hero Header */}
            <header className="space-y-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{member.role}</span>
                </span>
                {member.committee && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/35 text-purple-200 text-xs font-bold">
                    <Compass className="w-3.5 h-3.5 text-purple-300" />
                    <span>{member.committee}</span>
                  </span>
                )}
              </div>

              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.98] bg-gradient-to-r from-white via-purple-100 to-amber-200 bg-clip-text text-transparent">
                {member.name}
              </h1>

              <p className="font-serif italic text-xl sm:text-2xl text-slate-200 leading-relaxed max-w-2xl border-l-4 border-amber-400 pl-5">
                {member.bio}
              </p>
            </header>

            {/* Quick Facts Architectural Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block mb-1">Governance Seat</span>
                <p className="text-sm font-extrabold text-white">{member.role}</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block mb-1">Home Base</span>
                <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{member.city || 'Ventura County, CA'}</span>
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 block mb-1">Institution</span>
                <p className="text-sm font-extrabold text-white">501(c)(3) Public Charity</p>
              </div>
            </div>

            {/* In-Depth Narrative Section */}
            <div className="p-7 sm:p-9 rounded-3xl bg-white/[0.04] border border-white/12 backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-display text-2xl font-black text-white flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Leadership &amp; Community Impact</span>
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">DCVC Dossier</span>
              </div>

              <div className="space-y-4 text-base text-slate-200 leading-relaxed font-normal">
                {paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>

            {/* Strategic Focus Pillars */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Strategic Focus Pillars</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {focusAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gradient-to-r from-[#5A1E65]/40 to-white/[0.04] border border-purple-400/25 flex items-center gap-3.5 hover:border-amber-400/50 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-xs font-black flex items-center justify-center flex-shrink-0">
                      0{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-white">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Action Callout */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#5A1E65] via-purple-900 to-indigo-950 border border-purple-400/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Steward Our Mission Together</span>
                </span>
                <p className="font-display text-lg sm:text-xl font-black text-white">
                  Interested in joining a committee or supporting DCVC programs?
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 flex-shrink-0">
                <Link
                  to="/contact"
                  className="px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-lg"
                >
                  Connect with Leadership
                </Link>
                <Link
                  to="/donate"
                  className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-all"
                >
                  Support Our Sanctuary
                </Link>
              </div>
            </div>

            {/* Previous / Next Board Member Navigator */}
            {list.length > 1 && (
              <div className="pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to={`/board/${getBoardMemberSlug(prevMember)}`}
                  className="group p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/40 transition-all flex items-center gap-4"
                >
                  <img
                    src={prevMember.photo || prevMember.image || '/images/volunteers.jpg'}
                    alt={prevMember.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/20 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                      <span>Previous Steward</span>
                    </span>
                    <p className="font-display font-black text-base text-white truncate mt-0.5">{prevMember.name}</p>
                    <p className="text-[11px] text-purple-200/80 truncate">{prevMember.role}</p>
                  </div>
                </Link>

                <Link
                  to={`/board/${getBoardMemberSlug(nextMember)}`}
                  className="group p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-between gap-4 text-right"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 inline-flex items-center justify-end gap-1 w-full">
                      <span>Next Steward</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <p className="font-display font-black text-base text-white truncate mt-0.5">{nextMember.name}</p>
                    <p className="text-[11px] text-purple-200/80 truncate">{nextMember.role}</p>
                  </div>
                  <img
                    src={nextMember.photo || nextMember.image || '/images/volunteers.jpg'}
                    alt={nextMember.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/20 flex-shrink-0"
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

