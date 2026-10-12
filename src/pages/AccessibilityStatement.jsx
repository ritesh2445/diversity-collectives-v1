import React, { useEffect } from 'react';
import { 
  ShieldCheck, 
  HelpCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Sliders, 
  Eye, 
  Keyboard, 
  Volume2 
} from 'lucide-react';
import { orgInfo } from '../data/dcvcData';

export default function AccessibilityStatement() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-white text-slate-800">
      
      {/* Header Banner */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-20 right-10 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />
        
        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#5A1E65] text-xs font-bold w-fit shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#5A1E65]" aria-hidden="true" />
            <span>ACCESSIBILITY COMMITMENT & DISCLOSURES</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
            Accessibility <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Statement & Standards</span>
          </h1>

          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Diversity Collective Ventura County is committed to ensuring digital accessibility, equitable access, and welcoming virtual spaces for everyone in our LGBTQ+ and allied community.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container-clean py-14 max-w-4xl space-y-12">
        
        {/* Conformance Status */}
        <div className="p-8 rounded-3xl bg-purple-50/60 border border-purple-200 space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-[#5A1E65] text-white rounded-xl">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-950">Conformance Status</h2>
              <p className="text-xs text-[#5A1E65] font-bold tracking-wide uppercase">Target: WCAG 2.2 Level AA Standard</p>
            </div>
          </div>
          <p className="text-slate-700 leading-relaxed text-base">
            The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for individuals with disabilities. Diversity Collective Ventura County targets <strong>WCAG 2.2 Level AA</strong> conformance, with select Level AAA enhancements (such as contrast ratios exceeding 7:1, custom color overrides, dyslexia-friendly typography, and real-time contrast ratio auditing).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white rounded-xl border border-purple-200">
              <span className="font-bold text-slate-900 block">Zero Third-Party Overlays</span>
              <span className="text-slate-500">100% native in-house code without tracking widgets or privacy leaks.</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-purple-200">
              <span className="font-bold text-slate-900 block">Pre-Paint Anti-FOUC</span>
              <span className="text-slate-500">Instant hydration before first paint; zero flashing or layout jumps.</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-purple-200">
              <span className="font-bold text-slate-900 block">Cross-Tab Synchronization</span>
              <span className="text-slate-500">Preferences persist across sessions and propagate immediately across browser tabs.</span>
            </div>
          </div>
        </div>

        {/* Implemented Accessibility Features */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-black text-slate-950">
            Measures Implemented to Support Accessibility
          </h2>
          <p className="text-slate-700 leading-relaxed">
            Diversity Collective takes the following measures across this digital sanctuary:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#5A1E65]">
                <Sliders className="w-5 h-5" aria-hidden="true" />
                <h3 className="font-bold text-base text-slate-900">Customizable Text & Reading</h3>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>Dynamic font-size scaling up to 200% without layout breakage</li>
                <li>Full WCAG 1.4.12 text spacing control (line-height, letter, word spacing)</li>
                <li>Dyslexia-friendly high-legibility font toggle</li>
                <li>Reading guide ruler and reading focus mask</li>
                <li>Link and heading prominence highlights</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#5A1E65]">
                <Eye className="w-5 h-5" aria-hidden="true" />
                <h3 className="font-bold text-base text-slate-900">Color & Contrast Support</h3>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>High contrast (yellow/black), dark, light, inverted, and monochrome modes</li>
                <li>Calibrated SVG filters for Protanopia, Deuteranopia, and Tritanopia</li>
                <li>Custom palette picker with live mathematical contrast ratio validation</li>
                <li>Images dimming toggle with semantic alt-text retention</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#5A1E65]">
                <Keyboard className="w-5 h-5" aria-hidden="true" />
                <h3 className="font-bold text-base text-slate-900">Keyboard & Motion Controls</h3>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>Skip to main content, skip to navigation, and skip to footer links</li>
                <li>Automatic respect for OS <code className="bg-slate-100 px-1 rounded">prefers-reduced-motion</code></li>
                <li>One-click "Pause Animations" button freezing all transitions and carousels</li>
                <li>Enhanced 4px visible focus rings with strict 3:1+ contrast against all backgrounds</li>
                <li>Strict modal focus trapping with <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded">Esc</kbd> closure</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#5A1E65]">
                <Volume2 className="w-5 h-5" aria-hidden="true" />
                <h3 className="font-bold text-base text-slate-900">Audio, Speech & Structure</h3>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>Built-in Web Speech API text-to-speech for full page and user selections</li>
                <li>Live DOM heading tree outline (<code className="bg-slate-100 px-1 rounded">H1</code> through <code className="bg-slate-100 px-1 rounded">H4</code>) for instant keyboard navigation</li>
                <li>Polite ARIA live region announcing all assistive state adjustments</li>
                <li>Experimental hands-free voice command navigation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Known Limitations and Alternatives */}
        <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
          <h2 className="font-display text-lg font-bold text-amber-950 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <span>Known Limitations & Alternative Access</span>
          </h2>
          <p className="text-xs text-amber-900 leading-relaxed">
            While we strive for comprehensive accessibility across all digital pages, certain historical or third-party elements may present limitations:
          </p>
          <ul className="text-xs text-amber-900 space-y-1.5 list-disc list-inside">
            <li><strong>Embedded Third-Party Maps:</strong> Google Maps iframes may present keyboard trapping challenges depending on browser settings; we provide plain text physical addresses alongside direct driving links.</li>
            <li><strong>Historical Event Flyers & PDF Archives:</strong> Older scanned graphic flyers may lack optical character recognition (OCR); our team is pleased to read any document aloud or provide plain text transcriptions upon request.</li>
            <li><strong>Third-Party Donor Portals:</strong> External secure payment gateways (Donorbox, PayPal) have their own interface controls outside our direct source code.</li>
          </ul>
        </div>

        {/* Feedback & Contact Information */}
        <div className="p-8 rounded-3xl bg-slate-950 text-white space-y-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              WE WELCOME YOUR FEEDBACK
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Need Assistance or Encountered a Barrier?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              We continually improve our website's accessibility based on community feedback. If you experience difficulty accessing any content, need assistance, or would like to request materials in an alternative format, please contact our team:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <a
              href={`tel:${orgInfo.phone.raw}`}
              className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors flex items-center gap-3"
            >
              <Phone className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <div>
                <span className="text-[11px] text-slate-400 block font-bold uppercase">Phone</span>
                <span className="text-xs font-bold text-white">{orgInfo.phone.display}</span>
              </div>
            </a>

            <a
              href={`mailto:${orgInfo.email.general}`}
              className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors flex items-center gap-3"
            >
              <Mail className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <div>
                <span className="text-[11px] text-slate-400 block font-bold uppercase">Email</span>
                <span className="text-xs font-bold text-white">{orgInfo.email.general}</span>
              </div>
            </a>

            <a
              href={orgInfo.address.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors flex items-center gap-3"
            >
              <MapPin className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <div>
                <span className="text-[11px] text-slate-400 block font-bold uppercase">Sanctuary</span>
                <span className="text-xs font-bold text-white">Ventura, CA 93003</span>
              </div>
            </a>
          </div>

          <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            Statement last updated: <strong>October 2026</strong>. Evaluated using automated tooling (axe DevTools, Lighthouse) and manual keyboard and screen reader verification.
          </p>
        </div>

      </section>

    </div>
  );
}
