import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Heart, 
  Sparkles, 
  Calendar, 
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitVolunteer } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';
import MobileCarousel from '../components/MobileCarousel';
import DynamicSchemaFields, {
  useLiveFormSchema,
  buildInitialValues,
  toggleCheckboxGroupValue,
  validateSchemaFields,
  formatCustomFieldsSummary
} from '../components/DynamicSchemaFields';
import { orgInfo } from '../data/dcvcData';
import { usePageMeta } from '../utils/seo';

const VOLUNTEER_PATHWAYS = [
  {
    icon: '🏠',
    badge: 'Drop-In & Care',
    title: 'Center Hospitality',
    description: 'Welcoming drop-in guests, assisting with computer lab access, and answering community telephone inquiries.',
    cardClass: 'bg-gradient-to-br from-purple-50/95 via-white to-fuchsia-50/75 border-purple-200 hover:border-purple-400 hover:shadow-[0_14px_34px_-10px_rgba(147,51,234,0.38)]',
    stripClass: 'from-purple-600 via-fuchsia-500 to-purple-400',
    glowClass: 'bg-purple-400/20',
    iconBgClass: 'bg-purple-100 border-purple-200',
    badgeClass: 'text-purple-800 bg-purple-100/80 border-purple-200'
  },
  {
    icon: '🌈',
    badge: 'Youth Ages 9–23',
    title: 'Youth Mentorship',
    description: 'Supporting adult facilitation for Friday Rainbow Umbrella circles and craft workshops for Little Unicorns.',
    cardClass: 'bg-gradient-to-br from-rose-50/95 via-white to-pink-50/75 border-rose-200 hover:border-rose-400 hover:shadow-[0_14px_34px_-10px_rgba(244,63,94,0.34)]',
    stripClass: 'from-rose-500 via-fuchsia-500 to-amber-400',
    glowClass: 'bg-rose-400/20',
    iconBgClass: 'bg-rose-100 border-rose-200',
    badgeClass: 'text-rose-800 bg-rose-100/80 border-rose-200'
  },
  {
    icon: '🩺',
    badge: 'Diversity SHINES',
    title: 'Health & Outreach',
    description: "Packing 'SHINE With Me' safer-sex kits and tabling at local college wellness fairs and community festivals.",
    cardClass: 'bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/75 border-emerald-200 hover:border-emerald-400 hover:shadow-[0_14px_34px_-10px_rgba(16,185,129,0.38)]',
    stripClass: 'from-emerald-500 via-teal-500 to-cyan-400',
    glowClass: 'bg-emerald-400/20',
    iconBgClass: 'bg-emerald-100 border-emerald-200',
    badgeClass: 'text-emerald-800 bg-emerald-100/80 border-emerald-200'
  },
  {
    icon: '🎉',
    badge: 'Events & Pride',
    title: 'Pride & Galas',
    description: 'Ventura County Pride staging, ticketing, green-room coordination, and AIDS Walk operations.',
    cardClass: 'bg-gradient-to-br from-amber-50/95 via-white to-orange-50/75 border-amber-200 hover:border-amber-400 hover:shadow-[0_14px_34px_-10px_rgba(245,158,11,0.40)]',
    stripClass: 'from-amber-500 via-orange-500 to-rose-500',
    glowClass: 'bg-amber-400/20',
    iconBgClass: 'bg-amber-100 border-amber-200',
    badgeClass: 'text-amber-900 bg-amber-100/80 border-amber-200'
  }
];

const STANDARD_VOLUNTEER_FIELDS = [
  'preferredName',
  'pronouns',
  'fullName',
  'email',
  'phone',
  'availability',
  'areasOfInterest',
  'message'
];

