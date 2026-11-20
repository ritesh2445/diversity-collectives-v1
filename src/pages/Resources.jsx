import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  ArrowUpRight, 
  LifeBuoy, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  PlusCircle,
  Star,
  Check,
  Lock
} from 'lucide-react';
import { resourcesDirectory } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import { useLiveOrgInfo } from '../hooks/useCmsLive';
import { getResourceCardTheme, subscribeToCardThemes } from '../services/cardThemeStore.js';
import SendVoicemailButton from '../components/SendVoicemailButton';
import CardSpotlight from '../components/CardSpotlight';
import MobileCarousel from '../components/MobileCarousel';

export default function Resources() {
  const liveOrg = useLiveOrgInfo();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dirGroups, setDirGroups] = useState(() => cmsStore.getResources() || resourcesDirectory);
  const [, setCardThemeVersion] = useState(0);

  useEffect(() => {
    return subscribeToCardThemes(() => {
      setCardThemeVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    return cmsStore.subscribe((data) => {
      if (Array.isArray(data?.resources) && data.resources.length > 0 && data.resources[0]?.items) {
        setDirGroups(data.resources);
      }
    });
  }, []);

  const categories = ['All', ...dirGroups.map((g) => g.category)];

  const filteredCategories = dirGroups.map(cat => {
    let items = cat.items;
    if (selectedCategory !== 'All' && cat.category !== selectedCategory) return null;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    }
    if (items.length === 0) return null;
    return { ...cat, items };
  }).filter(Boolean);

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">

      {/* Editorial Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            VERIFIED DIRECTORY &amp; COMMUNITY CARE
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Care &amp; Crisis <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Resource Directory.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            A vetted network of affirming mental health clinicians, healthcare navigators, legal clinics, and basic needs programs serving Ventura County.
          </p>
        </div>
      </section>

      {/* Immediate Crisis Support Ribbon */}
      <section className="bg-rose-50/80 border-b border-rose-200 py-6">
        <div className="container-clean flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-sm mt-0.5">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-800 block">
                In Immediate Crisis or Distress?
              </span>
              <p className="text-xs sm:text-sm text-slate-700 font-medium pt-0.5">
                Call or text <a href="tel:988" className="font-black text-rose-700 underline hover:text-rose-900">988</a> for the 24/7 Suicide &amp; Crisis Lifeline, or call The Trevor Project at <a href="tel:18664887386" className="font-black text-rose-700 underline hover:text-rose-900">1-866-488-7386</a>.
              </p>
            </div>
          </div>
          <a
            href="tel:988"
            className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs tracking-wider uppercase transition-colors shadow-sm flex-shrink-0 flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Dial 988 Now</span>
          </a>
        </div>
      </section>

      {/* Directory Controls: Search + Categories */}
      <section className="container-clean py-12">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resources by provider or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#5A1E65] focus:bg-white focus:ring-2 focus:ring-purple-100 outline-none transition-all font-medium"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border-2 ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white border-purple-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
            <p className="font-display text-xl font-bold text-slate-900">No resources found matching your filter.</p>
            <p className="text-xs text-slate-500">Try clearing your search query or selecting "All" categories.</p>
            <button onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} className="btn-primary py-2 px-5 text-xs font-bold mt-2">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {filteredCategories.map((catGroup) => (
              <div key={catGroup.category} className="space-y-6">

                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <h2 className="font-display text-2xl font-black text-slate-950">{catGroup.category}</h2>
                  <span className="text-xs font-black text-[#5A1E65] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {catGroup.items.length} Providers
                  </span>
                </div>

                <MobileCarousel cols={2} autoScrollMs={0} className="perspective-1000" cardClassName="h-full flex flex-col">
                  {catGroup.items.map((item) => {
                    const theme = getResourceCardTheme(catGroup.category, item);
                    const gradientBg = `linear-gradient(145deg, ${theme.gradientFrom} 0%, ${theme.gradientVia || theme.gradientFrom} 50%, ${theme.gradientTo} 100%)`;

                    return (
                      <CardSpotlight
                        key={item.name}
                        className="rounded-3xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between border"
                        style={{
                          background: gradientBg,
                          borderColor: `${theme.accentColor || '#38BDF8'}33`,
                          boxShadow: `0 14px 34px -10px ${theme.glowColor || 'rgba(0,0,0,0.4)'}`
                        }}
                        tilt={true}
                        maxTilt={2}
                        glare={false}
                      >
                        {/* Subtle top category glow accent line */}
                        <div
                          className="h-[2px] w-full"
                          style={{
                            background: `linear-gradient(90deg, transparent 0%, ${theme.accentColor || '#38BDF8'} 50%, transparent 100%)`
                          }}
                        />

                        <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between gap-4">
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md"
                              style={{
                                backgroundColor: `${theme.accentColor || '#38BDF8'}1f`,
                                color: theme.badgeColor || theme.accentColor || '#38BDF8',
                                border: `1px solid ${theme.accentColor || '#38BDF8'}40`
                              }}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{catGroup.category}</span>
                            </span>
                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.accentColor || '#38BDF8' }} />
                              <span>Verified Lifeline</span>
                            </span>
                          </div>

                          {/* Provider Title */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              AFFIRMING COMMUNITY RESOURCE
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                              {item.name}
                            </h3>
                          </div>

                          {/* Frosted Glass Description Container */}
                          <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.07] backdrop-blur-md border border-white/10 space-y-2">
                            <div
                              className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                              style={{ color: theme.accentColor || '#38BDF8' }}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>Confidential Health &amp; Peer Navigation</span>
                            </div>
                            <p className="text-sm sm:text-base text-slate-200 font-serif italic leading-relaxed">
                              &ldquo;{item.notes}&rdquo;
                            </p>
                          </div>

                          {/* Feature Checklist Bullets */}
                          <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentColor || '#38BDF8' }} />
                              <span>100% Free, confidential &amp; affirming community care</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentColor || '#38BDF8' }} />
                              <span>No insurance, ID, or referral required</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentColor || '#38BDF8' }} />
                              <span>Culturally competent trauma-informed support</span>
                            </div>
                          </div>

                          {/* Card Action Row */}
                          <div className="pt-5 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                            {item.phone ? (
                              (item.voicemailOnly || liveOrg.voicemailOnly) ? (
                                <SendVoicemailButton
                                  label="Send Voice Message"
                                  subject={`Resource Inquiry: ${item.name}`}
                                  compact
                                />
                              ) : (
                                <a
                                  href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Phone className="w-3.5 h-3.5" style={{ color: theme.accentColor || '#38BDF8' }} />
                                  <span>{item.phone}</span>
                                </a>
                              )
                            ) : (
                              <span className="text-slate-400 italic text-xs font-medium">Verified Online Portal</span>
                            )}

                            {item.url && (
                              <a
                                href={item.url}
                                target={item.url.startsWith('http') ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                                className="py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.98] shadow-md cursor-pointer"
                                style={{
                                  backgroundColor: theme.btnBg || theme.accentColor || '#2563EB',
                                  color: '#FFFFFF'
                                }}
                              >
                                <span className="font-bold text-white">Access Service Online</span>
                                <ArrowUpRight className="w-4 h-4 stroke-[2.5] text-white" />
                              </a>
                            )}
                          </div>

                          {/* Privacy footnote */}
                          <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1 pt-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Confidential Community Care • Diversity Collective Partner</span>
                          </div>
                        </div>
                      </CardSpotlight>
                    );
                  })}
                </MobileCarousel>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suggest a Resource Section */}
      <section className="container-clean pt-10">
        <div className="p-8 md:p-12 aurora-bg text-white rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-2.5 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>DIRECTORY COLLABORATION</span>
            </span>
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-white">
              Are you an LGBTQ+ affirming provider in Ventura County?
            </h3>
            <p className="text-xs md:text-sm text-purple-100 max-w-xl leading-relaxed">
              Let us know about your clinical or community services so we can connect our local community members to trusted, safe care.
            </p>
          </div>
          <Link
            to="/resources/submit"
            className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 !text-slate-950 font-black text-sm shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)] hover:scale-103 transition-all flex-shrink-0 cursor-pointer flex items-center gap-2 relative z-10"
          >
            <PlusCircle className="w-4 h-4 !text-slate-950 stroke-current" />
            <span className="!text-slate-950 font-black">Submit a Resource</span>
            <ArrowUpRight className="w-4 h-4 !text-slate-950 stroke-current" />
          </Link>
        </div>
      </section>

    </div>
  );
}
