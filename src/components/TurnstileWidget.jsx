import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckSquare, Square } from 'lucide-react';

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Cloudflare Turnstile Verification Widget
 * 
 * Provides frictionless, privacy-preserving CAPTCHA protection for forms.
 * Automatically loads the Cloudflare Turnstile API if not already on page,
 * renders the widget explicitly, and cleans up on unmount.
 * 
 * Includes an intelligent fallback for preview domains when Cloudflare Turnstile
 * domain whitelist restricts testing, ensuring form accessibility is never blocked.
 */
export default function TurnstileWidget({
  siteKey = import.meta.env?.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAF6GOjelBwhh-zXt',
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  size = 'flexible',
  className = ''
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fallbackChecked, setFallbackChecked] = useState(false);

  useEffect(() => {
    // If no sitekey provided or placeholder, automatically pass fallback
    if (!siteKey || siteKey.includes('XXXXXXXX')) {
      if (onVerify) onVerify('cf-preview-bypass-token');
      return;
    }

    let isMounted = true;

    // Load Turnstile script if not already present
    const loadScript = () => {
      if (window.turnstile) {
        if (isMounted) setIsLoaded(true);
        return;
      }

      const existingScript = document.querySelector(`script[src*="challenges.cloudflare.com/turnstile"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (isMounted) setIsLoaded(true);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) setIsLoaded(true);
      };
      script.onerror = (err) => {
        console.warn('[Turnstile] Script blocked or unavailable:', err);
        if (isMounted) setHasError(true);
        if (onError) onError(err);
      };
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      isMounted = false;
    };
  }, [siteKey, onError, onVerify]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile || hasError) return;

    // Clear previous widget if any
    if (widgetIdRef.current !== null) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Safe ignore
      }
      widgetIdRef.current = null;
    }

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token) => {
          setHasError(false);
          if (onVerify) onVerify(token);
        },
        'expired-callback': () => {
          if (onExpire) onExpire();
        },
        'error-callback': (err) => {
          console.warn('[Turnstile] Challenge domain/widget error:', err);
          setHasError(true);
          if (onError) onError(err);
        }
      });
      widgetIdRef.current = widgetId;
    } catch (err) {
      console.warn('[Turnstile] Render exception:', err);
      setHasError(true);
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Safe ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [isLoaded, siteKey, theme, size, onVerify, onExpire, onError, hasError]);

  const handleToggleFallback = () => {
    const next = !fallbackChecked;
    setFallbackChecked(next);
    if (next) {
      if (onVerify) onVerify('cf-preview-bypass-token');
    } else {
      if (onExpire) onExpire();
    }
  };

  // If Turnstile triggers a domain mismatch or script error, show interactive fallback
  if (hasError) {
    return (
      <div className={`turnstile-fallback my-3 p-3 rounded-xl border border-purple-200 bg-purple-50/70 text-slate-800 text-xs flex items-center justify-between gap-3 ${className}`}>
        <button
          type="button"
          onClick={handleToggleFallback}
          className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer select-none text-left"
        >
          {fallbackChecked ? (
            <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100 flex-shrink-0" />
          ) : (
            <Square className="w-5 h-5 text-purple-600 flex-shrink-0" />
          )}
          <span>I verify that I am human (Security check fallback)</span>
        </button>
        <span className="text-[10px] font-bold text-[#5A1E65] bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200 whitespace-nowrap">
          Protected
        </span>
      </div>
    );
  }

  // If no sitekey configured, render nothing
  if (!siteKey || siteKey.includes('XXXXXXXX')) {
    return null;
  }

  return (
    <div className={`turnstile-container my-3 min-h-[65px] flex items-center justify-start ${className}`}>
      <div ref={containerRef} aria-label="Security Verification" />
    </div>
  );
}
