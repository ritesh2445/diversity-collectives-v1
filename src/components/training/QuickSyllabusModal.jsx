import React from 'react';
import { 
  X, 
  Clock, 
  Users, 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  ShieldCheck,
  Mail,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DcvcApprovedBadge from '../DcvcApprovedBadge';

export default function QuickSyllabusModal({ course, isOpen, onClose }) {
  if (!isOpen || !course) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-50 via-white to-slate-50 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                {course.badge || 'Certified Workshop'}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{course.duration}</span>
              </span>
              {course.isBusinessAccreditation && (
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ⭐ DCVC Approved Pathway
                </span>
              )}
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
              {course.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Format: {course.format}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800">
          {/* Summary */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#5A1E65]">
              Curriculum Summary
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {course.summary}
            </p>
          </div>

          {/* Recommended Audience */}
          {course.targetAudience && (
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex items-start gap-3 text-xs">
              <Users className="w-4 h-4 text-[#5A1E65] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Target Audience:</strong>
                <span className="text-slate-600 font-medium">{course.targetAudience}</span>
              </div>
            </div>
          )}

          {/* Core Learning Objectives */}
          {Array.isArray(course.learningObjectives) && course.learningObjectives.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                Core Competencies & Objectives Covered:
              </span>
              <div className="space-y-2">
                {course.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials & Deliverables */}
          {Array.isArray(course.materials) && course.materials.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                Included Materials & Certification Package:
              </span>
              <ul className="space-y-2 text-xs text-slate-600">
                {course.materials.map((mat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="font-medium">{mat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Business Directory Accreditation Callout if applicable */}
          {course.isBusinessAccreditation && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                  DCVC Approved Storefront Seal
                </span>
                <span className="text-xs text-slate-700 font-medium block">
                  Graduating teams receive the official physical storefront window cling and 3D verified badge in the directory!
                </span>
              </div>
              <div className="shrink-0">
                <DcvcApprovedBadge />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Fee Structure: <strong>{course.feeStructure || 'Sliding scale for local partners'}</strong>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to={`/training/${course.slug}`}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex-1 sm:flex-none text-center"
            >
              Full Course Page
            </Link>
            <Link
              to={`/training/${course.slug}/book`}
              className="btn-primary py-2.5 px-5 text-xs font-bold flex-1 sm:flex-none text-center inline-flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Book Workshop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
