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
      <section className="container-clean py-14">
        <MobileCarousel cols={4} autoScrollMs={0} cardClassName="h-full flex flex-col">
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3 h-full">
            <span className="text-2xl">🏠</span>
            <h3 className="font-display text-lg font-bold text-slate-950">Center Hospitality</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Welcoming drop-in guests, assisting with computer lab access, and answering community telephone inquiries.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3 h-full">
            <span className="text-2xl">🌈</span>
            <h3 className="font-display text-lg font-bold text-slate-950">Youth Mentorship</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Supporting adult facilitation for Friday Rainbow Umbrella circles and craft workshops for Little Unicorns.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3 h-full">
            <span className="text-2xl">🩺</span>
            <h3 className="font-display text-lg font-bold text-slate-950">Health & Outreach</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Packing 'SHINE With Me' safer-sex kits and tabling at local college wellness fairs and community festivals.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3 h-full">
            <span className="text-2xl">🎉</span>
            <h3 className="font-display text-lg font-bold text-slate-950">Pride & Galas</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Ventura County Pride staging, ticketing, green-room coordination, and AIDS Walk operations.</p>
          </div>
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

