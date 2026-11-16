import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { initLiveSiteSync, applySiteThemeToDOM } from './services/liveSync';
import { forceResetScrollLock } from './utils/scrollLock';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SmoothScroll from './components/SmoothScroll';
import ScrollProgress from './components/ScrollProgress';
import WelcomeCurtain from './components/WelcomeCurtain';
import AutoBroadcastPopup from './components/AutoBroadcastPopup';
import SiteStatusOverlay from './components/SiteStatusOverlay.jsx';

import SkipNavigation from './components/accessibility/SkipNavigation';
import ReciteToolbar from './components/accessibility/ReciteToolbar';
import ReciteReadingAids from './components/accessibility/ReciteReadingAids';
import ReciteLauncher from './components/accessibility/ReciteLauncher';

// Eagerly loaded for instantaneous LCP first paint & 100% zero-failure compliance routes
import Home from './pages/Home';
import LegalPrivacy from './pages/LegalPrivacy';
import TermsAndConditions from './pages/TermsAndConditions';

/**
 * Resilient lazy loader that retries dynamic imports if interrupted by Vite HMR recompilation,
 * chunk invalidations, or transient network drops.
 */
function lazyWithRetry(factory) {
  return lazy(() =>
    factory().catch(async (err) => {
      // 1. Retry once after 250ms to allow bundler module transformation to finish
      await new Promise(r => setTimeout(r, 250));
      return factory().catch((retryErr) => {
        // 2. Check if this is a chunk or dynamic import failure
        const isDynamicImportError =
          retryErr?.message?.includes('dynamically imported module') ||
          retryErr?.message?.includes('Loading chunk') ||
          retryErr?.name === 'ChunkLoadError';

        if (isDynamicImportError && typeof window !== 'undefined') {
          const key = 'chunk_reload_' + window.location.pathname;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, 'true');
            window.location.reload();
            return new Promise(() => {}); // never resolves, page is reloading
          }
        }
        throw retryErr;
      });
    })
  );
}

// Lazily loaded route components with automatic retry
const About = lazyWithRetry(() => import('./pages/About'));
const BoardAndStaff = lazyWithRetry(() => import('./pages/BoardAndStaff'));
const BoardMemberProfile = lazyWithRetry(() => import('./pages/BoardMemberProfile'));
const Sponsors = lazyWithRetry(() => import('./pages/Sponsors'));
const Programs = lazyWithRetry(() => import('./pages/Programs'));
const ProgramDetail = lazyWithRetry(() => import('./pages/ProgramDetail'));
const Community = lazyWithRetry(() => import('./pages/Community'));
const Events = lazyWithRetry(() => import('./pages/Events'));
const EventDetail = lazyWithRetry(() => import('./pages/EventDetail'));

// Training Catalog & Booking
const Training = lazyWithRetry(() => import('./pages/Training'));
const TrainingDetail = lazyWithRetry(() => import('./pages/TrainingDetail'));
const TrainingBooking = lazyWithRetry(() => import('./pages/TrainingBooking'));

// Business Directory
const Directory = lazyWithRetry(() => import('./pages/Directory'));
const DirectoryProfile = lazyWithRetry(() => import('./pages/DirectoryProfile'));
const DirectorySubmit = lazyWithRetry(() => import('./pages/DirectorySubmit'));

// Content & Community
const News = lazyWithRetry(() => import('./pages/News'));
const NewsArticle = lazyWithRetry(() => import('./pages/NewsArticle'));
const Gallery = lazyWithRetry(() => import('./pages/Gallery'));
const Resources = lazyWithRetry(() => import('./pages/Resources'));

