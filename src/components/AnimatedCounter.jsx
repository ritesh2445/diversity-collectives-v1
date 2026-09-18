import React, { useEffect, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function AnimatedCounter({ value, duration = 1600 }) {
  const [ref, isVisible] = useScrollReveal({ threshold: 0.2 });
  const [displayValue, setDisplayValue] = useState(0);

  // Parse numeric part and prefix/suffix (e.g. "5,000+" -> number: 5000, suffix: "+")
  const numericMatch = value.replace(/,/g, '').match(/\d+/);
  const targetNumber = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  const suffix = value.includes('+') ? '+' : value.includes('%') ? '%' : '';
  const hasComma = value.includes(',');

  useEffect(() => {
    if (!isVisible || targetNumber === 0) return;

    let startTime = null;
    let animationFrameId;

    const easeOutExpo = (x) => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    };

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentVal = Math.floor(easeOutExpo(progress) * targetNumber);

      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetNumber);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible, targetNumber, duration]);

  const formattedValue = hasComma 
    ? displayValue.toLocaleString() 
    : displayValue;

  return (
    <span ref={ref} className="tabular-nums">
      {isVisible ? `${formattedValue}${suffix}` : `0${suffix}`}
    </span>
  );
}
