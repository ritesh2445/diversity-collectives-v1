import React from 'react';

export default function SkipNavigation() {
  return (
    <nav aria-label="Skip Links" className="a11y-isolated">
      <a href="#main-content" className="a11y-skip-nav">
        Skip to main content (Alt + 1)
      </a>
      <a href="#main-navigation" className="a11y-skip-nav skip-link-nav">
        Skip to navigation
      </a>
      <a href="#main-footer" className="a11y-skip-nav skip-link-footer">
        Skip to footer
      </a>
    </nav>
  );
}
