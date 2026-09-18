import React, { useState } from 'react';
import { 
  MapPin, 
  ArrowUpRight, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Heart,
  Navigation,
  Sparkles,
  Building2,
  Users
} from 'lucide-react';
import { orgInfo } from '../data/dcvcData';
import CardSpotlight from './CardSpotlight';

export default function RegionalHubExplorer() {
  const [activeCity, setActiveCity] = useState('ventura');

  const hubs = [
    {
      id: 'ventura',
      name: 'Ventura (Flagship)',
      tagline: 'Primary Community Resource Center & Health Suite',
      badge: 'Headquarters & Drop-in Sanctuary',
      address: '2471 Portola Road, Suite 100, Ventura, CA 93003',
      hours: 'Mon – Fri: 1:00 PM – 5:00 PM',
      phone: '(805) 644-5428',
      accent: 'from-purple-600 to-indigo-600',
      glow: 'glow-amethyst',
      features: [
        'Physical LGBTQ+ Drop-in Lounge & Lending Library',
        'Confidential Clinical HIV & STI Testing Suite',
        'Weekly Rainbow Umbrella Youth Gatherings (Fridays)',
        'Free Computer, Wi-Fi & Document Printing Lab'
      ],
      mapsUrl: orgInfo.address.googleMapsUrl
    },
    {
      id: 'oxnard',
      name: 'Oxnard & South County',
      tagline: 'Mobile Health Screenings & Bilingual Peer Outreach',
      badge: 'Community Satellite Outreach',
      address: 'Rotating Community Venues & Healthcare Popups, Oxnard, CA',
      hours: 'Monthly Health Screening Popups & Youth Summits',
      phone: '(805) 644-5428',
      accent: 'from-emerald-600 to-teal-600',
      glow: 'glow-emerald',
      features: [
        'Status-Neutral Bilingual HIV/STI Screenings',
        'Latinx & Undocumented affirming resource navigation',
        'Youth Pride Prom satellite ticket distribution',
        'Harm reduction kit drop-offs with local clinics'
      ],
      mapsUrl: 'https://maps.google.com/?q=Oxnard,+CA'
    },
    {
      id: 'camarillo',
      name: 'Camarillo & University Hub',
      tagline: 'Collegiate Alliances & Regional Youth Leadership',
      badge: 'Campus & Regional Alliances',
      address: 'CSU Channel Islands & Regional Partner Spaces, Camarillo, CA',
      hours: 'Campus event schedules & monthly youth circles',
      phone: '(805) 644-5428',
      accent: 'from-amber-600 to-orange-500',
      glow: 'glow-amber',
      features: [
        'Partnership with CSU Channel Islands Queer Student Alliances',
        'Regional youth mentor meetups',
        'Volunteer orientation workshops for East/Central county',
        'Inclusive employer sensitivity training'
      ],
      mapsUrl: 'https://maps.google.com/?q=Camarillo,+CA'
    },
    {
      id: 'conejo',
      name: 'Thousand Oaks & Conejo',
      tagline: 'East County Advocacy & Family Affirmation',
      badge: 'Conejo Valley Outreach',
      address: 'Partner Libraries & Conejo Valley Community Centers',
      hours: 'Seasonal family gatherings & satellite clinics',
      phone: '(805) 644-5428',
      accent: 'from-indigo-600 to-sky-600',
      glow: 'glow-indigo',
      features: [
        'Conejo Valley Pride collaboration & festival presence',
        'Parent & pre-teen support circles',
        'Local school district safe space advocacy',
        'East County healthcare referrals and PrEP navigation'
      ],
      mapsUrl: 'https://maps.google.com/?q=Thousand+Oaks,+CA'
    },
    {
      id: 'simi',
      name: 'Simi Valley & Moorpark',
      tagline: 'Community Advocacy & Safe Harbor Outreach',
      badge: 'East County Alliance',
      address: 'Simi Valley / Moorpark Community Venues',
      hours: 'Periodic peer support circles & community events',
      phone: '(805) 644-5428',
      accent: 'from-purple-700 to-pink-600',
      glow: 'glow-amethyst',
      features: [
        'Simi Valley LGBTQ+ visibility and pride alliances',
        'Confidential peer intake consultations by appointment',
        'Youth transportation subsidies for Ventura CRC events',
        'Crisis hotline & local housing referral linkages'
      ],
      mapsUrl: 'https://maps.google.com/?q=Simi+Valley,+CA'
    },
    {
      id: 'ojai',
      name: 'Ojai Valley & Inland',
      tagline: 'Artistic Fellowships & Intergenerational Circles',
      badge: 'Ojai Arts & Cultural Hub',
      address: 'Ojai Community Partner Venues, Ojai, CA',
      hours: 'Special cultural gatherings & film screenings',
      phone: '(805) 644-5428',
      accent: 'from-teal-600 to-emerald-600',
      glow: 'glow-teal',
      features: [
        'Intergenerational storytelling and senior community support',
        'Queer arts & poetry gatherings in the valley',
        'LGBTQ+ environmental & wellness days',
        'Mobile safer-sex supply distributions'
      ],
      mapsUrl: 'https://maps.google.com/?q=Ojai,+CA'
    }
  ];

  const currentHub = hubs.find(h => h.id === activeCity) || hubs[0];

  return (
    <div className="flex flex-col gap-8 perspective-1000">
      
      {/* City Selector Pills with 3D Depth */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {hubs.map((hub) => {
          const isSelected = activeCity === hub.id;
          return (
            <button
              key={hub.id}
              onClick={() => setActiveCity(hub.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer border-2 interactive-card-3d ${
                isSelected
                  ? 'bg-slate-950 text-white border-purple-500 shadow-xl glow-amethyst scale-[1.04]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
              }`}
            >
              <span>{hub.name}</span>
            </button>
          );
        })}
      </div>

      {/* Hub Detail Showcase with 3D CardSpotlight */}
      <CardSpotlight 
        className="glass-card rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border-2 border-purple-200/80 transition-all duration-300 relative overflow-hidden"
        tilt={true}
        maxTilt={6}
        glare={true}
      >
        {/* Ambient Glow */}
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="glass-pill text-xs font-black px-3.5 py-1 text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
                {currentHub.badge}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active Sanctuary
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
              {currentHub.name}
            </h3>

            <p className="text-sm md:text-base text-slate-600 italic font-serif leading-relaxed">
              "{currentHub.tagline}"
            </p>

            {/* Hub Key Info */}
            <div className="flex flex-col gap-3 pt-3 text-xs sm:text-sm text-slate-600 border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#5A1E65] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Sanctuary Address:</span>
                  <span className="text-slate-600 font-medium">{currentHub.address}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#5A1E65] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Hours & Availability:</span>
                  <span className="text-slate-600 font-medium">{currentHub.hours}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#5A1E65] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Community Helpline:</span>
                  <a href={`tel:${currentHub.phone}`} className="text-[#5A1E65] font-bold hover:underline">
                    {currentHub.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={currentHub.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs py-3 px-6 inline-flex items-center gap-2 shadow-md hover:shadow-xl"
              >
                <span>Navigate to This Sanctuary</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Features Column in 3D Card Style */}
          <div className="lg:col-span-5 p-6 md:p-8 bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-2xl border-2 border-purple-100 shadow-sm flex flex-col gap-4 translate-z-10">
            <span className="text-xs font-black uppercase tracking-wider text-[#5A1E65] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#5A1E65]" />
              <span>Affirming Services in {currentHub.name.split(' ')[0]}</span>
            </span>
            <ul className="flex flex-col gap-3">
              {currentHub.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#5A1E65] mt-1.5 flex-shrink-0 shadow-xs" />
                  <span className="font-medium">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </CardSpotlight>

    </div>
  );
}
