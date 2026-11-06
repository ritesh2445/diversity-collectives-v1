import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  ShieldCheck, 
  FileText,
  Calendar,
  Building
} from 'lucide-react';
import { trainingCourses } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';
import { usePageMeta } from '../utils/seo';

export default function Training() {
  usePageMeta({
    title: 'P.R.I.D.E. Educational Training & Cultural Competency',
    description: 'Ventura County cultural competency and LGBTQ+ equity workshops for educators, healthcare staff, corporate teams, and youth advocates.',
    canonicalPath: '/training'
  });

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            P.R.I.D.E. EDUCATION & CULTURAL COMPETENCY
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Transforming Spaces <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Through Education.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Parents & Professionals' Responsibility for Inclusion, Diversity, and Equity. Certified interactive workshops tailored to Ventura County lived experiences.
          </p>
        </div>
      </section>

      {/* Impact Stat Banner */}
      <section className="bg-purple-950 text-white py-8 border-b border-purple-900">
        <div className="container-clean flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl font-black text-2xl font-display">
              40%+
            </div>
            <div>
              <span className="font-display font-black text-base text-white">Reduction in Youth Suicide Risk</span>
              <p className="text-xs text-purple-200">Research shows having even one affirming adult reduces suicide risk in LGBTQ+ youth by over 40%.</p>
            </div>
          </div>
          <Link to="/training/book" className="btn-primary py-2.5 px-6 text-xs font-bold whitespace-nowrap shadow-md">
            <span>Request a Custom Workshop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Training Catalog List */}
      <section className="container-clean py-16 space-y-12">
        <div className="max-w-2xl">
          <span className="text-xs font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 inline-block mb-2">
            WORKSHOP CATALOG
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-950">
            Available Modules & Certifications
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
            Each workshop is customizable to your organization's specific sector, time allocation, and learning objectives.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {trainingCourses.map((course) => (
            <CardSpotlight
              key={course.slug}
              className="p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-md flex flex-col justify-between gap-6"
              tilt={true}
              maxTilt={4}
              glare={true}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    {course.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{course.duration}</span>
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {course.summary}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-900 block">Key Topics Covered:</span>
                  <ul className="space-y-1.5 text-slate-600">
                    {course.learningObjectives.slice(0, 3).map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Link
                  to={`/training/${course.slug}`}
                  className="btn-primary py-2.5 px-5 text-xs font-bold flex-1 text-center justify-center inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>View Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/training/${course.slug}/book`}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold bg-white text-slate-700"
                >
                  <span>Book</span>
                </Link>
              </div>
            </CardSpotlight>
          ))}
        </div>
      </section>

      {/* Target Audiences Grid */}
      <section className="container-clean py-16 bg-slate-50/70 border-t border-slate-100 rounded-3xl">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="glass-pill text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200 mb-2">
            SECTORS SERVED
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
            Who Benefits from P.R.I.D.E. Training?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <Building className="w-6 h-6 text-[#5A1E65]" />
            <h4 className="font-bold text-slate-900 text-sm">Schools & Universities</h4>
            <p className="text-xs text-slate-600">Equipping teachers, counselors, administrators, and campus security with safe-space strategies.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h4 className="font-bold text-slate-900 text-sm">Healthcare & Clinics</h4>
            <p className="text-xs text-slate-600">Creating trauma-informed clinical intake practices, non-discriminatory care, and PrEP linkage.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <Users className="w-6 h-6 text-amber-600" />
            <h4 className="font-bold text-slate-900 text-sm">Youth-Serving Nonprofits</h4>
            <p className="text-xs text-slate-600">Fostering peer groups, bullying prevention, crisis interventions, and affirming mentorship.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h4 className="font-bold text-slate-900 text-sm">Corporate & Civic Teams</h4>
            <p className="text-xs text-slate-600">Building authentic workplace inclusion, employee resource groups (ERGs), and CA compliance.</p>
          </div>
        </div>
      </section>

    </div>
  );
}

