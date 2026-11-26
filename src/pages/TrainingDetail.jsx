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
  ShieldCheck,
  Award,
  Package,
  Store
} from 'lucide-react';
import { useLiveOrgInfo, useLiveTrainings } from '../hooks/useCmsLive';
import DcvcApprovedBadge from '../components/DcvcApprovedBadge';
import { usePageMeta } from '../utils/seo';

export default function TrainingDetail() {
  const { slug } = useParams();
  const orgInfo = useLiveOrgInfo();
  const trainingCourses = useLiveTrainings();
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
              {course.isFlagship && (
                <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Flagship</span>
                </span>
              )}
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

            {/* DCVC Approved Accreditation Callout Banner if applicable */}
            {course.isBusinessAccreditation && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-[#5A1E65] to-indigo-950 text-white shadow-xl space-y-4 border border-purple-400/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 inline-block">
                      OFFICIAL ACCREDITATION PATHWAY
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-black text-white">
                      Earn the DCVC Approved Storefront Seal
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md shrink-0">
                    <DcvcApprovedBadge />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-purple-200 leading-relaxed font-medium">
                  Completing this training workshop qualifies your organization to receive the official heavy-duty physical storefront window decal cling, framed certificate, and verified 3D holographic badge with rainbow edge lighting in the Ventura County Business Directory.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/15 text-xs text-purple-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Storefront static-cling window decal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Directory Platinum listing with Hype meter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>California SB 396 compliance verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Frontline staff pronoun pins kit</span>
                  </div>
                </div>
              </div>
            )}

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

      {/* Related Modules & Tracks */}
      <section className="container-clean pt-16 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#5A1E65]">
              EXPLORE MORE CURRICULUM
            </span>
            <h3 className="font-display text-2xl font-black text-slate-950">
              Related Workshops & Certification Tracks
            </h3>
          </div>
          <Link
            to="/training"
            className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
          >
            <span>All Workshops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainingCourses
            .filter((c) => c.slug !== course.slug)
            .slice(0, 3)
            .map((rel) => (
              <div
                key={rel.slug}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                    <span className="text-[#5A1E65]">{rel.badge}</span>
                    <span>{rel.duration}</span>
                  </div>
                  <h4 className="font-display font-black text-base text-slate-950 line-clamp-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                    {rel.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/training/${rel.slug}`}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
                  >
                    <span>View Syllabus</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to={`/training/${rel.slug}/book`}
                    className="btn-secondary py-1 px-3 text-[11px] font-bold"
                  >
                    Book
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </section>

    </div>
  );
}

