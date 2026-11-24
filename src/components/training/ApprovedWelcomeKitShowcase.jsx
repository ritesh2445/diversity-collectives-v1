import React, { useState } from 'react';
import { 
  Package, 
  Store, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DcvcApprovedBadge from '../DcvcApprovedBadge';

const KIT_ITEMS = [
  {
    id: 'window-decal',
    title: 'Physical Storefront Window Decal Cling',
    category: 'Storefront Visibility',
    badge: 'Weatherproof UV Vinyl',
    image: '/images/crc-building.jpg',
    description: 'Heavy-duty 5" x 5" double-sided static-cling storefront decal reading "Proudly DCVC Approved Affirming Space". Visible from the street, signaling immediate safety to prospective patrons.',
    highlights: [
      'UV-fade resistant & weather-durable vinyl',
      'No adhesive residue (static-cling for glass doors & windows)',
      'Instantly recognized by Ventura County community members'
    ]
  },
  {
    id: 'framed-certificate',
    title: 'Official Framed Certificate of Affirmation',
    category: 'Accreditation Credential',
    badge: 'Executive Signed',
    image: '/images/community-gathering.jpg',
    description: 'Official 8.5" x 11" embossed parchment certificate signed by Diversity Collective Executive Leadership and Cultural Competency Directors, framed and ready for your reception counter.',
    highlights: [
      'Embossed gold foil DCVC seal',
      'Official verification number for consumer lookups',
      'Valid for 1 full calendar year with annual renewal'
    ]
  },
  {
    id: 'staff-pins',
    title: 'Frontline Pronoun & Ally Pin Pack',
    category: 'Team Inclusivity',
    badge: '10x Enamel Pin Set',
    image: '/images/volunteers.jpg',
    description: 'A starter kit of sleek metallic enamel pronoun pins (they/them, she/her, he/him, ask me my pronouns) and countertop customer etiquette guides for your cash wrap or reception desk.',
    highlights: [
      'Durable enamel pins for aprons, lanyards, and uniforms',
      'Laminated countertop quick-reference card for shift leads',
      'De-escalation tip card for unexpected customer situations'
    ]
  },
  {
    id: 'digital-badge',
    title: 'Digital Verified Seal & Web Embed Kit',
    category: 'Online & Digital Presence',
    badge: 'SVG, PNG & HTML Embed',
    image: '/images/accessibility-badge.png',
    description: 'High-resolution digital badge assets ready for your website footer, online menu, email signatures, Yelp profile, and Google Business Profile listing.',
    highlights: [
      'Vector SVG and transparent PNG formats',
      'Official "Verified DCVC Partner" trust seal',
      'Direct link verification to your live directory profile'
    ]
  },
  {
    id: 'directory-spotlight',
    title: 'Business Directory Platinum Profile',
    category: 'Community Discovery',
    badge: 'Live Hype & Rainbow Glow',
    image: '/images/youth-umbrella.jpg',
    description: 'Featured placement in the Ventura County LGBTQ+ Business Directory with exclusive Rainbow Edge Lighting, interactive 3D DCVC Approved Badge, operating hours, and 1-tap live Hype Meter!',
    highlights: [
      'Special Rainbow Edge Lighting around your business card',
      'Interactive 3D Gyroscope Approved Badge',
      'Live Hype score counter & 1-tap community hype support',
      'Interactive Ventura County Map pin & GPS directions'
    ]
  }
];

export default function ApprovedWelcomeKitShowcase({ content }) {
  const [activeTab, setActiveTab] = useState(KIT_ITEMS[0].id);
  const activeItem = KIT_ITEMS.find(item => item.id === activeTab) || KIT_ITEMS[0];

  return (
    <div className="w-full rounded-3xl bg-slate-900 text-white p-6 sm:p-12 shadow-2xl relative overflow-hidden border border-purple-500/30">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3 max-w-2xl">
            <span className="glass-pill text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-400/10 border-amber-400/30">
              <Package className="w-3.5 h-3.5" />
              {content?.welcomeKitEyebrow || 'TANGIBLE VALUE FOR YOUR STOREFRONT'}
            </span>
            <h3 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white !text-white">
              {content?.welcomeKitTitle ? (
                <span>{content.welcomeKitTitle}</span>
              ) : (
                <>
                  What's Inside the <br />
                  <span className="bg-gradient-to-r from-amber-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
                    DCVC Approved Welcome Kit?
                  </span>
                </>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {content?.welcomeKitSubtitle || 'Upon graduating from the accreditation workshop, every certified business receives our comprehensive physical and digital welcoming package shipped directly to their storefront.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <DcvcApprovedBadge />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {KIT_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-2.5 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                activeTab === item.id
                  ? 'bg-white text-slate-950 border-white shadow-lg scale-105'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Active Item Showcase Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
          {/* Left Column: Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {activeItem.category}
                </span>
                <span className="text-[10px] font-bold text-purple-200 bg-purple-400/20 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                  {activeItem.badge}
                </span>
              </div>
              <h4 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeItem.title}
              </h4>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {activeItem.description}
            </p>

            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Key Features Included:
              </span>
              <ul className="space-y-2">
                {activeItem.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {activeItem.id === 'directory-spotlight' && (
              <div className="pt-2 flex items-center gap-3">
                <Link
                  to="/directory"
                  className="btn-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <span>Preview Live Directory</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Visual Preview */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border-2 border-purple-400/40 shadow-2xl h-64 sm:h-80 bg-slate-950 flex items-center justify-center group">
            <img
              src={activeItem.image}
              alt={activeItem.title}
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
              {activeItem.id === 'directory-spotlight' ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="p-3 rounded-2xl bg-white/90 shadow-2xl">
                    <DcvcApprovedBadge />
                  </div>
                  <span className="text-xs font-black text-amber-300 uppercase tracking-widest bg-slate-900/80 px-3 py-1 rounded-full border border-amber-300/40">
                    Rainbow Edge Glow Enabled
                  </span>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5A1E65] to-emerald-500 flex items-center justify-center text-white shadow-xl">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white max-w-xs drop-shadow-md">
                    Included with DCVC Affirming Business Accreditation
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-purple-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Accredited businesses receive kit shipment within 5 business days of graduation.</span>
          </div>

          <Link
            to="/training/dcvc-affirming-business/book"
            className="training-cta-btn py-3 px-7 text-xs font-black tracking-wide rounded-full text-white !text-white bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 border border-purple-300/40 shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-102 shrink-0"
            style={{ color: '#FFFFFF' }}
          >
            <span className="text-white !text-white font-black" style={{ color: '#FFFFFF' }}>{content?.welcomeKitButtonText || 'Get Your Storefront Kit'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-white !text-white" style={{ color: '#FFFFFF' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
