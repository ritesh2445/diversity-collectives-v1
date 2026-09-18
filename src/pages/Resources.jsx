import React, { useState } from 'react';
import { 
  Phone, 
  ArrowUpRight, 
  LifeBuoy, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Heart,
  Mail,
  PlusCircle
} from 'lucide-react';
import { resourcesDirectory, orgInfo } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function Resources() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Crisis & Immediate Helplines', 'Health & Sexual Wellness', 'Youth & Family Support', 'Senior & Community Resources'];

  const filteredCategories = resourcesDirectory.map(cat => {
    let items = cat.items;
    
    if (selectedCategory !== 'All' && cat.category !== selectedCategory) {
      return null;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.notes.toLowerCase().includes(q)
      );
    }

    if (items.length === 0) return null;

    return {
      ...cat,
      items
    };
  }).filter(Boolean);

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
            VERIFIED DIRECTORY & COMMUNITY CARE
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Care & Crisis <br />
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
                Call or text <a href="tel:988" className="font-black text-rose-700 underline hover:text-rose-900">988</a> for the 24/7 Suicide & Crisis Lifeline, or call The Trevor Project at <a href="tel:18664887386" className="font-black text-rose-700 underline hover:text-rose-900">1-866-488-7386</a>.
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
                className={`px-3.5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border-2 interactive-card-3d ${
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

        {/* Directory Results */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
            <p className="font-display text-xl font-bold text-slate-900">No resources found matching your filter.</p>
            <p className="text-xs text-slate-500">Try clearing your search query or selecting "All" categories.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="btn-primary py-2 px-5 text-xs font-bold mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {filteredCategories.map((catGroup) => (
              <div key={catGroup.category} className="space-y-6">
                
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <h2 className="font-display text-2xl font-black text-slate-950">
                    {catGroup.category}
                  </h2>
                  <span className="text-xs font-black text-[#5A1E65] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {catGroup.items.length} Providers
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 perspective-1000">
                  {catGroup.items.map((item) => (
                    <CardSpotlight 
                      key={item.name}
                      className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-slate-200/90 hover:border-[#5A1E65]/80 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between interactive-card-3d"
                      tilt={true}
                      maxTilt={5}
                      glare={true}
                    >
                      <div className="space-y-2.5 mb-4">
                        <h3 className="font-display text-xl font-bold text-slate-950">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                          {item.notes}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        {item.phone ? (
                          <a
                            href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 font-bold text-[#5A1E65] hover:underline bg-purple-50/80 px-3 py-1.5 rounded-full border border-purple-200"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{item.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic font-medium">Verified Online Portal</span>
                        )}

                        {item.url && (
                          <a
                            href={item.url}
                            target={item.url.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                          >
                            <span>Access Service</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </CardSpotlight>
                  ))}
                </div>

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
          <a
            href={`mailto:${orgInfo.email}?subject=Resource%20Directory%20Addition%20Inquiry`}
            className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-sm shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)] hover:scale-103 transition-all flex-shrink-0 cursor-pointer flex items-center gap-2 relative z-10"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>Submit a Resource</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

    </div>
  );
}