export default function Volunteer() {
  usePageMeta({
    title: 'Volunteer Pathways & Community Action',
    description: 'Join our grassroots volunteer team. Assist with LGBTQ+ youth groups, free health screening kit packing, Pride festival operations, and center hospitality.',
    canonicalPath: '/volunteer'
  });

  const schema = useLiveFormSchema('volunteer');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState(() => ({
    ...buildInitialValues(schema.fields, {
      availability: 'Weekdays (Afternoons 1:00 – 5:00 PM)',
      areasOfInterest: []
    }),
    backgroundCheckConsent: false,
    turnstileToken: ''
  }));

  useEffect(() => {
    setFormData((prev) => ({
      ...buildInitialValues(schema.fields, prev),
      backgroundCheckConsent: Boolean(prev.backgroundCheckConsent),
      turnstileToken: prev.turnstileToken || ''
    }));
  }, [schema.fields]);

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

    const validationErr = validateSchemaFields(schema.fields, formData);
    if (validationErr) {
      setStatus('error');
      setStatusMsg(validationErr);
      return;
    }

    if (!formData.backgroundCheckConsent) {
      setStatus('error');
      setStatusMsg('Please provide consent for our standard volunteer vetting policy.');
      return;
    }

    const extraFieldsNote = formatCustomFieldsSummary(schema.fields, formData, STANDARD_VOLUNTEER_FIELDS);
    const composedMessage = [formData.message || '', extraFieldsNote].filter(Boolean).join('\n\n');

    setStatus('loading');
    const res = await submitVolunteer({
      ...formData,
      preferredName: formData.preferredName || formData.fullName || formData.name,
      fullName: formData.fullName || formData.name || formData.preferredName,
      message: composedMessage
    });

    if (res.success) {
      setStatus('success');
      const confirmationGreeting = formData.preferredName || formData.fullName || formData.name;
      setStatusMsg(
        res.message ||
        `Thank you, ${confirmationGreeting || 'Friend'}! Your volunteer application has been received. Our volunteer coordinator will reach out to schedule an orientation.`
      );
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
      setStatusMsg(res.message || 'Submission error. Please call (805) 644-5428.');
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-emerald-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200/90 shadow-xs">
            GRASSROOTS ACTION & PARTICIPATION
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Volunteer With Us & <br />
            <span className="font-serif italic font-normal text-emerald-700">Make an Impact.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            "We do what we do, because of you." Our volunteers are the warm heart of our Community Resource Center, youth peer circles, and festival operations.
          </p>
        </div>
      </section>

      {/* Volunteer Pathways Showcase */}
      <section className="container-clean py-12">
        <MobileCarousel cols={4} autoScrollMs={0} cardClassName="h-full flex flex-col">
          {VOLUNTEER_PATHWAYS.map((pathway) => (
            <div
              key={pathway.title}
              className={`group relative overflow-hidden p-6 rounded-3xl border-2 shadow-sm hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between gap-3.5 h-full ${pathway.cardClass}`}
            >
              {/* Top vibrant accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${pathway.stripClass}`} />

              {/* Soft radial cursor-hover halo */}
              <div
                className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${pathway.glowClass}`}
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-3 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-2xl shadow-2xs group-hover:scale-110 transition-transform duration-300 ${pathway.iconBgClass}`}>
                    {pathway.icon}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${pathway.badgeClass}`}>
                    {pathway.badge}
                  </span>
                </div>
                <h3 className="font-display text-lg font-extrabold text-slate-950 tracking-tight">
                  {pathway.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium">
                  {pathway.description}
                </p>
              </div>
            </div>
          ))}
        </MobileCarousel>
      </section>

      {/* Main Application Form */}
      <section className="container-clean py-8 max-w-3xl">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-200 shadow-2xl space-y-8">
          
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <span className="glass-pill text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200">
              JOIN THE TEAM
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-950">
              {schema?.title || 'Volunteer Application Form'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {schema?.description || 'Please share your background, availability, and areas of passion. Our volunteer coordinator conducts monthly orientation sessions.'}
            </p>
          </div>

          {status === 'success' ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-emerald-950">
                Application Received!
              </h3>
              <p className="text-sm text-emerald-900 max-w-md mx-auto font-medium leading-relaxed">
                {statusMsg}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link to="/" className="btn-primary py-2.5 px-6 text-xs font-bold">
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

              {/* Live Admin-Synchronized Volunteer Form Fields */}
              <DynamicSchemaFields
                formId="volunteer"
                fields={schema?.fields || []}
                values={formData}
                onChange={handleFieldChange}
                onToggleOption={handleOptionToggle}
              />

              {/* Vetting & Background Check Consent */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <input
                  id="bgCheck"
                  type="checkbox"
                  required
                  checked={Boolean(formData.backgroundCheckConsent)}
                  onChange={(e) => setFormData({ ...formData, backgroundCheckConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <label htmlFor="bgCheck" className="text-xs text-slate-700 leading-relaxed font-medium">
                  {schema?.consentText || (
                    <>
                      <strong>Volunteer Safety & Vetting Consent:</strong> Because Diversity Collective provides safe spaces for minor youth and vulnerable adults, I agree to comply with our <Link to="/terms" className="text-emerald-700 font-bold underline hover:text-emerald-900">Code of Conduct</Link> and standard volunteer vetting policies under our <Link to="/privacy" className="text-emerald-700 font-bold underline hover:text-emerald-900">Privacy Policy</Link>.
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
                  className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-2xl hover:scale-102 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{status === 'loading' ? 'Submitting Application...' : (schema?.submitLabel || 'Submit Volunteer Application')}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </section>

    </div>
  );
}

