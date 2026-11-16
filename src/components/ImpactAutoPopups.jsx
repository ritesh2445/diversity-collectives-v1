import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { translationService } from '../services/translationService';

/**
 * Section #1: Auto-sliding quick pop-ups displaying complete impact highlight sentences.
 * Clickable and redirectable to corresponding program, testing, or donation resources for all devices!
 * Strictly height-constrained (52px on mobile / 48px on desktop) so height never shifts.
 * Mobile: Automated right-to-left rolling strip so users can read full sentences.
 * Desktop: Centered clickable rotating impact highlights.
 * Fully reactive to live language changes (synchronously re-renders in < 1ms).
 */
export default function ImpactAutoPopups({ props = {}, style = {} }) {
  const [currentLang, setCurrentLang] = useState(() => translationService.getLanguage());

  useEffect(() => {
    return translationService.subscribe((lang) => {
      setCurrentLang(lang);
    });
  }, []);

  const items = [
    {
      num: props.stat1Number || '10+',
      sentence: props.stat1Label || translationService.t('impact_stat1', 'years serving and advocating for Ventura County’s LGBTQ+ community.'),
      link: '/about'
    },
    {
      num: props.stat2Number || '5,000+',
      sentence: props.stat2Label || translationService.t('impact_stat2', 'free, confidential HIV & STI screenings delivered through Diversity SHINES.'),
      link: '/appointments'
    },
    {
      num: props.stat3Number || '1,200+',
      sentence: props.stat3Label || translationService.t('impact_stat3', 'LGBTQ+ youth empowered through Rainbow Umbrella peer circles & Pride Prom.'),
      link: '/programs/rainbow-umbrella'
    },
    {
      num: props.stat4Number || '100%',
      sentence: props.stat4Label || translationService.t('impact_stat4', 'free and confidential care—no insurance or fees ever required.'),
      link: '/donate'
    },
    {
      num: props.stat5Number || '10',
      sentence: props.stat5Label || translationService.t('impact_stat5', 'Ventura County cities united through affirming programs and mutual aid.'),
      link: '/community'
    }
  ].filter((x) => x.num || x.sentence);

  const [activeIdx, setActiveIdx] = useState(0);
  const intervalMs = Math.max(2200, Number(props.intervalMs || 3800));

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, intervalMs]);

  const current = items[activeIdx % items.length] || items[0];

  return (
    <section
      style={style}
      aria-label="Impact Highlights"
      className="bg-gradient-to-r from-[#3B0F44] via-[#5A1E65] to-indigo-900 text-white border-b border-purple-400/25 h-[52px] sm:h-[48px] min-h-[52px] sm:min-h-[48px] max-h-[52px] sm:max-h-[48px] px-0 sm:px-6 relative overflow-hidden flex items-center justify-center"
    >
      <style>{`
        @keyframes impactRollRtl {
          0% {
            transform: translate3d(0%, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .impact-roll-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: impactRollRtl 30s linear infinite;
          will-change: transform;
        }
        .impact-roll-wrap:hover .impact-roll-track,
        .impact-roll-wrap:focus-within .impact-roll-track,
        .impact-roll-track:active {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .impact-roll-track {
            animation: none;
            overflow-x: auto;
          }
        }
      `}</style>

      {/* DESKTOP & TABLET VIEW (sm and above): Clickable rotating impact banner */}
      <div className="hidden sm:flex container-clean items-center justify-center w-full h-full overflow-hidden">
        <Link
          to={current.link}
          data-no-autofit="true"
          className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-3 py-1.5 w-full max-w-full overflow-hidden text-center hover:opacity-95 transition-all duration-300 cursor-pointer"
          title={`Click to explore: ${current.sentence}`}
          aria-label={`Impact highlight: ${current.num} ${current.sentence}. Click to explore.`}
        >
          <span className="flex items-center gap-1.5 text-amber-300 font-extrabold text-xs sm:text-sm tracking-wide shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{current.num}</span>
          </span>

          <span className="text-white/95 text-xs sm:text-sm font-medium truncate max-w-[460px] md:max-w-[620px] lg:max-w-[780px]">
            {current.sentence}
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-300 group-hover:underline shrink-0 ml-1">
            <span>{translationService.t('impact_explore', 'Explore')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>

      {/* MOBILE VIEW (< sm): Clickable automated right-to-left rolling strip so users can read full sentences */}
      <div className="sm:hidden impact-roll-wrap w-full h-full relative overflow-hidden flex items-center">
        {/* Soft edge gradient fades */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#3B0F44] to-transparent z-10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-indigo-900 to-transparent z-10"
          aria-hidden="true"
        />

        <div className="impact-roll-track">
          {[0, 1].map((dupIndex) => {
            const isDuplicate = dupIndex === 1;
            return (
              <div
                key={dupIndex}
                aria-hidden={isDuplicate ? 'true' : undefined}
                className="flex items-center shrink-0"
              >
                {items.map((item, idx) => (
                  <Link
                    key={`${dupIndex}-${idx}`}
                    to={item.link}
                    tabIndex={isDuplicate ? -1 : 0}
                    className="inline-flex items-center gap-2 mx-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer shrink-0 border border-purple-300/20"
                    aria-label={`Impact highlight: ${item.num} ${item.sentence}. Click to view.`}
                  >
                    <span className="flex items-center gap-1 text-amber-300 font-extrabold text-xs shrink-0">
                      <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>{item.num}</span>
                    </span>

                    <span className="text-white text-xs font-medium whitespace-nowrap">
                      {item.sentence}
                    </span>

                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-300 shrink-0">
                      <span>{translationService.t('impact_explore', 'Explore')}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
