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

const PILLAR_THEMES = [
  {
    card: 'bg-gradient-to-br from-purple-50/95 via-white to-fuchsia-50/85 border-purple-200/90 hover:border-purple-400',
    badge: 'bg-gradient-to-br from-[#5A1E65] to-fuchsia-600 text-white shadow-sm shadow-purple-500/20',
    label: 'text-[#5A1E65]'
  },
  {
    card: 'bg-gradient-to-br from-teal-50/95 via-white to-emerald-50/85 border-teal-200/90 hover:border-teal-400',
    badge: 'bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-sm shadow-teal-500/20',
    label: 'text-teal-800'
  },
  {
    card: 'bg-gradient-to-br from-amber-50/95 via-white to-orange-50/85 border-amber-200/90 hover:border-amber-400',
    badge: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20',
    label: 'text-amber-900'
  },
  {
    card: 'bg-gradient-to-br from-rose-50/95 via-white to-pink-50/85 border-rose-200/90 hover:border-rose-400',
    badge: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20',
    label: 'text-rose-800'
  }
];

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

  const nameParts = String(member.name || '').trim().split(/\s+/);
  const firstNames = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : member.name;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  return (
    <div className="relative min-h-[100svh] w-full bg-[#FAF7F2] text-slate-950 overflow-hidden">
      {/* Top Signature Multi-Spectrum Pride Accent Strip */}
      <div
        className="h-1 w-full bg-gradient-to-r from-[#5A1E65] via-rose-500 via-amber-400 via-emerald-500 to-indigo-600"
        aria-hidden="true"
      />

      {/* Full-Bleed Radiant Aurora Background Atmosphere (Matches Home Hero Theme) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-28 -left-24 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-purple-500/18 via-fuchsia-500/12 to-transparent blur-3xl" />
        <div className="absolute -top-20 -right-24 w-[38rem] h-[38rem] rounded-full bg-gradient-to-bl from-amber-400/24 via-rose-400/20 to-purple-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-teal-400/18 via-sky-400/14 to-transparent blur-3xl" />

        <svg className="w-full h-full min-h-[680px] opacity-60" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bio-aurora-stream" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.24" />
              <stop offset="30%" stopColor="#FB7185" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#D946EF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <path
            d="M 1440,0 C 1180,90 980,260 880,470 C 780,680 560,810 220,870 L 0,900 L 1440,900 Z"
            fill="url(#bio-aurora-stream)"
          />
        </svg>
      </div>

      {/* Full-Width Glass Navigation & Board Switcher Bar */}
      <div className="relative z-20 border-b border-purple-200/75 bg-white/85 backdrop-blur-md">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2">
              <Link
                to="/board-and-staff"
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white hover:bg-purple-50 border border-purple-200/90 hover:border-purple-400 text-xs font-extrabold tracking-wide text-slate-900 hover:text-[#5A1E65] transition-all shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#5A1E65]" />
                <span>Board &amp; Staff Directory</span>
              </Link>
              <Link
                to="/about"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-slate-700 hover:text-[#5A1E65] hover:bg-purple-50/70 transition-all"
              >
                <span>About DCVC</span>
              </Link>
            </div>

            <span className="md:hidden px-2.5 py-1 rounded-full bg-purple-100/90 text-[#5A1E65] font-mono text-[11px] font-extrabold">
              {ordinal} / {totalCount}
            </span>
          </div>

          {/* Responsive Roster Switcher Pills */}
          <nav
            aria-label="Switch board member profile"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-0.5 md:pb-0"
          >
            {list.map((b, i) => {
              const s = getBoardMemberSlug(b);
              const isActive = i === resolvedIndex;
              return (
                <Link
                  key={s}
                  to={`/board/${s}`}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#5A1E65] via-rose-600 to-indigo-700 !text-white text-white border-transparent shadow-md shadow-purple-500/20'
                      : 'bg-white/90 text-slate-800 border-purple-200/80 hover:border-purple-400 hover:text-[#5A1E65] hover:bg-purple-50/80'
                  }`}
                >
                  {b.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Full-Screen Edge-to-Edge Balanced Showcase */}
      <section className="relative z-10 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 pt-6 pb-12 sm:pt-8 sm:pb-16 lg:py-10 space-y-6 lg:space-y-8">

        {/* BAND 1: Balanced Equal-Height Hero Split (Zero Dead Space Below Portrait) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-stretch">

          {/* LEFT COLUMN: Exact-Fit Portrait Card (No Cropping & No Frame Gap) + Quote Card */}
          <aside className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
            <div className="relative group rounded-[1.85rem] p-[3px] bg-gradient-to-br from-[#5A1E65] via-rose-500 via-amber-400 to-teal-500 shadow-xl shadow-purple-950/15">
              <div className="bg-white rounded-[1.7rem] overflow-hidden flex flex-col">
                <div className="relative w-full overflow-hidden bg-gradient-to-br from-purple-50 via-rose-50/40 to-amber-50/40">
                  <img
                    src={portraitUrl}
                    alt={member.name}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    className="transition-transform duration-700 group-hover:scale-[1.02]"
                    onError={(e) => { e.target.src = '/images/volunteers.jpg'; }}
                  />
                </div>

                {/* Snug Below-Image Identity Bar */}
                <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-gradient-to-r from-[#FAF7F2] via-white to-purple-50/80 border-t border-purple-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#5A1E65] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                      <span className="truncate">{member.city || 'Ventura County, CA'}</span>
                    </p>
                    <p className="font-display text-base sm:text-lg font-black text-slate-950 truncate mt-0.5">
                      {member.name}
                      {member.pronouns ? (
                        <span className="ml-2 text-xs font-bold text-slate-600">({member.pronouns})</span>
                      ) : null}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#5A1E65] to-indigo-700 font-mono text-xs font-extrabold text-white shadow-xs flex-shrink-0">
                    {ordinal} / {totalCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Editorial Pull Quote Card (Stretches cleanly to align Left & Right columns) */}
            <blockquote className="flex-1 relative p-5 sm:p-6 rounded-[1.6rem] bg-gradient-to-br from-white/95 via-purple-50/80 to-rose-50/75 backdrop-blur-md border border-purple-200/85 shadow-md shadow-purple-950/5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#5A1E65] via-rose-500 to-amber-500 text-white shadow-sm">
                  <Quote className="w-4 h-4" />
                </span>
                <p className="font-serif italic text-base sm:text-[1.15rem] leading-relaxed text-slate-900 font-normal">
                  &ldquo;{member.quote || member.bio}&rdquo;
                </p>
              </div>
              <footer className="pt-3 border-t border-purple-200/70 flex items-center justify-between gap-2 text-xs">
                <span className="font-extrabold text-slate-950">&mdash; {member.name}</span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[#5A1E65] via-rose-600 to-indigo-700 bg-clip-text text-transparent">
                  DCVC Leadership
                </span>
              </footer>
            </blockquote>
          </aside>

          {/* RIGHT COLUMN: Gradient Identity Header + Snapshot Strip + Narrative Card */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between gap-5 lg:gap-6">

            {/* Executive Header Card */}
            <header className="p-5 sm:p-7 xl:p-8 rounded-[1.85rem] bg-white/90 backdrop-blur-md border border-purple-200/80 shadow-lg shadow-purple-950/5 space-y-5 relative overflow-hidden">
              <div
                className="h-1.5 w-28 rounded-full bg-gradient-to-r from-[#5A1E65] via-rose-500 via-amber-400 to-teal-500"
                aria-hidden="true"
              />

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#5A1E65] via-rose-600 to-indigo-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{member.role}</span>
                </span>
                {member.tenure && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 text-amber-950 text-xs font-bold">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{member.tenure}</span>
                  </span>
                )}
                {member.committee && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-300/80 text-teal-950 text-xs font-bold">
                    <Compass className="w-3.5 h-3.5 text-teal-700" />
                    <span>{member.committee}</span>
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-5xl xl:text-6xl font-black tracking-tight text-slate-950 leading-[1.06]">
                {firstNames}{' '}
                {lastName && (
                  <span className="bg-gradient-to-r from-[#5A1E65] via-rose-600 to-indigo-700 bg-clip-text text-transparent">
                    {lastName}
                  </span>
                )}
              </h1>

              <div className="relative pl-4 sm:pl-5">
                <div
                  className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-gradient-to-b from-[#5A1E65] via-rose-500 to-amber-500"
                  aria-hidden="true"
                />
                <p className="font-serif italic text-lg sm:text-xl xl:text-[1.35rem] text-slate-800 leading-[1.6]">
                  {member.bio}
                </p>
              </div>
            </header>

            {/* Colorful 3-Column Governance Facts Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/75 border border-purple-200/85 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5A1E65] block mb-1">
                  Governance Seat
                </span>
                <p className="text-sm sm:text-[15px] font-extrabold text-slate-950 leading-snug">{member.role}</p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/75 border border-teal-200/85 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-800 block mb-1">
                  Home Base
                </span>
                <p className="text-sm sm:text-[15px] font-extrabold text-slate-950 flex items-center gap-1.5 leading-snug">
                  <MapPin className="w-4 h-4 text-teal-700 flex-shrink-0" />
                  <span>{member.city || 'Ventura County, CA'}</span>
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-rose-50/75 border border-amber-200/85 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 block mb-1">
                  Institution
                </span>
                <p className="text-sm sm:text-[15px] font-extrabold text-slate-950 leading-snug">
                  501(c)(3) Public Charity
                </p>
              </div>
            </div>

            {/* Leadership & Community Impact Narrative Card */}
            <article className="flex-1 p-5 sm:p-7 xl:p-8 rounded-[1.85rem] bg-white/90 backdrop-blur-md border border-purple-200/80 shadow-lg shadow-purple-950/5 space-y-4 flex flex-col justify-center">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
                <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5A1E65] via-rose-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Users className="w-4 h-4" />
                  </span>
                  <span>Leadership &amp; Community Impact</span>
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#5A1E65]">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  <span>Executive Biography</span>
                </span>
              </div>

              <div className="space-y-4 text-[15.5px] sm:text-[16.5px] text-slate-800 leading-[1.78] font-normal">
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="text-slate-800">{p}</p>
                ))}
              </div>
            </article>
          </div>
        </div>

        {/* BAND 2: Full-Width Strategic Focus Pillars */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-[#5A1E65] via-rose-600 to-indigo-700 bg-clip-text text-transparent">
              Strategic Focus Pillars
            </h3>
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">
              Board Governance &amp; Community Stewardship
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {focusAreas.map((area, idx) => {
              const theme = PILLAR_THEMES[idx % PILLAR_THEMES.length];
              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 flex items-center gap-3.5 ${theme.card}`}
                >
                  <span className={`w-9 h-9 rounded-xl font-mono text-xs font-black flex items-center justify-center flex-shrink-0 ${theme.badge}`}>
                    0{idx + 1}
                  </span>
                  <span className="text-sm font-extrabold text-slate-950 leading-snug">{area}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BAND 3: Radiant Mission Callout Banner + Previous/Next Steward Bar */}
        <div className="p-5 sm:p-7 rounded-[1.85rem] bg-gradient-to-r from-purple-50/95 via-rose-50/85 to-amber-50/90 border border-purple-200/90 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#5A1E65] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-600" />
              <span>Steward Our Mission Together</span>
            </span>
            <p className="font-display text-lg sm:text-xl font-black text-slate-950">
              Interested in joining a committee or supporting Diversity Collective programs?
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0 w-full md:w-auto">
            <Link
              to="/contact"
              className="flex-1 sm:flex-initial text-center px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5A1E65] via-rose-600 to-indigo-700 hover:brightness-110 !text-white text-white text-xs font-extrabold transition-all shadow-md shadow-purple-500/20"
            >
              Connect with Leadership
            </Link>
            <Link
              to="/donate"
              className="flex-1 sm:flex-initial text-center px-5 py-2.5 rounded-full bg-white hover:bg-purple-50 border border-purple-300 text-[#5A1E65] text-xs font-extrabold transition-all shadow-2xs"
            >
              Support Our Sanctuary
            </Link>
          </div>
        </div>

        {list.length > 1 && (
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to={`/board/${getBoardMemberSlug(prevMember)}`}
              className="group p-4 rounded-2xl bg-white/90 hover:bg-gradient-to-r hover:from-purple-50 hover:to-white border border-purple-200/85 hover:border-purple-400 transition-all flex items-center gap-4 shadow-xs"
            >
              <img
                src={prevMember.photo || prevMember.image || '/images/volunteers.jpg'}
                alt={prevMember.name}
                style={{ width: '60px', height: '60px', objectFit: 'cover', objectPosition: '50% 18%' }}
                className="rounded-2xl border border-purple-200 flex-shrink-0"
                onError={(e) => { e.target.src = '/images/volunteers.jpg'; }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-[#5A1E65] flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                  <span>Previous Steward</span>
                </span>
                <p className="font-display font-black text-base text-slate-950 truncate mt-0.5">{prevMember.name}</p>
                <p className="text-[11px] font-bold text-[#5A1E65] truncate">{prevMember.role}</p>
              </div>
            </Link>

            <Link
              to={`/board/${getBoardMemberSlug(nextMember)}`}
              className="group p-4 rounded-2xl bg-white/90 hover:bg-gradient-to-l hover:from-rose-50/70 hover:to-white border border-purple-200/85 hover:border-purple-400 transition-all flex items-center justify-between gap-4 text-right shadow-xs"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-rose-600 inline-flex items-center justify-end gap-1 w-full transition-colors">
                  <span>Next Steward</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
                <p className="font-display font-black text-base text-slate-950 truncate mt-0.5">{nextMember.name}</p>
                <p className="text-[11px] font-bold text-rose-700 truncate">{nextMember.role}</p>
              </div>
              <img
                src={nextMember.photo || nextMember.image || '/images/volunteers.jpg'}
                alt={nextMember.name}
                style={{ width: '60px', height: '60px', objectFit: 'cover', objectPosition: '50% 18%' }}
                className="rounded-2xl border border-purple-200 flex-shrink-0"
                onError={(e) => { e.target.src = '/images/volunteers.jpg'; }}
              />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
