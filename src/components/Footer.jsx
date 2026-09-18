import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { orgInfo, sponsorsList } from '../data/dcvcData';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-20 md:pt-28 pb-16 border-t border-slate-800 relative">
      <div className="container-clean">
        
        {/* Top Editorial Row: Supported By */}
        <div className="pb-16 border-b border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex flex-col gap-2 max-w-md">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                COMMUNITY ALLIANCES & PARTNERS
              </span>
              <p className="text-sm text-slate-400 leading-relaxed">
                Honoring the local public health agencies and sponsors who help fund our health, safety, and community outreach.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 md:gap-8">
              {sponsorsList.map((sponsor) => (
                <a
                  key={sponsor.shortName}
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 transition-colors"
                  title={sponsor.name}
                >
                  <div className="w-28 h-12 md:w-32 md:h-14 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden border border-slate-700 shadow-sm flex-shrink-0">
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-slate-800">${sponsor.shortName}</span>`;
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {sponsor.shortName}
                      <ArrowUpRight className="w-3 h-3 text-slate-500" />
                    </span>
                    <span className="text-[11px] text-slate-400">{sponsor.role}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Main Footer Architectural Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 py-16 border-b border-slate-800">
          
          {/* Col 1: Typographic Branding */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                ESTABLISHED 2014 · VENTURA COUNTY
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Diversity Collective <br className="hidden sm:block" />
                <span className="font-serif italic font-normal text-slate-400">Ventura County</span>
              </h2>
              <p className="text-sm md:text-base text-slate-400 max-w-lg leading-relaxed pt-1">
                {orgInfo.mission} A safe, vibrant, and affirming cultural sanctuary for every intersecting LGBTQ+ identity across our coastal and inland communities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={orgInfo.donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-2.5 px-6 text-xs font-bold tracking-wider inline-flex items-center gap-2"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Support Our Mission</span>
              </a>
              <Link
                to="/get-involved"
                className="px-6 py-2.5 rounded-full border border-slate-700 hover:bg-slate-900 text-white text-xs font-bold tracking-wider transition-colors"
              >
                Volunteer Pathways
              </Link>
            </div>
          </div>

          {/* Col 2: Physical CRC Anchor & Contact */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Community Resource Center
              </span>
              <address className="not-italic text-sm text-slate-300 flex flex-col gap-2 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Suite 100</p>
                    <p>2471 Portola Road</p>
                    <p>Ventura, CA 93003</p>
                  </div>
                </div>
                <div className="pt-2">
                  <a 
                    href={orgInfo.address.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    <span>Open in Google Maps</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </address>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <a href={`tel:${orgInfo.phoneRaw}`} className="text-slate-300 hover:text-white transition-colors">
                  {orgInfo.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <a href={`mailto:${orgInfo.email}`} className="text-slate-300 hover:text-white transition-colors">
                  {orgInfo.email}
                </a>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-500 block mb-1">Center Drop-in Hours:</span>
              <p className="text-xs text-slate-300 font-medium">{orgInfo.hours}</p>
            </div>
          </div>

          {/* Col 3: Navigation Architecture & Socials */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Index & Programs
              </span>
              <ul className="flex flex-col gap-2 text-sm">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Diversity Collective</Link></li>
                <li><Link to="/programs/community-resource-center" className="text-slate-400 hover:text-white transition-colors">Community Resource Center</Link></li>
                <li><Link to="/programs/rainbow-umbrella" className="text-slate-400 hover:text-white transition-colors">Rainbow Umbrella (Youth 13–23)</Link></li>
                <li><Link to="/programs/little-unicorns" className="text-slate-400 hover:text-white transition-colors">Little Unicorns (Ages 9–13)</Link></li>
                <li><Link to="/programs/diversity-shines" className="text-slate-400 hover:text-white transition-colors">Diversity SHINES & Screenings</Link></li>
                <li><Link to="/community" className="text-slate-400 hover:text-white transition-colors">Community Groups & Meetings</Link></li>
                <li><Link to="/events" className="text-slate-400 hover:text-white transition-colors">Cultural Calendar & Events</Link></li>
                <li><Link to="/resources" className="text-slate-400 hover:text-white transition-colors">Support & Crisis Resources</Link></li>
                <li><Link to="/get-involved" className="text-slate-400 hover:text-white transition-colors">Sponsor, Volunteer & Donate</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact & Visit Us</Link></li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-500 block mb-2">Connect with DCVC:</span>
              <div className="flex items-center gap-3">
                <a 
                  href={orgInfo.socials.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  Instagram <ArrowUpRight className="w-2.5 h-2.5" />
                </a>
                <span className="text-slate-600">·</span>
                <a 
                  href={orgInfo.socials.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  Facebook <ArrowUpRight className="w-2.5 h-2.5" />
                </a>
                <span className="text-slate-600">·</span>
                <a 
                  href={orgInfo.socials.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  YouTube <ArrowUpRight className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Nonprofit Disclosures */}
        <div className="pt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex flex-col gap-1">
            <p>
              Diversity Collective Ventura County is a California 501(c)(3) nonprofit public benefit corporation.
            </p>
            <p>
              Federal EIN: <span className="font-mono text-slate-400">{orgInfo.ein}</span> · CA Corp Number: <span className="font-mono text-slate-400">{orgInfo.caCorpNumber}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('replayWelcomeAnimation'))}
              className="hover:text-amber-300 transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-slate-400"
              title="Replay vibrant color entrance animation"
            >
              <span>🌈 Replay Welcome</span>
            </button>
            <span>·</span>
            <a 
              href="https://www.diversitycollectivevc.org/accessibility-statement/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Accessibility (WCAG 2.1 AA)
            </a>
            <span>·</span>
            <a 
              href="https://www.diversitycollectivevc.org/privacy-policy/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </a>
            <span>·</span>
            <a 
              href="https://www.diversitycollectivevc.org/terms-and-conditions/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-slate-300 transition-colors"
            >
              Terms & Conditions
            </a>
            <span>·</span>
            <span>© {new Date().getFullYear()} DCVC. All Rights Reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
