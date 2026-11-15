import React, { useState, useEffect, useRef } from 'react';
import { translationService } from '../../services/translationService';

/**
 * AutoFitText component
 * Dynamically scales text down to prevent overflowing outside button pills, cards, and badges
 * when text length expands (e.g. Spanish, German, Tagalog, Vietnamese).
 * 
 * Guarantees zero horizontal blowout and maintains rock-solid container geometry.
 */
export default function AutoFitText({
  children,
  text,
  className = '',
  maxChars = 22,
  as: Component = 'span'
}) {
  const containerRef = useRef(null);
  const [lang, setLang] = useState(() => translationService.getLanguage?.() || 'en');
  const [currentLength, setCurrentLength] = useState(() => {
    if (typeof text === 'string') return text.length;
    if (typeof children === 'string') return children.length;
    return 0;
  });

  // Subscribe to instant language switch
  useEffect(() => {
    return translationService.subscribe((newLang) => {
      setLang(newLang);
    });
  }, []);

  // Sync rendered text from DOM and watch for Google Translate direct DOM mutations
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const content = el.textContent || '';
      setCurrentLength(content.trim().length);
    };

    measure();

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        measure();
      });
      observer.observe(el, {
        childList: true,
        subtree: true,
        characterData: true
      });
      return () => observer.disconnect();
    }
  }, [children, text, lang]);

  // Determine dynamic font scaling based on character length
  let scaleClass = '';
  if (currentLength > 36) {
    scaleClass = 'text-[9.5px] leading-tight tracking-tight';
  } else if (currentLength > 26) {
    scaleClass = 'text-[11px] leading-tight tracking-tight';
  } else if (currentLength > 20) {
    scaleClass = 'text-xs leading-snug';
  } else {
    scaleClass = 'text-xs sm:text-sm leading-normal';
  }

  return (
    <Component
      ref={containerRef}
      className={`inline-block max-w-full break-words text-center overflow-hidden line-clamp-2 ${scaleClass} ${className}`}
      style={{
        overflowWrap: 'break-word',
        wordBreak: 'normal',
        whiteSpace: 'normal',
        textWrap: 'balance'
      }}
    >
      {children || text}
    </Component>
  );
}
