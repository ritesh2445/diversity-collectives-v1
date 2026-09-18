import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck, 
  Heart,
  Sparkles,
  Calendar
} from 'lucide-react';
import { programsList, orgInfo } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function ProgramDetail() {
  const { slug } = useParams();
  const program = programsList.find(p => p.slug === slug);

  if (!program) {
    return <Navigate to="/programs" replace />;
  }

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-white text-slate-800">
      
      {/* Top Breadcrumb Navigation */}
      <section className="container-clean pb-6">
        <Link 
          to="/programs" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1 px-3 rounded-full bg-slate-100 hover:bg-purple-50 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Programs</span>
        </Link>
      </section>

      {/* Program Hero Section */}
      <section className="container-clean pb-16 border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="glass-pill text-xs font-black text-[#5A1E65] bg-purple-50 border-purple-200">
                PROGRAM {program.chapter} · {program.audience}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                100% Free Service
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.08]">
              {program.title}
            </h1>

            <p className="font-serif italic text-xl sm:text-2xl text-[#5A1E65] font-medium">
              "{program.tagline}"
            </p>

            <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium">
              {program.description}
            </p>

            {/* Practical Logistics Quick Card in 3D */}
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#5A1E65] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">Meeting Time: </span>
                  <span className="text-slate-600 font-medium">{program.schedule}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#5A1E65] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">Location: </span>
                  <span className="text-slate-600 font-medium">{program.location}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#5A1E65] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">Phone: </span>
                  <a href={`tel:${orgInfo.phoneRaw}`} className="text-[#5A1E65] hover:underline font-bold">
                    {program.contactPhone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#5A1E65] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">Contact Email: </span>
                  <a href={`mailto:${program.contactEmail}`} className="text-[#5A1E65] hover:underline font-bold">
                    {program.contactEmail}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${program.contactEmail}`}
                className="btn-primary py-3.5 px-7 text-sm font-bold inline-flex items-center gap-2 shadow-md hover:shadow-xl"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Program Lead</span>
              </a>
              <a
                href={orgInfo.address.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-3.5 px-6 text-sm font-bold inline-flex items-center gap-2 bg-white"
              >
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Directions to CRC</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 perspective-1000">
            <CardSpotlight
              className="rounded-3xl shadow-2xl overflow-hidden aspect-[4/5] border-2 border-slate-200 group interactive-card-3d"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <img 
                src={program.heroImage} 
                alt={program.title}
                className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                onError={(e) => {
                  e.target.src = "/images/crc-building.jpg";
                }}
              />
            </CardSpotlight>
          </div>

        </div>
      </section>

      {/* Program Amenities & Key Features */}
      {program.amenities && (
        <section className="container-clean py-16 border-b border-slate-100">
          <div className="max-w-2xl mb-10">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200 mb-2 block">
              PILLARS & OFFERINGS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              What You Can Expect
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
            {program.amenities.map((item, idx) => (
              <CardSpotlight 
                key={idx}
                className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3 interactive-card-3d"
                tilt={true}
                maxTilt={4}
                glare={true}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {item}
                </span>
              </CardSpotlight>
            ))}
          </div>
        </section>
      )}

      {/* Diversity SHINES Specific Information */}
      {program.slug === 'diversity-shines' && (
        <section className="container-clean py-16 border-b border-slate-100">
          <div className="p-8 md:p-12 bg-purple-50/70 rounded-3xl border-2 border-purple-200 space-y-6 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
              STATUS NEUTRAL CLINICAL APPROACH
            </span>
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-slate-950">
              Free Confidential HIV & STI Screenings
            </h3>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed max-w-3xl font-medium">
              We offer free confidential HIV and STI screenings every 1st Monday of the month from 3:00 PM – 7:00 PM performed by state-certified testing counselors. Our STI screenings include syphilis, chlamydia, and gonorrhea. We also provide PrEP & PEP navigation and free 'SHINE With Me' safer sex kits (mail order or pick up at the CRC).
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a 
                href="https://www.diversitycollectivevc.org/schedule-your-appointment/#hivSchedule"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-3.5 px-6 text-xs sm:text-sm font-bold shadow-md hover:shadow-xl inline-flex items-center gap-2"
              >
                <span>Book Free Appointment Online</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a 
                href="https://wkf.ms/3PhSCAl"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-3.5 px-6 text-xs sm:text-sm font-bold bg-white inline-flex items-center gap-2"
              >
                <span>Order Free Safer Sex Kit by Mail</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Bottom Other Programs Switcher */}
      <section className="container-clean pt-16">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <h3 className="font-display text-2xl font-black text-slate-950">
            Explore Other Programs
          </h3>
          <Link to="/programs" className="text-xs font-bold uppercase tracking-wider text-[#5A1E65] hover:underline">
            View All Programs →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 perspective-1000">
          {programsList.filter(p => p.slug !== program.slug).slice(0, 4).map(other => (
            <Link
              key={other.slug}
              to={`/programs/${other.slug}`}
              className="p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-[#5A1E65] transition-all group block interactive-card-3d shadow-sm"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                PROGRAM {other.chapter}
              </span>
              <h4 className="font-display text-lg font-black text-slate-900 group-hover:text-[#5A1E65] transition-colors">
                {other.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">
                {other.tagline}
              </p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
