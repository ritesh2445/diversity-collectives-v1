import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { translationService } from '../services/translationService';

/**
 * Section #1: Auto-sliding quick pop-ups displaying complete impact highlight sentences.
 * Clickable and redirectable to corresponding program, testing, or donation resources!
 * Strictly height-constrained (48px - 52px) on both mobile and laptop so height never shifts.
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
      className="bg-gradient-to-r from-[#3B0F44] via-[#5A1E65] to-indigo-900 text-white border-b border-purple-400/25 h-[52px] sm:h-[48px] min-h-[52px] sm:min-h-[48px] max-h-[52px] sm:max-h-[48px] px-3 sm:px-6 relative overflow-hidden flex items-center justify-center"
    >
      <div className="container-clean flex items-center justify-center gap-2 sm:gap-3 w-full h-full overflow-hidden">
        <Link
          to={current.link}
          className="group inline-flex items-center gap-2 sm:gap-3 px-2 py-1 max-w-full overflow-hidden text-center hover:opacity-90 transition-opacity"
        >
          <span className="flex items-center gap-1 text-amber-300 font-extrabold text-xs sm:text-sm tracking-wide shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{current.num}</span>
          </span>

          <span className="text-white/95 text-[11px] sm:text-xs font-medium truncate max-w-[210px] xs:max-w-[300px] sm:max-w-[460px] md:max-w-[620px]">
            {current.sentence}
          </span>

          <span className="hidden xs:inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-amber-300 group-hover:underline shrink-0">
            <span>{translationService.t('impact_explore', 'Explore')}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>
    </section>
  );
}
