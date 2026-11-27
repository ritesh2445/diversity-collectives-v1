import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  ShieldCheck, 
  MapPin, 
  Globe,
  Upload,
  Image as ImageIcon,
  Trash2,
  Crop
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitBusiness } from '../services/api';
import { optimizeImageFile } from '../admin/services/imageService';
import ImageCropperModal from '../admin/components/ImageCropperModal.jsx';
import TurnstileWidget from '../components/TurnstileWidget';
import DynamicSchemaFields, {
  useLiveFormSchema,
  buildInitialValues,
  toggleCheckboxGroupValue,
  validateSchemaFields,
  formatCustomFieldsSummary
} from '../components/DynamicSchemaFields';
import { usePageMeta } from '../utils/seo';

const STANDARD_DIRECTORY_FIELDS = [
  'businessName',
  'category',
  'city',
  'address',
  'website',
  'phone',
  'description',
  'isLGBTQOwned',
  'ownerName',
  'ownerEmail'
];

export default function DirectorySubmit() {
  usePageMeta({
    title: 'Submit Your Business to the Affirming Directory',
    description: 'Join the Ventura County LGBTQ+ Affirming Business Directory. Submit your establishment for community review.',
    canonicalPath: '/directory/submit'
  });

  const schema = useLiveFormSchema('directory_submit');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [cropIndex, setCropIndex] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(() => ({
    ...buildInitialValues(schema.fields, {
      category: 'Dining & Coffee',
      city: 'Ventura',
      isLGBTQOwned: false
    }),
    termsConsent: false,
    turnstileToken: ''
  }));

  useEffect(() => {
    setFormData((prev) => ({
      ...buildInitialValues(schema.fields, prev),
      termsConsent: Boolean(prev.termsConsent),
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

    if (!formData.termsConsent) {
      setStatus('error');
      setStatusMsg('You must agree to the Non-Discrimination Community Pledge.');
      return;
    }

    const extraFieldsNote = formatCustomFieldsSummary(schema.fields, formData, STANDARD_DIRECTORY_FIELDS);
    const composedDesc = [formData.description || '', extraFieldsNote].filter(Boolean).join('\n\n');

    setStatus('loading');
    const res = await submitBusiness({
      ...formData,
      email: formData.email || formData.ownerEmail || '',
      description: composedDesc,
      cover_url: uploadedImages[0] || '',
      image: uploadedImages[0] || '',
      images: uploadedImages
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
      setStatusMsg(res.message || 'Submission error. Please check your inputs.');
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Back link */}
      <div className="container-clean mb-6">
        <Link 
          to="/directory" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Business Directory</span>
        </Link>
      </div>

      <section className="container-clean max-w-3xl">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-200 shadow-xl space-y-8">
          
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200">
              DIRECTORY INCLUSION
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              {schema?.title || 'Submit Your Business'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {schema?.description || 'Join the official Ventura County LGBTQ+ Affirming Directory. All submissions are moderated by DCVC staff before public listing to ensure safe, inclusive spaces for our community.'}
            </p>
          </div>

          {status === 'success' ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-emerald-950">
                Submission Received for Review!
              </h2>
              <p className="text-sm text-emerald-900 max-w-lg mx-auto font-medium leading-relaxed">
                {statusMsg}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link to="/directory" className="btn-primary py-2.5 px-6 text-xs font-bold">
                  Browse Active Directory
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

              {/* Live Admin-Synchronized Directory Form Fields */}
              <DynamicSchemaFields
                formId="directory_submit"
                fields={schema?.fields || []}
                values={formData}
                onChange={handleFieldChange}
                onToggleOption={handleOptionToggle}
              />

              {/* Business Photos / Logo Upload (Optional, up to 4) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#5A1E65]" />
                      <span>Business Photos &amp; Storefront Logo (Optional)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Recommended banner size: <strong>1200 × 675 px (16:9 widescreen)</strong>. Upload up to 4 photos (first image is your cover banner; use the Crop button to fit it cleanly).
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []).slice(0, Math.max(0, 4 - uploadedImages.length));
                      if (files.length === 0) return;
                      setImageUploading(true);
                      try {
                        const compressed = await Promise.all(
                          files.map(async (f) => {
                            const res = await optimizeImageFile(f, { maxWidth: 1200, maxHeight: 675, quality: 0.90 });
                            return typeof res === 'string' ? res : (res?.dataUrl || res?.url || '');
                          })
                        );
                        const validUrls = compressed.filter(Boolean);
                        setUploadedImages((prev) => [...prev, ...validUrls].slice(0, 4));
                      } catch (_) {
                        setStatus('error');
                        setStatusMsg('Could not process one of the selected images. Please try a JPG or PNG.');
                      } finally {
                        setImageUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={imageUploading || uploadedImages.length >= 4}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-[#5A1E65] border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-45"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{imageUploading ? 'Optimizing...' : `Upload Photos (${uploadedImages.length}/4)`}</span>
                  </button>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {uploadedImages.map((src, idx) => (
                      <div key={idx} className="relative aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
                        <img src={src} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-md opacity-45 scale-125 pointer-events-none" />
                        <img src={src} alt={`Business upload ${idx + 1}`} className="w-full h-full object-contain relative z-10" />
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#5A1E65] text-white text-[9px] font-black uppercase">
                            Cover
                          </span>
                        )}
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCropIndex(idx)}
                            className="p-1 rounded-lg bg-slate-900/85 text-white hover:bg-[#5A1E65] cursor-pointer"
                            title="Crop to fit 16:9 card banner"
                          >
                            <Crop className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 rounded-lg bg-rose-600 text-white opacity-90 hover:opacity-100 cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cropIndex !== null && uploadedImages[cropIndex] && (
                  <ImageCropperModal
                    imageSrc={uploadedImages[cropIndex]}
                    initialAspect="original"
                    onApply={async (croppedFile, previewUrl) => {
                      const targetIdx = cropIndex;
                      setCropIndex(null);
                      try {
                        const res = await optimizeImageFile(croppedFile || previewUrl, { maxWidth: 1200, maxHeight: 675, quality: 0.90 });
                        const nextUrl = typeof res === 'string' ? res : (res?.dataUrl || res?.url || previewUrl);
                        if (nextUrl) {
                          setUploadedImages((prev) => prev.map((item, i) => (i === targetIdx ? nextUrl : item)));
                        }
                      } catch {
                        if (previewUrl) {
                          setUploadedImages((prev) => prev.map((item, i) => (i === targetIdx ? previewUrl : item)));
                        }
                      }
                    }}
                    onCancel={() => setCropIndex(null)}
                  />
                )}
              </div>

              {/* Affirming Pledge Consent */}
              <div className="flex items-start gap-3 p-4 bg-purple-50/60 rounded-xl border border-purple-200">
                <input
                  id="consentPledge"
                  type="checkbox"
                  required
                  checked={Boolean(formData.termsConsent)}
                  onChange={(e) => setFormData({ ...formData, termsConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5A1E65] focus:ring-[#5A1E65]"
                />
                <label htmlFor="consentPledge" className="text-xs text-slate-700 leading-relaxed font-medium">
                  {schema?.consentText || (
                    <>
                      <strong>Community Affirming Pledge:</strong> I confirm this business adheres to strict non-discrimination, respects pronouns, provides a safe environment for all gender identities and expressions, and consents to DCVC staff verification under our <Link to="/privacy" className="text-[#5A1E65] font-bold underline hover:text-purple-900">Privacy Policy</Link>.
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
                  <span>{status === 'loading' ? 'Transmitting Listing...' : (schema?.submitLabel || 'Submit Business for Staff Approval')}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </section>

    </div>
  );
}

