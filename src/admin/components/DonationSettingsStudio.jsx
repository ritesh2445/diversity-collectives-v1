import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Mail, 
  Sparkles, 
  Check, 
  Copy, 
  Send, 
  RefreshCw, 
  Eye, 
  Clock, 
  DollarSign, 
  Award, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  Plus,
  Search,
  X
} from 'lucide-react';
import { 
  getDonationEmailTemplate, 
  saveDonationEmailTemplate, 
  sendTestDonationEmail, 
  getRecentDonations, 
  resendDonorEmail,
  recordManualDonation,
  exportDataCsv
} from '../services/adminClient';

const AVAILABLE_VARIABLES = [
  { tag: '{{donor_name}}', label: "Donor Name", desc: "Donor's full name or 'Valued Friend' if anonymous" },
  { tag: '{{amount}}', label: "Amount", desc: "Formatted gift (e.g. $100.00)" },
  { tag: '{{frequency}}', label: "Frequency", desc: "Giving cadence (Monthly Sustainer or One-Time)" },
  { tag: '{{designation}}', label: "Designation", desc: "Designated program or fund (e.g. Diversity SHINES)" },
  { tag: '{{tier_name}}', label: "Tier Name", desc: "Appreciation tier unlocked (e.g. Rainbow Champion)" },
  { tag: '{{date}}', label: "Date", desc: "Donation date (e.g. November 14, 2026)" },
  { tag: '{{reference}}', label: "Reference ID", desc: "Receipt confirmation reference (e.g. DCVC-DON-9281)" },
  { tag: '{{card_url}}', label: "Keepsake Card URL", desc: "Link to unwrap digital Appreciation Card" },
  { tag: '{{ein}}', label: "Tax EIN", desc: "501(c)(3) Federal Tax ID number" }
];

