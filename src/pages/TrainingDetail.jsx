import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Users, 
  CheckCircle2, 
  FileText, 
  Mail, 
  Building,
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { trainingCourses, orgInfo } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

export default function TrainingDetail() {
  const { slug } = useParams();
  const course = trainingCourses.find(c => c.slug === slug);

  usePageMeta({
    title: course ? course.title : 'Training Course',
    description: course ? course.summary : 'P.R.I.D.E. cultural competency workshop details.',
    canonicalPath: course ? `/training/${course.slug}` : '/training'
  });

  if (!course) {
    return <Navigate to="/training" replace />;
  }

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Breadcrumb Back Link */}
      <div className="container-clean mb-6">
        <Link 
          to="/training" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Training Catalog</span>
        </Link>
      </div>

      {/* Main Course Hero */}
      <section className="container-clean pb-16 border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                {course.badge}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{course.duration}</span>
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {course.format}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-[1.08]">
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              {course.summary}
            </p>

            {/* Target Audience */}
            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3 text-xs sm:text-sm">
              <Users className="w-5 h-5 text-[#5A1E65] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Recommended For:</span>
                <span className="text-slate-600 font-medium">{course.targetAudience}</span>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="space-y-4 pt-4">
              <h2 className="font-display text-2xl font-black text-slate-950">
                Core Learning Objectives & Competencies
              </h2>
              <div className="space-y-3">
                {course.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-700 font-medium">{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Included Materials */}
            {course.materials && (
              <div className="space-y-4 pt-4">
                <h3 className="font-display text-xl font-bold text-slate-950">
                  Included Participant Materials
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {course.materials.map((mat, i) => (
                    <li key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#5A1E65] flex-shrink-0" />
                      <span className="font-medium text-slate-700">{mat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Booking & Logistics Sidebar */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="p-8 rounded-3xl bg-white border-2 border-purple-200 shadow-xl space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  WORKSHOP SCHEDULING
                </span>
                <h3 className="font-display text-2xl font-black text-slate-950">
                  Book This Module
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {course.feeStructure}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Duration:</span>
                  <span className="font-bold text-slate-900">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Format:</span>
                  <span className="font-bold text-slate-900">{course.format}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Group Size:</span>
                  <span className="font-bold text-slate-900">10 – 150 Attendees</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to={`/training/${course.slug}/book`}
                  className="btn-primary w-full py-3.5 text-center text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>Request Booking & Dates</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={`mailto:${course.contactEmail || orgInfo.email}?subject=Question%20about%20${encodeURIComponent(course.title)}`}
                  className="btn-secondary w-full py-3 text-center text-xs font-bold inline-flex items-center justify-center gap-2 bg-white"
                >
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Ask a Question</span>
                </a>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Ventura County Behavioral Health Certified Curriculum</span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

