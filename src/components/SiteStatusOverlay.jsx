import React, { useState, useEffect, useRef } from 'react';
import { useScrollLock } from '../utils/scrollLock';

const DCVC_SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com/diversitycollectivevc', icon: 'fb' },
  { label: 'Instagram', href: 'https://instagram.com/diversitycollectivevc', icon: 'ig' },
  { label: 'Twitter / X', href: 'https://twitter.com/diversityvc', icon: 'tw' },
  { label: 'Website', href: 'https://diversitycollective.org', icon: 'web' },
];

function SocialIcon({ icon, label, href }) {
  const paths = {
    fb: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    ig: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
    tw: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    web: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm flex items-center justify-center transition-all border border-white/25"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
        <path d={paths[icon]} />
      </svg>
    </a>
  );
}

function CountdownDisplay({ launchDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!launchDate) return;
    const target = new Date(launchDate).getTime();

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [launchDate]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex items-end gap-3 justify-center my-6">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map(({ value, label }, i) => (
        <React.Fragment key={label}>
          {i > 0 && (
            <span className="text-3xl font-black text-white/60 mb-4 leading-none">:</span>
          )}
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 px-4 py-3 min-w-[72px] text-center shadow-lg">
              <span className="text-5xl font-black font-mono text-white leading-none tabular-nums">
                {pad(value)}
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70 mt-1.5">
              {label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function SiteStatusOverlay({ status }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const quoteTimerRef = useRef(null);

  const type = status?.type || 'maintenance';
  const isMaintenance = type === 'maintenance';
  const isLaunchTimer = type === 'launch_timer';
  const isDown = type === 'down';
  const isCustomError = type === 'custom_error';
  useScrollLock(Boolean(status && type !== 'live'));

  const quotes = Array.isArray(status?.quotes) && status.quotes.length > 0
    ? status.quotes
    : [
        'We are making things better for our community. Please check back soon.',
        'Temporarily offline for improvements. Thank you for your patience.',
        'Upgrading our safe harbor for you. Back shortly.',
      ];

  // Rotating quotes with fade effect
  useEffect(() => {
    if (quotes.length <= 1) return;
    quoteTimerRef.current = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setQuoteVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(quoteTimerRef.current);
  }, [quotes.length]);

  if (!status || type === 'live') return null;

  const gradientBg = status?.useRainbowGradient !== false
    ? 'dcvc-rainbow-bg'
    : null;

  const customGradientStyle = !gradientBg && Array.isArray(status?.gradientColors) && status.gradientColors.length > 0
    ? {
        background: `linear-gradient(270deg, ${status.gradientColors.join(', ')})`,
        backgroundSize: '400% 400%',
        animation: 'dcvc-rainbow-bg 8s ease infinite',
      }
    : {};

  return (
    <div
      id="dcvc-site-status-overlay"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between text-white overflow-hidden ${gradientBg || ''}`}
      style={customGradientStyle}
      role="alertdialog"
      aria-live="assertive"
      aria-label="Site Status Notice"
    >
      {/* Soft radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/2 -left-1/2 w-[200vw] h-[200vw] rounded-full blur-[120px] opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)' }}
        />
      </div>

      {/* Top spacer */}
      <div className="flex-1" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 max-w-3xl w-full dcvc-fade-in-up">

        {/* Status badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[11px] font-black uppercase tracking-widest">
          {isLaunchTimer && (
            <span className="relative flex h-3 w-3">
              <span className="dcvc-pulse-ring absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
          )}
          {isMaintenance && <span>🔧</span>}
          {isDown && <span>⚠️</span>}
          {isCustomError && <span>🚨</span>}
          <span>
            {status.name || (isMaintenance ? 'Under Maintenance' : isLaunchTimer ? 'Launching Soon' : isDown ? 'Service Disruption' : 'Site Status')}
          </span>
        </div>

        {/* Logo (optional) */}
        {status?.logo && (
          <img src={status.logo} alt="DCVC Logo" className="w-20 h-20 object-contain mb-4 drop-shadow-lg" />
        )}

        {/* Launch countdown */}
        {isLaunchTimer && (status.launchDate || status.timerEnd) && (
          <div className="mb-2 dcvc-fade-in-up">
            <div className="text-[11px] font-black uppercase tracking-widest text-white/80 mb-1">
              Launching In
            </div>
            <CountdownDisplay launchDate={status.launchDate || status.timerEnd} />
          </div>
        )}

        {/* Main title */}
        <h1 className="dcvc-shimmer-text text-4xl sm:text-6xl font-black leading-tight mb-3 font-display">
          {status.title || status.message || (
            isMaintenance ? 'Under Maintenance' :
            isLaunchTimer ? 'Coming Soon' :
            isDown ? 'Service Unavailable' :
            isCustomError ? (status.errorCode ? `Error ${status.errorCode}` : 'Something Went Wrong') :
            'Site Status'
          )}
        </h1>

        {/* Subtitle / message */}
        {status.message && status.message !== status.title && (
          <p className="text-lg sm:text-xl text-white/85 font-semibold mb-4 max-w-xl leading-relaxed">
            {status.message}
          </p>
        )}

        {/* Rotating quotes (maintenance / launch) */}
        {(isMaintenance || isLaunchTimer) && quotes.length > 0 && (
          <div className="mt-4 mb-6 min-h-[3rem] flex items-center justify-center">
            <p
              className="text-lg sm:text-xl italic font-serif text-white/90 max-w-xl leading-relaxed transition-opacity duration-400"
              style={{ opacity: quoteVisible ? 1 : 0 }}
            >
              &ldquo;{quotes[quoteIndex]}&rdquo;
            </p>
          </div>
        )}

        {/* Maintenance "back soon" note */}
        {isMaintenance && (
          <p className="text-sm text-white/70 font-semibold tracking-wide mt-2">
            We appreciate your patience while we improve our services.
          </p>
        )}

        {/* Down variant */}
        {isDown && (
          <p className="text-sm text-white/75 font-semibold mt-2 max-w-md">
            {status.description || "We're experiencing issues and working to restore service. Please check back soon."}
          </p>
        )}

        {/* Custom error variant */}
        {isCustomError && (
          <div className="mt-2 flex flex-col items-center gap-3">
            {status.errorCode && (
              <div className="text-white/50 font-mono text-sm font-bold">
                Error Code: {status.errorCode}
              </div>
            )}
            {status.showRetry !== false && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 px-6 py-2.5 bg-white text-[#5A1E65] font-black text-sm rounded-xl hover:bg-white/90 transition-all shadow-lg"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom: social links */}
      <div className="relative z-10 w-full pb-8 pt-4 flex flex-col items-center gap-4">
        {status.showSocials !== false && (
          <div className="flex items-center gap-3">
            {DCVC_SOCIALS.map((s) => (
              <SocialIcon key={s.icon} {...s} />
            ))}
          </div>
        )}
        <p className="text-[11px] text-white/50 font-semibold tracking-widest uppercase">
          Diversity Collective Ventura County &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
