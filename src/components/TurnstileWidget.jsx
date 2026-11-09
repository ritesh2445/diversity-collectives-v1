import React, { useEffect, useRef, useState } from 'react';

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Cloudflare Turnstile Verification Widget
 * 
 * Provides frictionless, privacy-preserving CAPTCHA protection for forms.
 * Automatically loads the Cloudflare Turnstile API if not already on page,
 * renders the widget explicitly, and cleans up on unmount.
 * 
 * @param {Object} props
 * @param {string} [props.siteKey] - Public Turnstile site key (defaults to import.meta.env.VITE_TURNSTILE_SITE_KEY)
 * @param {(token: string) => void} props.onVerify - Callback fired when verification succeeds with token
 * @param {() => void} [props.onExpire] - Callback fired when token expires
 * @param {() => void} [props.onError] - Callback fired if challenge fails
 * @param {'auto' | 'light' | 'dark'} [props.theme='auto'] - Visual color scheme
 * @param {'normal' | 'compact' | 'flexible'} [props.size='flexible'] - Dimensions
 * @param {string} [props.className] - Additional styling classes
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

  useEffect(() => {
    // If no sitekey provided or placeholder, skip rendering
    if (!siteKey || siteKey.includes('XXXXXXXX')) {
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
        console.error('Failed to load Cloudflare Turnstile script', err);
        if (onError) onError(err);
      };
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      isMounted = false;
    };
  }, [siteKey, onError]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) return;

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
          if (onVerify) onVerify(token);
        },
        'expired-callback': () => {
          if (onExpire) onExpire();
        },
        'error-callback': (err) => {
          console.warn('[Turnstile] Challenge error:', err);
          if (onError) onError(err);
        }
      });
      widgetIdRef.current = widgetId;
    } catch (err) {
      console.error('[Turnstile] Render failed:', err);
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
  }, [isLoaded, siteKey, theme, size, onVerify, onExpire, onError]);

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

