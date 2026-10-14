import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SmoothScroll from './components/SmoothScroll';
import ScrollProgress from './components/ScrollProgress';
import WelcomeCurtain from './components/WelcomeCurtain';

import SkipNavigation from './components/accessibility/SkipNavigation';
import ReciteToolbar from './components/accessibility/ReciteToolbar';
import ReciteLauncher from './components/accessibility/ReciteLauncher';
import ReciteReadingAids from './components/accessibility/ReciteReadingAids';

import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import Community from './pages/Community';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Resources from './pages/Resources';
import GetInvolved from './pages/GetInvolved';
import Contact from './pages/Contact';
import AccessibilityStatement from './pages/AccessibilityStatement';

export default function App() {
  return (
    <SmoothScroll>
      <Router>
        {/* WCAG 2.4.1 Skip Navigation Links */}
        <SkipNavigation />

        {/* Recite Me Reading Aids: Horizontal Reading Ruler, Screen Mask Letterbox, Cursor Spotlight */}
        <ReciteReadingAids />

        {/* Recite Me Top Accessibility Ribbon Toolbar */}
        <ReciteToolbar />

        {/* Recite Me Floating Accessibility Launcher Button */}
        <ReciteLauncher />

        <WelcomeCurtain />
        <ScrollToTop />
        <ScrollProgress />
        
        <div className="bg-transparent text-slate-900 min-h-screen flex flex-col font-sans selection:bg-[#5A1E65] selection:text-white">
          <Header />
        
          <main id="main-content" tabIndex="-1" className="editorial-main-content flex-grow focus:outline-none">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:slug" element={<ProgramDetail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/get-involved" element={<GetInvolved />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/accessibility" element={<AccessibilityStatement />} />
              
              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </SmoothScroll>
  );
}
