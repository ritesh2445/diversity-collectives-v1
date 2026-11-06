import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle2,
  Calendar,
  Share2
} from 'lucide-react';
import { businessDirectorySeed } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

export default function DirectoryProfile() {
  const { slug } = useParams();
  const business = businessDirectorySeed.find(b => b.slug === slug);

  usePageMeta({
    title: business ? `${business.name} — Affirming Business Directory` : 'Business Profile',
    description: business ? business.description : 'LGBTQ+ Affirming Business Profile in Ventura County.',
    canonicalPath: business ? `/directory/${business.slug}` : '/directory',
    ogImage: business?.image
  });

  if (!business) {
    return <Navigate to="/directory" replace />;
  }

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Back button */}
      <div className="container-clean mb-6">
        <Link 
          to="/directory" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Business Directory</span>
        </Link>
      </div>

      <article className="container-clean">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
                  {business.category}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{business.city}, CA</span>
                </span>
                {business.isLGBTQOwned && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    🌈 LGBTQ+ Owned Enterprise
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-[1.08]">
                {business.name}
              </h1>
            </div>

            {/* Profile Hero Photo */}
            <div className="rounded-3xl overflow-hidden aspect-[16/9] shadow-xl border-2 border-slate-200">
              <img
                src={business.image || "/images/community-gathering.jpg"}
                alt={business.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "/images/community-gathering.jpg"; }}
              />
            </div>

            {/* Business Description */}
            <div className="space-y-4 text-base text-slate-600 leading-relaxed font-medium">
              <h2 className="font-display text-2xl font-black text-slate-950">
                About {business.name}
              </h2>
              <p>{business.description}</p>
            </div>

            {/* Affirming Standards Checklist */}
            <div className="p-6 rounded-3xl bg-emerald-50/70 border-2 border-emerald-200 space-y-4">
              <div className="flex items-center gap-2 text-emerald-950 font-display font-black text-lg">
                <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <span>Diversity Collective Affirming Pledge</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                This business has formally pledged adherence to Ventura County non-discrimination standards:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-emerald-900 font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Zero-tolerance for discrimination</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>All-gender welcoming environment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Respect for customer pronouns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Support for LGBTQ+ community wellbeing</span>
                </li>
              </ul>
            </div>

            {/* Tags */}
            {business.tags && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Tags & Amenities:</span>
                <div className="flex flex-wrap gap-2">
                  {business.tags.map((tag) => (
                    <span key={tag} className="text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logistics & Contact Card */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="p-8 rounded-3xl bg-white border-2 border-purple-200 shadow-xl space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  LOCATION & CONTACT
                </span>
                <h3 className="font-display text-xl font-black text-slate-950">
                  Connect Directly
                </h3>
              </div>

              <div className="space-y-4 text-xs font-medium">
                {business.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Address</span>
                      <span className="text-slate-600">{business.address}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5A1E65] font-bold hover:underline block pt-1 flex items-center gap-1"
                      >
                        <span>Directions on Google Maps</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-[#5A1E65] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Telephone</span>
                      <a href={`tel:${business.phone}`} className="text-slate-600 hover:text-[#5A1E65]">
                        {business.phone}
                      </a>
                    </div>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#5A1E65] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Email</span>
                      <a href={`mailto:${business.email}`} className="text-slate-600 hover:text-[#5A1E65]">
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                {business.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Website</span>
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#5A1E65] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Visit Website</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {business.website && (
                <div className="pt-2">
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full py-3.5 text-center text-xs font-bold inline-flex items-center justify-center gap-2 shadow-md hover:shadow-xl"
                  >
                    <span>Visit Business Website</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Verified in Ventura County</span>
                <Link to="/contact" className="hover:underline">Report an Update</Link>
              </div>
            </div>
          </div>

        </div>
      </article>

    </div>
  );
}

