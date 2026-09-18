import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Mail, 
  Calendar as CalendarIcon, 
  Ticket, 
  ArrowUpRight, 
  Share2, 
  ShieldCheck,
  Check,
  Heart
} from 'lucide-react';
import { liveEvents, orgInfo } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function EventDetail() {
  const { slug } = useParams();
  const event = liveEvents.find(e => e.slug === slug);
  const [copied, setCopied] = useState(false);

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-white text-slate-800">
      
      {/* Back button */}
      <div className="container-clean mb-6 flex items-center justify-between">
        <Link 
          to="/events" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cultural Calendar</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#5A1E65] py-1.5 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied!' : 'Share Gathering'}</span>
        </button>
      </div>

      {/* Main Event Article */}
      <article className="container-clean">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start pb-16 border-b border-slate-100">
          
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
                  {event.category}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {event.month} {event.day}, {event.year}
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 leading-[1.08]">
                {event.title}
              </h1>
            </div>

            {/* Image Banner if available in 3D Card */}
            {event.image && (
              <div className="rounded-3xl overflow-hidden aspect-[16/9] shadow-xl border-2 border-slate-200">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/images/community-gathering.jpg";
                  }}
                />
              </div>
            )}

            {/* Description Body */}
            <div className="space-y-4 text-base text-slate-600 leading-relaxed font-medium">
              <h2 className="font-display text-2xl font-black text-slate-950">
                About This Gathering
              </h2>
              <p>
                {event.description}
              </p>
              <p>
                Diversity Collective Ventura County programs are grounded in cultural affirmation, trauma-informed care, and welcoming community spaces. All participants are respected regardless of identity or expression.
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-6 flex flex-wrap items-center gap-4">
              {event.registrationUrl ? (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary py-3.5 px-7 text-sm font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Ticket className="w-4 h-4 text-amber-300" />
                  <span>Official Registration / RSVP</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              ) : (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Free Drop-in Event. No advance ticket required. All are welcome.</span>
                </div>
              )}

              <a
                href={`mailto:${event.contactEmail || orgInfo.email}?subject=Inquiry%20about%20${encodeURIComponent(event.title)}`}
                className="btn-secondary py-3.5 px-6 text-sm font-bold inline-flex items-center gap-2 bg-white"
              >
                <Mail className="w-4 h-4 text-purple-600" />
                <span>Contact Organizer</span>
              </a>
            </div>
          </div>

          {/* Sidebar Logistics Card in 3D CardSpotlight */}
          <div className="lg:col-span-4 sticky top-28 perspective-1000">
            <CardSpotlight
              className="bg-slate-50/90 p-8 rounded-3xl border-2 border-slate-200 shadow-xl space-y-6 interactive-card-3d"
              tilt={true}
              maxTilt={5}
              glare={true}
            >
              
              {/* Date Box */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                <div className="flex flex-col items-center justify-center min-w-[76px] p-3 rounded-2xl bg-gradient-to-b from-[#5A1E65] to-purple-900 text-white shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">{event.month}</span>
                  <span className="font-display text-2xl font-black">{event.day}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">DATE & TIME</span>
                  <p className="font-black text-slate-900 text-sm sm:text-base">{event.month} {event.day}, {event.year}</p>
                  <p className="text-xs text-slate-600 font-medium">{event.time}</p>
                </div>
              </div>

              {/* Location Box */}
              <div className="space-y-2 pb-6 border-b border-slate-200">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">LOCATION</span>
                <p className="font-bold text-slate-900 text-sm">{event.location}</p>
                <p className="text-xs text-slate-600 font-medium">{event.address}</p>
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A1E65] hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>View Map Directions</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Host & Questions */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">ORGANIZER</span>
                <p className="font-bold text-slate-900 text-sm">Diversity Collective Ventura County</p>
                <p className="text-xs text-slate-600 font-medium">
                  Email: <a href={`mailto:${event.contactEmail || orgInfo.email}`} className="text-[#5A1E65] hover:underline font-bold">{event.contactEmail || orgInfo.email}</a>
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Phone: <a href={`tel:${orgInfo.phoneRaw}`} className="text-[#5A1E65] hover:underline font-bold">{orgInfo.phone}</a>
                </p>
              </div>

            </CardSpotlight>
          </div>

        </div>
      </article>

    </div>
  );
}
