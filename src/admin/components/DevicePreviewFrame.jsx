import React from 'react';

export const VIEWPORT_WIDTHS = {
  desktop: 1280,
  tablet: 768,
  mobile: 390
};

/**
 * Responsive Device Preview Frame
 * Seamlessly renders children inside a constrained, responsive viewport wrapper
 * that inherits all parent Tailwind CSS classes, fonts, and design tokens without
 * iframe stylesheet isolation or CORS asset loading failures.
 */
export default function DevicePreviewFrame({
  viewport = 'desktop',
  title = 'Live Homepage Preview',
  maxContainerWidth = null,
  className = '',
  children
}) {
  const targetWidth = VIEWPORT_WIDTHS[viewport] || VIEWPORT_WIDTHS.desktop;

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div
        className="w-full bg-white transition-all duration-300 mx-auto"
        style={{
          maxWidth: viewport === 'desktop' ? '100%' : `${targetWidth}px`,
          width: '100%'
        }}
      >
        {children}
      </div>
    </div>
  );
}
