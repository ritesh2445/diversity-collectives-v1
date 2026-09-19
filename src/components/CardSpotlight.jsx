import React, { useRef, useState, useCallback, useEffect } from 'react';

export default function CardSpotlight({ 
  children, 
  className = '', 
  contentClassName = '',
  spotlightColor = 'rgba(147, 51, 234, 0.12)',
  tilt = true,
  maxTilt = 7,
  scale = 1.018,
  glare = true
}) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(
      window.matchMedia('(hover: none)').matches || 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0
    );
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isTouchDevice || !divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPosition({ x, y });

    if (tilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotX = ((y - centerY) / centerY) * -maxTilt;
      const rotY = ((x - centerX) / centerX) * maxTilt;
      setRotation({ x: rotX, y: rotY });
    }
  }, [tilt, maxTilt, isTouchDevice]);

  const handleMouseEnter = () => {
    if (isTouchDevice) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const transformStyle = (!isTouchDevice && isHovered && tilt)
    ? `perspective(1000px) rotateX(${rotation.x.toFixed(2)}deg) rotateY(${rotation.y.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
    : 'none';

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transformStyle: isTouchDevice ? 'flat' : 'preserve-3d',
        transition: (!isTouchDevice && isHovered)
          ? 'transform 0.12s cubic-bezier(0.2, 0.8, 0.4, 1), box-shadow 0.25s ease' 
          : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease',
      }}
      className={`relative overflow-hidden ${(!isTouchDevice && isHovered) ? 'shadow-2xl' : ''} ${className}`}
    >
      {/* Specular 3D Radial Glow (Desktop Only) */}
      {!isTouchDevice && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(550px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 65%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Dynamic Interactive Specular Sheen (Desktop Only) */}
      {!isTouchDevice && glare && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 mix-blend-overlay"
          style={{
            opacity: isHovered ? 0.35 : 0,
            background: `linear-gradient(${105 + rotation.y * 3}deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 60%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div 
        className={`relative z-10 w-full h-full ${contentClassName}`} 
        style={{ transform: isTouchDevice ? 'none' : 'translateZ(10px)' }}
      >
        {children}
      </div>
    </div>
  );
}
