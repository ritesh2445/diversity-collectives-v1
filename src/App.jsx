import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SmoothScroll from './components/SmoothScroll';
import ScrollProgress from './components/ScrollProgress';
import WelcomeCurtain from './components/WelcomeCurtain';

import SkipNavigation from './components/accessibility/SkipNavigation';
import ReciteToolbar from './components/accessibility/ReciteToolbar';
import ReciteReadingAids from './components/accessibility/ReciteReadingAids';

// Eagerly loaded for instantaneous LCP first paint
import Home from './pages/Home';

// Lazily loaded route components for optimal code splitting & sub-500kB chunks
const About = lazy(() => import('./pages/About'));
const BoardAndStaff = lazy(() => import('./pages/BoardAndStaff'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const Programs = lazy(() => import('./pages/Programs'));
const ProgramDetail = lazy(() => import('./pages/ProgramDetail'));
const Community = lazy(() => import('./pages/Community'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));

// Training Catalog & Booking
const Training = lazy(() => import('./pages/Training'));
const TrainingDetail = lazy(() => import('./pages/TrainingDetail'));
const TrainingBooking = lazy(() => import('./pages/TrainingBooking'));

// Business Directory
const Directory = lazy(() => import('./pages/Directory'));
const DirectoryProfile = lazy(() => import('./pages/DirectoryProfile'));
const DirectorySubmit = lazy(() => import('./pages/DirectorySubmit'));

// Content & Community
const News = lazy(() => import('./pages/News'));
const NewsArticle = lazy(() => import('./pages/NewsArticle'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Resources = lazy(() => import('./pages/Resources'));

// Engagement & Giving
const GetInvolved = lazy(() => import('./pages/GetInvolved'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const Donate = lazy(() => import('./pages/Donate'));
const Contact = lazy(() => import('./pages/Contact'));
const AppreciationCard = lazy(() => import('./pages/AppreciationCard'));
import AskDcvcChatbot from './components/AskDcvcChatbot';

// Legal, Accessibility & Utility
const AccessibilityStatement = lazy(() => import('./pages/AccessibilityStatement'));
const AccessibilityFeedback = lazy(() => import('./pages/AccessibilityFeedback'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const SubmissionSuccess = lazy(() => import('./pages/SubmissionSuccess'));
const SubmissionError = lazy(() => import('./pages/SubmissionError'));
const NotFound = lazy(() => import('./pages/NotFound'));
import GeneralError, { ErrorBoundary } from './pages/GeneralError';

export default function App() {
  return (
    <ErrorBoundary>
      <SmoothScroll>
        <Router>
          {/* WCAG 2.4.1 Skip Navigation Links */}
          <SkipNavigation />

          {/* Native DCVC Accessibility Companion Suite (Instant 0ms Launch) */}
          <ReciteReadingAids />
          <ReciteToolbar />

          <WelcomeCurtain />
          <ScrollToTop />
          <ScrollProgress />
          <AskDcvcChatbot />
          
          <div className="bg-transparent text-slate-900 min-h-screen flex flex-col font-sans selection:bg-[#5A1E65] selection:text-white">
            <Header />
          
            <main id="main-content" tabIndex="-1" className="editorial-main-content flex-grow focus:outline-none">
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
                <Route path="/sponsors" element={<Sponsors />} />

                {/* Programs & Community */}
                <Route path="/programs" element={<Programs />} />
                <Route path="/programs/:slug" element={<ProgramDetail />} />
                <Route path="/community" element={<Community />} />
                <Route path="/resources" element={<Resources />} />

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
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />

                {/* Utility & Feedback Pathways */}
                <Route path="/submission-success" element={<SubmissionSuccess />} />
                <Route path="/submission-error" element={<SubmissionError />} />
                <Route path="/error" element={<GeneralError />} />

                {/* Custom 404 Not Found Catch-All */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>

            <Footer />
          </div>
        </Router>
      </SmoothScroll>
    </ErrorBoundary>
  );
}
