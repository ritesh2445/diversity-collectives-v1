import React, { useState, useEffect } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight <= 0) {
        setProgress(0);
        return;
      }
      const scrollPercent = (totalScroll / windowHeight) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-[3px] z-[999] pointer-events-none bg-transparent"
      aria-hidden="true"
    >
      <div 
        className="h-full bg-[#5A1E65] transition-all duration-75 ease-out shadow-[0_0_8px_rgba(90,30,101,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
