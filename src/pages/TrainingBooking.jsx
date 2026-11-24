import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Users, 
  Clock, 
  ShieldCheck,
  Store,
  Award,
  Sparkles,
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLiveTrainings } from '../hooks/useCmsLive';
import { submitTrainingBooking } from '../services/api';
import { DEFAULT_FORM_SCHEMAS } from '../services/siteFeaturesStore';
import TurnstileWidget from '../components/TurnstileWidget';
import DcvcApprovedBadge from '../components/DcvcApprovedBadge';
import DynamicSchemaFields, {
  useLiveFormSchema,
  buildInitialValues,
  toggleCheckboxGroupValue,
  validateSchemaFields,
  formatCustomFieldsSummary
} from '../components/DynamicSchemaFields';
import { usePageMeta } from '../utils/seo';

const STANDARD_TRAINING_FIELDS = [
  'organizationName',
  'contactName',
  'email',
  'phone',
  'isSeekingDcvcApprovedStatus',
  'courseSlug',
  'estimatedAttendees',
  'preferredFormat',
  'requestedDate',
  'notes'
];

export default function TrainingBooking() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const trainingCourses = useLiveTrainings();
  const selectedCourse = slug ? trainingCourses.find(c => c.slug === slug) : null;
  const schema = useLiveFormSchema('training');

  usePageMeta({
    title: 'Book P.R.I.D.E. Educational Training',
    description: 'Schedule a certified LGBTQ+ cultural competency workshop for your school, clinic, corporate team, or community agency.',
    canonicalPath: '/training/book'
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');

  const paramSector = searchParams.get('sector');
  const paramAccreditation = searchParams.get('accreditation');
  const paramSize = searchParams.get('size');

  const mappedCategory = (() => {
    if (!paramSector) return 'Retail & Dining';
    const s = paramSector.toLowerCase();
    if (s.includes('retail') || s.includes('din')) return 'Retail & Dining';
    if (s.includes('health') || s.includes('dent') || s.includes('med')) return 'Healthcare & Medical';
    if (s.includes('corp') || s.includes('prof') || s.includes('tech')) return 'Corporate & Professional';
    if (s.includes('well') || s.includes('fit') || s.includes('salon')) return 'Wellness & Fitness';
    if (s.includes('edu') || s.includes('school')) return 'Education & Schools';
    if (s.includes('hosp') || s.includes('tour')) return 'Hospitality & Tourism';
    if (s.includes('nonprofit') || s.includes('civic')) return 'Nonprofit & Community';
    return 'Retail & Dining';
  })();

  const mappedAttendeeRange = (() => {
    if (!paramSize) return '';
    if (paramSize === '1-15') return 'Under 15 Participants';
    if (paramSize === '16-50') return '15 – 30 Participants';
    if (paramSize === '51-200') return '30 – 60 Participants';
    if (paramSize === '201+') return '100+ Participants (Assembly or Conference)';
    return '';
  })();

  const initialAccreditation = paramAccreditation === 'true' || 
    slug === 'dcvc-affirming-business' || 
    Boolean(selectedCourse?.isBusinessAccreditation);

  // Sync live curriculum options onto courseSlug when Admin hasn't manually overridden its options
  const effectiveFields = useMemo(() => {
    const defaultCourseOpts = DEFAULT_FORM_SCHEMAS.training?.fields?.find((f) => f.id === 'courseSlug')?.options || [];
    return (schema?.fields || []).map((field) => {
      if (field.id !== 'courseSlug' || field.type !== 'select' || !Array.isArray(trainingCourses) || trainingCourses.length === 0) {
        return field;
      }
      const currentOpts = Array.isArray(field.options) ? field.options : [];
      const isStillDefault =
        currentOpts.length === defaultCourseOpts.length &&
        currentOpts.every((val, i) => val === defaultCourseOpts[i]);
      if (!isStillDefault) return field;
      return {
        ...field,
        options: trainingCourses.map((c) => ({ value: c.slug, label: `${c.title} (${c.duration})` }))
      };
    });
  }, [schema?.fields, trainingCourses]);

  const [formData, setFormData] = useState(() => ({
    ...buildInitialValues(effectiveFields, {
      courseSlug: selectedCourse ? selectedCourse.slug : (trainingCourses[0]?.slug || ''),
      isSeekingDcvcApprovedStatus: initialAccreditation,
      estimatedAttendees: mappedAttendeeRange,
      preferredFormat: 'In-Person at Our Facility'
    }),
    storefrontAddress: '',
    storefrontCity: 'Ventura',
    businessCategory: mappedCategory,
    termsConsent: false,
    turnstileToken: ''
  }));

  useEffect(() => {
    setFormData((prev) => ({
      ...buildInitialValues(effectiveFields, prev),
      storefrontAddress: prev.storefrontAddress || '',
      storefrontCity: prev.storefrontCity || 'Ventura',
      businessCategory: prev.businessCategory || mappedCategory,
      termsConsent: Boolean(prev.termsConsent),
      turnstileToken: prev.turnstileToken || ''
    }));
  }, [effectiveFields, mappedCategory]);

  useEffect(() => {
    if (selectedCourse?.slug) {
      setFormData(prev => ({
        ...prev,
        courseSlug: selectedCourse.slug,
        isSeekingDcvcApprovedStatus: prev.isSeekingDcvcApprovedStatus || Boolean(selectedCourse.isBusinessAccreditation)
      }));
    }
  }, [selectedCourse]);

  const handleFieldChange = (id, val) => {
    setFormData((prev) => ({ ...prev, [id]: val }));
  };

  const handleOptionToggle = (id, optionLabel) => {
    setFormData((prev) => ({
      ...prev,
      [id]: toggleCheckboxGroupValue(prev[id], optionLabel)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErr = validateSchemaFields(effectiveFields, formData);
    if (validationErr) {
      setStatus('error');
      setStatusMsg(validationErr);
      return;
    }

    if (!formData.termsConsent) {
      setStatus('error');
      setStatusMsg('Please accept the non-discrimination and privacy consent agreement.');
      return;
    }

    const extraFieldsNote = formatCustomFieldsSummary(effectiveFields, formData, STANDARD_TRAINING_FIELDS);
    const composedNotes = [formData.notes || '', extraFieldsNote].filter(Boolean).join('\n\n');

    setStatus('loading');
    const matchedCourse = trainingCourses.find(c => c.slug === formData.courseSlug || c.title === formData.courseSlug);
    const res = await submitTrainingBooking({
      ...formData,
      notes: composedNotes,
      courseTitle: matchedCourse?.title || formData.courseSlug,
    });

    if (res.success) {
      setStatus('success');
      setStatusMsg(res.message);
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5A1E65', '#10B981', '#F59E0B']
        });
      } catch {
        // Fallback
      }
    } else {
      setStatus('error');
      setStatusMsg(res.message || 'Submission failed. Please call (805) 644-5428.');
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Back button */}
      <div className="container-clean mb-6">
        <Link 
          to="/training" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Training Catalog</span>
        </Link>
      </div>

      <section className="container-clean max-w-4xl">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-200 shadow-xl space-y-8">
          
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
              WORKSHOP BOOKING & INQUIRY
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              {schema?.title || 'Request a P.R.I.D.E. Workshop'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {schema?.description || 'Equip your organization with actionable LGBTQ+ cultural competency grounded in Ventura County lived experience. Our training leads will review your inquiry and coordinate scheduling.'}
            </p>
          </div>

          {status === 'success' ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-emerald-950">
                Inquiry Successfully Logged!
              </h2>
              <p className="text-sm text-emerald-900 max-w-lg mx-auto font-medium leading-relaxed">
                {statusMsg}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link to="/training" className="btn-primary py-2.5 px-6 text-xs font-bold">
                  Browse More Workshops
                </Link>
                <Link to="/" className="btn-secondary py-2.5 px-5 text-xs font-bold bg-white">
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              {/* Live Admin-Synchronized Training Form Fields */}
              <DynamicSchemaFields
                formId="training"
                fields={effectiveFields}
                values={formData}
                onChange={handleFieldChange}
                onToggleOption={handleOptionToggle}
                renderCustomField={(field) => {
                  if (field.id !== 'isSeekingDcvcApprovedStatus' || field.type !== 'checkbox') return null;
                  return (
                    <div className="sm:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-emerald-50/50 border-2 border-purple-200/90 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <input
                            id="businessAccreditationToggle"
                            type="checkbox"
                            required={Boolean(field.required)}
                            checked={Boolean(formData.isSeekingDcvcApprovedStatus)}
                            onChange={(e) => handleFieldChange('isSeekingDcvcApprovedStatus', e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-purple-300 text-[#5A1E65] focus:ring-[#5A1E65] cursor-pointer"
                          />
                          <div>
                            <label htmlFor="businessAccreditationToggle" className="font-display font-black text-sm text-slate-950 cursor-pointer block">
                              {field.label} {field.required && <span className="text-rose-600">*</span>}
                            </label>
                            {field.helperText && (
                              <p className="text-xs text-slate-600 font-medium mt-0.5">
                                {field.helperText}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="hidden sm:block shrink-0">
                          <DcvcApprovedBadge />
                        </div>
                      </div>

                      {formData.isSeekingDcvcApprovedStatus && (
                        <div className="pt-4 border-t border-purple-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                          <div className="sm:col-span-1 space-y-1">
                            <label htmlFor="businessCategory" className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                              Business Category
                            </label>
                            <select
                              id="businessCategory"
                              value={formData.businessCategory}
                              onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none bg-white font-medium"
                            >
                              <option value="Retail & Dining">Retail & Dining</option>
                              <option value="Healthcare & Medical">Healthcare & Medical</option>
                              <option value="Corporate & Professional">Corporate & Professional</option>
                              <option value="Wellness & Fitness">Wellness & Fitness</option>
                              <option value="Education & Schools">Education & Schools</option>
                              <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                              <option value="Nonprofit & Community">Nonprofit & Community</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="sm:col-span-1 space-y-1">
                            <label htmlFor="storefrontAddress" className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                              Storefront / Office Address
                            </label>
                            <input
                              id="storefrontAddress"
                              type="text"
                              value={formData.storefrontAddress}
                              onChange={(e) => setFormData({ ...formData, storefrontAddress: e.target.value })}
                              placeholder="e.g. 555 E Main St"
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none"
                            />
                          </div>

                          <div className="sm:col-span-1 space-y-1">
                            <label htmlFor="storefrontCity" className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                              Ventura County City
                            </label>
                            <select
                              id="storefrontCity"
                              value={formData.storefrontCity}
                              onChange={(e) => setFormData({ ...formData, storefrontCity: e.target.value })}
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#5A1E65] outline-none bg-white font-medium"
                            >
                              <option value="Ventura">Ventura</option>
                              <option value="Oxnard">Oxnard</option>
                              <option value="Camarillo">Camarillo</option>
                              <option value="Simi Valley">Simi Valley</option>
                              <option value="Thousand Oaks">Thousand Oaks</option>
                              <option value="Ojai">Ojai</option>
                              <option value="Moorpark">Moorpark</option>
                              <option value="Port Hueneme">Port Hueneme</option>
                              <option value="Santa Paula">Santa Paula</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              {/* Consent */}
              <div className="flex items-start gap-3 p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  checked={Boolean(formData.termsConsent)}
                  onChange={(e) => setFormData({ ...formData, termsConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                />
                <label htmlFor="terms" className="text-xs text-slate-700 leading-relaxed font-medium">
                  {schema?.consentText || (
                    <>
                      I consent to Diversity Collective Ventura County using my contact details to coordinate this educational workshop inquiry under our <Link to="/privacy" className="text-[#5A1E65] font-bold underline hover:text-purple-900">Privacy Policy</Link>.
                    </>
                  )} <span className="text-rose-600">*</span>
                </label>
              </div>

              {/* Cloudflare Turnstile Spam Protection */}
              <TurnstileWidget
                onVerify={(token) => setFormData(prev => ({ ...prev, turnstileToken: token }))}
                onExpire={() => setFormData(prev => ({ ...prev, turnstileToken: '' }))}
              />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-2xl hover:scale-102 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{status === 'loading' ? 'Submitting Request...' : (schema?.submitLabel || 'Send Booking Inquiry')}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </section>

    </div>
  );
}