// Engagement & Giving
const GetInvolved = lazyWithRetry(() => import('./pages/GetInvolved'));
const Volunteer = lazyWithRetry(() => import('./pages/Volunteer'));
const Donate = lazyWithRetry(() => import('./pages/Donate'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const AppreciationCard = lazyWithRetry(() => import('./pages/AppreciationCard'));
import AskDcvcChatbot from './components/AskDcvcChatbot';

// Legal, Accessibility & Utility
const AccessibilityStatement = lazyWithRetry(() => import('./pages/AccessibilityStatement'));
const AccessibilityFeedback = lazyWithRetry(() => import('./pages/AccessibilityFeedback'));
const SubmissionSuccess = lazyWithRetry(() => import('./pages/SubmissionSuccess'));
const SubmissionError = lazyWithRetry(() => import('./pages/SubmissionError'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const Admin = lazyWithRetry(() => import('./pages/Admin'));
const AppointmentBooking = lazyWithRetry(() => import('./pages/AppointmentBooking'));
const ResourceSubmit = lazyWithRetry(() => import('./pages/ResourceSubmit'));
import GeneralError, { ErrorBoundary } from './pages/GeneralError';

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAppreciationFullScreen = location.pathname.startsWith('/appreciation-card');
  const [siteStatus, setSiteStatus] = useState(null);

  useEffect(() => {
    return initLiveSiteSync({ onThemeApply: applySiteThemeToDOM });
  }, []);

  // Guarantee all scroll locks are cleared upon route transitions
  useEffect(() => {
    forceResetScrollLock();
  }, [location.pathname]);

  // Read initial site status from localStorage
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('dcvc_site_status');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSiteStatus(parsed);
      }
    } catch { }
  }, []);

  // Listen for live site status updates
  useEffect(() => {
    const handleStatusChange = (e) => {
      if (e?.detail) {
        setSiteStatus(e.detail);
      }
    };
    window.addEventListener('dcvc-site-status-changed', handleStatusChange);
    return () => window.removeEventListener('dcvc-site-status-changed', handleStatusChange);
  }, []);


  const isAdminPreview = location.search.includes('admin_preview=1');

  useEffect(() => {
    if (isAdminPreview) {
      document.documentElement.setAttribute('data-admin-preview', 'true');
      return () => document.documentElement.removeAttribute('data-admin-preview');
    }
  }, [isAdminPreview]);

  // If site is in non-live status, show full-screen overlay instead of normal content (except for admin route)
  if (!isAdminRoute && siteStatus && siteStatus.type !== 'live') {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
        <SiteStatusOverlay status={siteStatus} />
      </div>
    );
  }

  if (isAdminRoute) {
    return (
      <div className="admin-workspace bg-slate-50 text-slate-900 min-h-screen font-sans selection:bg-purple-600 selection:text-white">
        <ScrollToTop />
        <main id="main-content" tabIndex="-1" className="min-h-screen focus:outline-none">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-[#5A1E65]" role="status" aria-label="Loading Admin">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-purple-200 border-t-[#5A1E65] rounded-full animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">Loading DCVC Admin Suite...</span>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  if (isAppreciationFullScreen) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
        <ScrollToTop />
        <main id="main-content" tabIndex="-1" className="min-h-screen w-full focus:outline-none">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-[#5A1E65]" role="status">
              <div className="w-8 h-8 border-3 border-purple-200 border-t-[#5A1E65] rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/appreciation-card/:token" element={<AppreciationCard />} />
              <Route path="/appreciation-card/preview" element={<AppreciationCard />} />
              <Route path="*" element={<Navigate to="/appreciation-card/preview" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }


  if (isAdminPreview) {
    return (
      <div className="bg-transparent text-slate-900 min-h-screen flex flex-col font-sans selection:bg-[#5A1E65] selection:text-white w-full max-w-full overflow-x-clip" data-admin-preview="true">
        <Header />
        <main id="main-content" tabIndex="-1" className="editorial-main-content flex-grow focus:outline-none w-full max-w-full overflow-x-clip">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      {/* WCAG 2.4.1 Skip Navigation Links */}
      <SkipNavigation />

      {/* Native DCVC Accessibility Companion Suite (Instant 0ms Launch) */}
      <ReciteLauncher />
      <ReciteReadingAids />
      <ReciteToolbar />

      <WelcomeCurtain />
      <ScrollToTop />
      <ScrollProgress />
      <AskDcvcChatbot />
      <AutoBroadcastPopup />

      <div className="bg-transparent text-slate-900 min-h-screen flex flex-col font-sans selection:bg-[#5A1E65] selection:text-white w-full max-w-full overflow-x-clip">
        <Header />

        <main id="main-content" tabIndex="-1" className="editorial-main-content flex-grow focus:outline-none w-full max-w-full overflow-x-clip">
          <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center bg-slate-50/50" role="status" aria-label="Loading page">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-purple-200 border-t-[#5A1E65] rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Loading Diversity Collective...</span>
              </div>
            </div>
          }>
            <Routes>
              {/* Home & About */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/board-and-staff" element={<BoardAndStaff />} />
              <Route path="/board-and-staff/:slug" element={<BoardMemberProfile />} />
              <Route path="/board/:slug" element={<BoardMemberProfile />} />
              <Route path="/sponsors" element={<Sponsors />} />

              {/* Programs & Community */}
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:slug" element={<ProgramDetail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/submit" element={<ResourceSubmit />} />
              <Route path="/appointments" element={<AppointmentBooking />} />

              {/* Events */}
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />

              {/* Training Catalog & Booking */}
              <Route path="/training" element={<Training />} />
              <Route path="/training/:slug" element={<TrainingDetail />} />
              <Route path="/training/:slug/book" element={<TrainingBooking />} />
              <Route path="/training/book" element={<TrainingBooking />} />

              {/* Affirming Business Directory */}
              <Route path="/directory" element={<Directory />} />
              <Route path="/directory/submit" element={<DirectorySubmit />} />
              <Route path="/directory/:slug" element={<DirectoryProfile />} />

              {/* News & Stories */}
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsArticle />} />

              {/* Visual Gallery */}
              <Route path="/gallery" element={<Gallery />} />

              {/* Engagement & Action */}
              <Route path="/get-involved" element={<GetInvolved />} />
              <Route path="/volunteer" element={<Volunteer />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/appreciation-card" element={<AppreciationCard />} />
              <Route path="/appreciation-card/:token" element={<AppreciationCard />} />
              <Route path="/appreciation-card/preview" element={<AppreciationCard />} />

              {/* Accessibility & Reporting */}
              <Route path="/accessibility" element={<AccessibilityStatement />} />
              <Route path="/accessibility-feedback" element={<AccessibilityFeedback />} />

              {/* Legal & Compliance */}
              <Route path="/privacy" element={<LegalPrivacy />} />
              <Route path="/terms" element={<TermsAndConditions />} />

              {/* Utility & Feedback Pathways */}
              <Route path="/submission-success" element={<SubmissionSuccess />} />
              <Route path="/submission-error" element={<SubmissionError />} />
              <Route path="/error" element={<GeneralError />} />

              {/* Canonical Legacy URL In-App Route Resolutions (Never redirect to external websites) */}
              <Route path="/crc-resources" element={<Navigate to="/resources" replace />} />
              <Route path="/services" element={<Navigate to="/programs" replace />} />
              <Route path="/services/youth-services" element={<Navigate to="/programs/rainbow-umbrella" replace />} />
              <Route path="/services/gsa-resources" element={<Navigate to="/resources" replace />} />
              <Route path="/youth-programs" element={<Navigate to="/programs" replace />} />
              <Route path="/adult-programs" element={<Navigate to="/community" replace />} />
              <Route path="/virtual-vendors" element={<Navigate to="/directory" replace />} />
              <Route path="/pride-vendor" element={<Navigate to="/directory" replace />} />
              <Route path="/sponsor" element={<Navigate to="/sponsors" replace />} />
              <Route path="/venturapride" element={<Navigate to="/events" replace />} />
              <Route path="/dcvc-events" element={<Navigate to="/events" replace />} />
              <Route path="/shines" element={<Navigate to="/programs/diversity-shines" replace />} />
              <Route path="/rainbow-umbrella" element={<Navigate to="/programs/rainbow-umbrella" replace />} />
              <Route path="/schedule-your-appointment" element={<Navigate to="/appointments" replace />} />
              <Route path="/accessibility-statement" element={<Navigate to="/accessibility" replace />} />
              <Route path="/accessibility-statement/*" element={<Navigate to="/accessibility" replace />} />
              <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
              <Route path="/privacy-policy/*" element={<Navigate to="/privacy" replace />} />
              <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
              <Route path="/terms-and-conditions/*" element={<Navigate to="/terms" replace />} />

              {/* Custom 404 Not Found Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SmoothScroll>
        <Router>
          <AppLayout />
        </Router>
      </SmoothScroll>
    </ErrorBoundary>
  );
}