export default function DonationSettingsStudio({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('template'); // 'template' | 'donations'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testEmail, setTestEmail] = useState(currentUser?.email || 'admin@diversitycollective.org');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Search & Filter state for donations table
  const [donorSearch, setDonorSearch] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);

  // Manual In-Person Donation Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    donorName: '',
    donorEmail: '',
    amount: '50',
    frequency: 'one-time',
    designation: 'General Fund',
    isAnonymous: false,
    sendEmail: true
  });
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualResult, setManualResult] = useState(null);

  // Template state
  const [template, setTemplate] = useState({
    subject: '',
    title: '',
    headline: 'With Heartfelt Thanks To',
    bodyText: 'We are deeply moved by your generous gift of {{amount}} ({{frequency}}). Your kindness powers our safe harbor for LGBTQ+ individuals and families across Ventura County. Every dollar directly funds free rapid health screenings, weekly youth peer circles, harm reduction supplies, and community advocacy.',
    recurringNote: 'Every single cycle your recurring gift arrives, you make someone smile a little brighter at our Ventura Community Resource Center! Because of you, youth peer circles have warm snacks and art supplies, neighbors find compassionate care without judgment, and our pride center shines year-round. Sending you the biggest collective hug and heartfelt thanks — thank you for walking beside us month after month! 🌈✨',
    taxNotice: 'Official Tax-Deductible Receipt: Diversity Collective Ventura County, Inc. is a registered 501(c)(3) public charity (Federal EIN: 46-1234567). No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.'
  });

  const [donations, setDonations] = useState([]);
  const [resendingId, setResendingId] = useState(null);
  const [resendStatus, setResendStatus] = useState({});
  const [focusedField, setFocusedField] = useState('bodyText');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tplRes, donRes] = await Promise.all([
        getDonationEmailTemplate(),
        getRecentDonations()
      ]);
      if (tplRes?.template) {
        setTemplate(prev => ({ ...prev, ...tplRes.template }));
      }
      if (donRes?.donations) {
        setDonations(donRes.donations);
      }
    } catch (err) {
      console.warn('Error loading donation studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveDonationEmailTemplate(template);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      alert('Failed to save template: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await sendTestDonationEmail(template, testEmail);
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const handleResend = async (donation) => {
    setResendingId(donation.id);
    try {
      const res = await resendDonorEmail(donation.id || donation.card_token);
      setResendStatus(prev => ({
        ...prev,
        [donation.id]: res.success ? 'Resent successfully!' : (res.error || 'Failed to resend')
      }));
      setTimeout(() => {
        setResendStatus(prev => ({ ...prev, [donation.id]: null }));
      }, 4000);
    } catch (err) {
      setResendStatus(prev => ({ ...prev, [donation.id]: err.message }));
    } finally {
      setResendingId(null);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await exportDataCsv('donations');
    } catch (err) {
      alert('Failed to export donations CSV: ' + err.message);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.amount || Number(manualForm.amount) < 1) {
      alert('Please enter a valid donation amount of at least $1.00');
      return;
    }
    setSubmittingManual(true);
    setManualResult(null);
    try {
      const res = await recordManualDonation({
        donorName: manualForm.donorName,
        donorEmail: manualForm.donorEmail,
        amount: Number(manualForm.amount),
        frequency: manualForm.frequency,
        designation: manualForm.designation,
        isAnonymous: manualForm.isAnonymous,
        sendEmail: manualForm.sendEmail
      });
      if (res.success) {
        setManualResult({ success: true, message: res.message, cardUrl: res.cardUrl });
        loadData();
        setTimeout(() => {
          setShowManualModal(false);
          setManualResult(null);
          setManualForm({
            donorName: '',
            donorEmail: '',
            amount: '50',
            frequency: 'one-time',
            designation: 'General Fund',
            isAnonymous: false,
            sendEmail: true
          });
        }, 3000);
      } else {
        setManualResult({ success: false, error: res.error || 'Failed to record donation' });
      }
    } catch (err) {
      setManualResult({ success: false, error: err.message });
    } finally {
      setSubmittingManual(false);
    }
  };

  const insertVariable = (tag) => {
    if (!focusedField) return;
    setTemplate(prev => {
      const currentVal = prev[focusedField] || '';
      return {
        ...prev,
        [focusedField]: currentVal + (currentVal.endsWith(' ') || currentVal === '' ? '' : ' ') + tag
      };
    });
  };

  // Compile live preview using sample donor values
  const sampleData = {
    donor_name: 'Jordan Vance',
    amount: '$100.00',
    frequency: 'Monthly Sustainer',
    frequency_label: 'Monthly Sustainer',
    designation: 'Diversity SHINES Healthcare & Testing',
    tier_name: 'Rainbow Champion',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    reference: 'DCVC-DON-92841',
    card_url: 'https://diversitycollectivevc.org/appreciation-card/preview',
    ein: '46-1234567'
  };

  const compilePreview = (text) => {
    if (!text) return '';
    return text
      .replace(/\{\{\s*donor_name\s*\}\}/gi, sampleData.donor_name)
      .replace(/\{\{\s*amount\s*\}\}/gi, sampleData.amount)
      .replace(/\{\{\s*frequency\s*\}\}/gi, sampleData.frequency)
      .replace(/\{\{\s*designation\s*\}\}/gi, sampleData.designation)
      .replace(/\{\{\s*tier_name\s*\}\}/gi, sampleData.tier_name)
      .replace(/\{\{\s*date\s*\}\}/gi, sampleData.date)
      .replace(/\{\{\s*reference\s*\}\}/gi, sampleData.reference)
      .replace(/\{\{\s*card_url\s*\}\}/gi, sampleData.card_url)
      .replace(/\{\{\s*ein\s*\}\}/gi, sampleData.ein);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Studio Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-[#5A1E65]">
              <Heart className="w-5 h-5 fill-current text-rose-500" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Donation Gateway & Automated Email Studio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Customize automated thank-you emails sent to donors after every gift. Dynamic placeholders like <code className="text-[#5A1E65] font-bold">{'{{donor_name}}'}</code> and <code className="text-[#5A1E65] font-bold">{'{{amount}}'}</code> are automatically filled with live donor details.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('template')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'template'
                ? 'bg-[#5A1E65] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Automated Email Template</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('donations')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'donations'
                ? 'bg-[#5A1E65] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Recent Contributions ({donations.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: AUTOMATED EMAIL TEMPLATE EDITOR                                 */}
      {/* ===================================================================== */}
      {activeSubTab === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Template Inputs & Placeholder Insertions */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            
            {/* Dynamic Placeholder Insertion Chips */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dynamic Donor Tags (Click to Insert)</span>
                </span>
                <span className="text-[11px] text-purple-700 font-medium">
                  Auto-populated on every donation
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map(v => (
                  <button
                    key={v.tag}
                    type="button"
                    title={v.desc}
                    translate="no"
                    onClick={() => insertVariable(v.tag)}
                    className="notranslate px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-white border border-purple-300 text-purple-900 hover:bg-[#5A1E65] hover:text-white hover:border-[#5A1E65] transition-all cursor-pointer shadow-2xs"
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Subject Line */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Email Subject Line
              </label>
              <input
                type="text"
                value={template.subject}
                onFocus={() => setFocusedField('subject')}
                onChange={e => setTemplate({ ...template, subject: e.target.value })}
                placeholder="Leave blank for automatic tier-based subject, or write custom subject e.g. Thank You, {{donor_name}}! 💜"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Default: <em>Your DCVC Appreciation Card has arrived! 💜 ({'{{tier_name}}'})</em>
              </p>
            </div>

            {/* Email Greeting / Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Email Greeting &amp; Salutation
              </label>
              <input
                type="text"
                value={template.title}
                onFocus={() => setFocusedField('title')}
                onChange={e => setTemplate({ ...template, title: e.target.value })}
                placeholder="e.g. Thank You, {{donor_name}}! or From Our Hearts to Yours, {{donor_name}}! 💜"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            {/* Main Thank-You Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Main Heartfelt Thank-You Message
                </label>
                <span className="text-[11px] text-slate-400">Supports paragraphs and line breaks</span>
              </div>
              <textarea
                rows={5}
                value={template.bodyText}
                onFocus={() => setFocusedField('bodyText')}
                onChange={e => setTemplate({ ...template, bodyText: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm leading-relaxed focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none resize-y"
              />
            </div>

            {/* Monthly Sustainer Note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌸 Monthly Sustainer Special Heartfelt Note</span>
                </label>
                <span className="text-[11px] text-purple-700">Appears on recurring donations</span>
              </div>
              <textarea
                rows={4}
                value={template.recurringNote}
                onFocus={() => setFocusedField('recurringNote')}
                onChange={e => setTemplate({ ...template, recurringNote: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-purple-50/30 text-sm leading-relaxed focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none resize-y"
              />
            </div>

            {/* 501(c)(3) Tax Disclosure Notice */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                501(c)(3) Non-Profit Tax Receipt Notice
              </label>
              <textarea
                rows={2}
                value={template.taxNotice}
                onFocus={() => setFocusedField('taxNotice')}
                onChange={e => setTemplate({ ...template, taxNotice: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-600 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none resize-y"
              />
            </div>

            {/* Save & Reset Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary py-3 px-6 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Template Saved!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Template</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset template to standard DCVC defaults?')) {
                    setTemplate({
                      subject: '',
                      title: '',
                      headline: 'With Heartfelt Thanks To',
                      bodyText: 'We are deeply moved by your generous gift of {{amount}} ({{frequency}}). Your kindness powers our safe harbor for LGBTQ+ individuals and families across Ventura County. Every dollar directly funds free rapid health screenings, weekly youth peer circles, harm reduction supplies, and community advocacy.',
                      recurringNote: 'Every single cycle your recurring gift arrives, you make someone smile a little brighter at our Ventura Community Resource Center! Because of you, youth peer circles have warm snacks and art supplies, neighbors find compassionate care without judgment, and our pride center shines year-round. Sending you the biggest collective hug and heartfelt thanks — thank you for walking beside us month after month! 🌈✨',
                      taxNotice: 'Official Tax-Deductible Receipt: Diversity Collective Ventura County, Inc. is a registered 501(c)(3) public charity (Federal EIN: 46-1234567). No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.'
                    });
                  }
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer"
              >
                Reset to Defaults
              </button>
            </div>

          </div>

          {/* Right: Real-Time Live Preview & Test Sender */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Interactive Email Preview */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Real-Time Email Preview</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Sample: $100 Monthly</span>
              </div>

              {/* Subject preview */}
              <div className="text-xs space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Subject Line:</span>
                <p className="font-semibold text-white bg-slate-800/80 p-2 rounded-lg font-sans text-xs">
                  {template.subject ? compilePreview(template.subject) : `Your Recurring Sustainer Appreciation Card & Heartfelt Thanks! 💜🌈 (Rainbow Champion)`}
                </p>
              </div>

              {/* Rendered Container */}
              <div className="bg-white text-slate-800 rounded-2xl p-5 space-y-4 text-xs shadow-inner">
                
                {/* Header Badge */}
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-purple-50 border border-purple-200 text-purple-900 rounded-full text-[10px] font-black uppercase tracking-wider">
                    CHAMPION CIRCLE • Rainbow Champion • 💜 Recurring Sustainer
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-black text-slate-950 text-center leading-tight">
                  {template.title ? compilePreview(template.title) : `From Our Hearts to Yours, ${sampleData.donor_name}! 💜`}
                </h3>

                {/* Body */}
                <p className="text-slate-700 leading-relaxed">
                  {compilePreview(template.bodyText)}
                </p>

                {/* Sustainer Note */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-purple-50 border border-pink-200 text-purple-950 text-[11px] leading-relaxed">
                  <strong className="block text-pink-700 font-bold mb-1">🌸 A Cute Heartfelt Note for Our Recurring Sustainer Family 💜</strong>
                  {compilePreview(template.recurringNote)}
                </div>

                {/* Keepsake Card Mock */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 text-center space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-purple-800">
                    Official 501(c)(3) Keepsake Card
                  </span>
                  <p className="font-serif font-black text-sm text-[#5A1E65]">
                    {sampleData.donor_name}
                  </p>
                  <p className="text-[10px] text-slate-500 italic">
                    "Fostering LGBTQ+ Youth Resiliency &amp; Safe Spaces"
                  </p>
                  <div className="pt-1">
                    <span className="inline-block px-3 py-1.5 rounded-lg bg-[#5A1E65] text-white font-bold text-[10px]">
                      Open &amp; Unwrap Your Interactive Card ✨
                    </span>
                  </div>
                </div>

                {/* Tax Disclosure */}
                <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 leading-relaxed">
                  <strong>Tax Notice:</strong> {compilePreview(template.taxNotice)}
                </p>

              </div>
            </div>

            {/* Test Email Dispatch Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#5A1E65]" />
                <h4 className="text-sm font-bold text-slate-900">
                  Send Test Preview Email
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Dispatches a live sample email to your verified address via Resend API so you can check layout and mobile rendering in your inbox.
              </p>

              <div className="space-y-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="admin@diversitycollective.org"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sendingTest || !testEmail}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {sendingTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Test Email</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span>{testResult.message || testResult.error}</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: RECENT CONTRIBUTIONS & DONORS LIST                              */}
      {/* ===================================================================== */}
      {activeSubTab === 'donations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Recent Donor Contributions &amp; Minted Cards
              </h3>
              <p className="text-xs text-slate-500">
                Every confirmed gift automatically generates a personalized keepsake card and emails the donor.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                  placeholder="Filter by donor, email, tier..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-slate-50/50"
                />
                {donorSearch && (
                  <button
                    type="button"
                    onClick={() => setDonorSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Record In-Person Contribution */}
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="py-2 px-3 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ In-Person Gift</span>
              </button>

              {/* Export Ledger CSV */}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Download CSV Spreadsheet of all contributions"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
              </button>

              {/* Refresh */}
              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {donations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Heart className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No donor contributions recorded yet.</p>
              <p className="text-xs text-slate-400">
                Test the integrated donation form at <a href="/donate" className="text-[#5A1E65] underline font-bold" target="_blank" rel="noreferrer">/donate</a> to see gifts appear here live!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">Donor</th>
                    <th className="pb-3">Gift Amount</th>
                    <th className="pb-3">Frequency</th>
                    <th className="pb-3">Tier Unlocked</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Card Link</th>
                    <th className="pb-3 pr-2 text-right">Email Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {donations
                    .filter((d) => {
                      if (!donorSearch) return true;
                      const q = donorSearch.toLowerCase();
                      return (
                        (d.donor_display_name || '').toLowerCase().includes(q) ||
                        (d.recipient_email || '').toLowerCase().includes(q) ||
                        (d.tier_name || '').toLowerCase().includes(q) ||
                        (d.payment_reference || '').toLowerCase().includes(q)
                      );
                    })
                    .map((d) => {
                    const formattedAmt = `$${((d.amount_cents || 0) / 100).toFixed(2)}`;
                    const isMonthly = (d.frequency || '').toLowerCase().includes('month');
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-2">
                          <span className="font-bold text-slate-900 block">{d.donor_display_name || 'Anonymous'}</span>
                          <span className="text-[11px] text-slate-400">{d.recipient_email || 'No email on file'}</span>
                        </td>
                        <td className="py-3.5 font-bold text-slate-950">
                          {formattedAmt}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isMonthly ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isMonthly ? 'Monthly Sustainer' : 'One-Time'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-semibold text-slate-800">{d.tier_name || 'Community Ally'}</span>
                        </td>
                        <td className="py-3.5 text-slate-500 whitespace-nowrap">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3.5">
                          <a
                            href={`/appreciation-card/${d.card_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-950 underline"
                          >
                            <span>Keepsake Card</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleResend(d)}
                            disabled={resendingId === d.id}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-[11px] font-bold text-purple-900 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {resendingId === d.id ? 'Sending...' : 'Resend Email'}
                          </button>
                          {resendStatus[d.id] && (
                            <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                              {resendStatus[d.id]}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual In-Person Gift Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-[#5A1E65]">
                  <Heart className="w-5 h-5 fill-current text-rose-500" />
                </span>
                <h3 className="font-display text-lg font-black text-slate-950">
                  Record Contribution (Offline / In-Person)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Donor Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Robin Martinez (leave blank for Anonymous)"
                  value={manualForm.donorName}
                  onChange={(e) => setManualForm({ ...manualForm, donorName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Donor Email Address</label>
                <input
                  type="email"
                  placeholder="donor@example.com (receives digital keepsake card & certificate)"
                  value={manualForm.donorEmail}
                  onChange={(e) => setManualForm({ ...manualForm, donorEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Frequency</label>
                  <select
                    value={manualForm.frequency}
                    onChange={(e) => setManualForm({ ...manualForm, frequency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 font-medium"
                  >
                    <option value="one-time">One-Time Gift</option>
                    <option value="monthly">Monthly Sustainer</option>
                    <option value="annual">Annual Sustainer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Designated Program / Fund</label>
                <select
                  value={manualForm.designation}
                  onChange={(e) => setManualForm({ ...manualForm, designation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 font-medium"
                >
                  <option value="General Fund">General Operating Sanctuary Fund</option>
                  <option value="Diversity SHINES">Diversity SHINES Free Healthcare & Rapid Testing</option>
                  <option value="Rainbow Umbrella">Rainbow Umbrella Youth & Teen Support Groups</option>
                  <option value="Ventura County Pride">Ventura County Pride Festival & Community Prom</option>
                  <option value="Youth Emergency Aid">Youth Emergency & Mutual Aid</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="manualSendEmail"
                  checked={manualForm.sendEmail}
                  onChange={(e) => setManualForm({ ...manualForm, sendEmail: e.target.checked })}
                  className="rounded text-[#5A1E65] focus:ring-purple-400"
                />
                <label htmlFor="manualSendEmail" className="text-slate-700 font-medium cursor-pointer">
                  Automatically dispatch personalized keepsake email &amp; digital certificate link
                </label>
              </div>

              {manualResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  manualResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {manualResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{manualResult.message || manualResult.error}</p>
                    {manualResult.cardUrl && (
                      <a href={manualResult.cardUrl} target="_blank" rel="noreferrer" className="text-[#5A1E65] underline font-bold mt-1 inline-block">
                        View Generated Keepsake Card &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {submittingManual ? 'Recording Gift...' : 'Record Gift & Mint Keepsake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
