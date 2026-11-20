import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Mobile Carousel: Auto-Swiping User Interaction Disabler', () => {
  const componentPath = path.resolve('src/components/MobileCarousel.jsx');
  const sourceCode = fs.readFileSync(componentPath, 'utf8');

  it('contains mobile screen check (< 1024px) for stopping auto-swiping', () => {
    assert.match(sourceCode, /window\.innerWidth\s*<\s*1024/);
    assert.match(sourceCode, /stopAutoScrollOnMobile/);
  });

  it('attaches touch, swipe, pointer, wheel, and focus listeners with capture phase', () => {
    assert.match(sourceCode, /addEventListener\(['"]touchstart['"]/);
    assert.match(sourceCode, /addEventListener\(['"]touchmove['"]/);
    assert.match(sourceCode, /addEventListener\(['"]pointerdown['"]/);
    assert.match(sourceCode, /capture:\s*true/);
  });

  it('clears interval immediately when user has interacted on mobile', () => {
    assert.match(sourceCode, /userInteractedRef\.current/);
    assert.match(sourceCode, /clearInterval\(timer\)/);
  });

  it('stops auto-scrolling when carousel dot button is clicked on mobile', () => {
    assert.match(sourceCode, /stopAutoScrollOnMobile\(\);/);
  });
});
