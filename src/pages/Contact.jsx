import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ArrowUpRight, 
  Send, 
  CheckCircle2, 
  LifeBuoy,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLiveOrgInfo } from '../hooks/useCmsLive';
import CardSpotlight from '../components/CardSpotlight';
import { submitContact } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';
import VoicemailRecorder from '../components/VoicemailRecorder';
import DynamicSchemaFields, {
  useLiveFormSchema,
  buildInitialValues,
  toggleCheckboxGroupValue,
  validateSchemaFields,
  formatCustomFieldsSummary
} from '../components/DynamicSchemaFields';
import { usePageMeta } from '../utils/seo';

const STANDARD_CONTACT_FIELDS = ['name', 'email', 'phone', 'topic', 'message'];

export default function Contact() {
  const orgInfo = useLiveOrgInfo();
  usePageMeta({
    title: 'Contact & Center Directions',
    description: 'Reach out to Diversity Collective Ventura County. Visit our physical Community Resource Center in Ventura, call our helpline, or send a confidential inquiry.',
    canonicalPath: '/contact'
  });

  const schema = useLiveFormSchema('contact');
  const [formStatus, setFormStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [formData, setFormData] = useState(() => ({
    ...buildInitialValues(schema.fields, { topic: 'General Inquiry' }),
    consent: false,
    turnstileToken: ''
  }));

  useEffect(() => {
    setFormData((prev) => ({
      ...buildInitialValues(schema.fields, prev),
      consent: Boolean(prev.consent),
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
      setFormStatus('error');
      setStatusMessage(validationErr);
      return;
    }

    if (!formData.consent) {
      setFormStatus('error');
      setStatusMessage('Please check the privacy and communications consent box before submitting.');
      return;
    }

    const extraFieldsNote = formatCustomFieldsSummary(schema.fields, formData, STANDARD_CONTACT_FIELDS);
    const composedMessage = [formData.message || '', extraFieldsNote].filter(Boolean).join('\n\n');

    setFormStatus('loading');
    const res = await submitContact({
      ...formData,
      message: composedMessage
    });

    if (res.success) {
      setFormStatus('success');
      setStatusMessage(res.message);
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5A1E65', '#10B981', '#F59E0B', '#38BDF8'],
          disableForReducedMotion: true
        });
      } catch {
        // Fallback
      }
    } else {
      setFormStatus('error');
      setStatusMessage(res.message || 'Unable to submit your inquiry. Please call (805) 644-5428 or try again.');
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-clip pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-10 sm:pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 -right-10 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs w-fit">
            {cmsStore.getSettings()?.pageCopy?.contact?.eyebrow || 'LOCATION & CONTACT'}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05] break-words">
            {cmsStore.getSettings()?.pageCopy?.contact?.headline || (
              <>
                Get in Touch &amp; <br />
                <span className="font-serif italic font-normal text-[#5A1E65]">Visit Our Center.</span>
              </>
            )}
          </h1>
          <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-slate-700 leading-relaxed pt-2 break-words">
            {cmsStore.getSettings()?.pageCopy?.contact?.description || 'Whether you have questions about our youth peer groups, want to book an HIV/STI screening, or wish to connect with our team, we are here for you.'}
          </p>
        </div>
      </section>

      {/* Main Grid: Details + Interactive Form */}
      <section className="container-clean py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* Left Column: Location & Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Physical Location Card */}
            <CardSpotlight
              className="p-5 sm:p-8 bg-white rounded-3xl border-2 border-purple-200 shadow-xl space-y-4"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <span className="text-xs font-black tracking-widest text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 uppercase inline-block">
                PHYSICAL CENTER
              </span>
              <h2 className="font-display text-2xl font-black text-slate-950">
                Community Resource Center
              </h2>
              <address className="not-italic text-sm text-slate-600 space-y-1 font-medium">
                <p className="font-bold text-slate-900">
                  {orgInfo.address?.full || (typeof orgInfo.address === 'string' ? orgInfo.address : '2471 Portola Road, Suite 100, Ventura, CA 93003')}
                </p>
                <p className="text-xs text-slate-400 pt-1">
                  Near the intersection of Telephone Rd & Market St. Drop-ins welcome!
                </p>
              </address>
              <div className="pt-2">
                <a
                  href={orgInfo.address?.googleMapsUrl || orgInfo.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary py-3 px-5 text-xs font-bold inline-flex items-center gap-2 shadow-md hover:shadow-xl cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-amber-300" />
                  <span>Open in Google Maps</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </CardSpotlight>

            {/* Direct Channels */}
            <div className="p-5 sm:p-8 bg-slate-50/80 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-black tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase inline-block">
                DIRECT CHANNELS
              </span>
              <div className="space-y-4 text-sm">
                {/* Public Voicemail Interface: Replaces phone number */}
                <VoicemailRecorder />

                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                  <Mail className="w-5 h-5 text-[#5A1E65] flex-shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-600 block font-bold uppercase">General Inquiry Email</span>
                    <a href={`mailto:${orgInfo.email}`} className="font-bold text-slate-900 hover:text-[#5A1E65] text-sm">
                      {orgInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-600 block font-bold uppercase">Center Drop-in Hours</span>
                    <p className="text-slate-800 font-bold text-sm">{orgInfo.hours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Immediate Crisis Notice */}
            <div className="p-5 sm:p-6 bg-rose-50/70 rounded-2xl border-2 border-rose-200 text-xs space-y-1.5 shadow-xs">
              <span className="font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5 text-xs">
                <LifeBuoy className="w-4 h-4 text-rose-600" />
                <span>Immediate 24/7 Crisis Support</span>
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {orgInfo.emergencyCrisisNotice || (
                  <>
                    DCVC is an advocacy and wellness center. If you or a loved one is in crisis, please dial <strong>988</strong> (Suicide & Crisis Lifeline) or call The Trevor Project at <a href="tel:18664887386" className="font-bold text-rose-700 underline">1-866-488-7386</a>.
                  </>
                )}
              </p>
            </div>

          </div>

          {/* Right Column: Functional Message Form */}
          <div className="lg:col-span-7">
            <CardSpotlight
              className="p-5 sm:p-8 md:p-12 bg-white rounded-3xl border-2 border-slate-200 shadow-2xl"
              tilt={true}
              maxTilt={4}
              glare={true}
            >
              <span className="text-xs font-black tracking-widest text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 uppercase inline-block mb-3">
                CONFIDENTIAL ONLINE INQUIRY
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950 mb-2 tracking-tight">
                {schema?.title || 'Send Us a Message'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-8 font-medium">
                {schema?.description || 'Messages are reviewed daily by our Community Resource Center team during weekday operating hours.'}
              </p>

              {formStatus === 'success' ? (
                <div className="p-8 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-center space-y-4 shadow-sm animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-2xl font-black text-emerald-950">
                    Thank You, {formData.name || 'Friend'}!
                  </h3>
                  <p className="text-sm text-emerald-900 max-w-md mx-auto font-medium leading-relaxed">
                    {statusMessage}
                  </p>
                  <button
                    onClick={() => {
                      setFormStatus('idle');
                      setFormData({
                        ...buildInitialValues(schema.fields, { topic: 'General Inquiry' }),
                        consent: false,
                        turnstileToken: ''
                      });
                    }}
                    className="btn-primary py-2.5 px-6 text-xs font-bold mt-2 shadow-md cursor-pointer"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {formStatus === 'error' && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  {/* Live Admin-Synchronized Contact Form Fields */}
                  <DynamicSchemaFields
                    formId="contact"
                    fields={schema?.fields || []}
                    values={formData}
                    onChange={handleFieldChange}
                    onToggleOption={handleOptionToggle}
                  />

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      id="consent"
                      type="checkbox"
                      required
                      checked={Boolean(formData.consent)}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                    />
                    <label htmlFor="consent" className="text-xs text-slate-700 leading-relaxed font-medium">
                      {schema?.consentText || (
                        <>
                          I consent to Diversity Collective Ventura County securely processing and storing my contact details to reply to this inquiry in accordance with our <Link to="/privacy" className="text-[#5A1E65] font-bold underline hover:text-purple-900">Privacy Policy</Link>. Information will never be sold or shared.
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
                      disabled={formStatus === 'loading'}
                      className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-2xl hover:scale-102 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-amber-300" />
                      <span>{formStatus === 'loading' ? 'Transmitting Note...' : (schema?.submitLabel || 'Send Confidential Message')}</span>
                    </button>
                  </div>

                </form>
              )}
            </CardSpotlight>
          </div>

        </div>
      </section>

    </div>
  );
}
