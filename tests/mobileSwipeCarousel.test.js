import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Mobile Swipe Carousel Feature Suite', async (t) => {
  await t.test('1. index.css contains mobile carousel and indicator dots styles', () => {
    const cssPath = path.resolve('src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert.ok(cssContent.includes('.mobile-card-scroll'), 'Should include .mobile-card-scroll class');
    assert.ok(cssContent.includes('scrollbar-width: none'), 'Should hide scrollbars via scrollbar-width');
    assert.ok(cssContent.includes('.carousel-dots'), 'Should include .carousel-dots container');
    assert.ok(cssContent.includes('.carousel-dot'), 'Should include .carousel-dot style');
    assert.ok(cssContent.includes('.carousel-dot.active'), 'Should include active dot indicator style');
    assert.ok(cssContent.includes('#5A1E65'), 'Should use brand purple for active dot');
  });

  await t.test('2. MobileCarousel component exists with snap-x and autoScroll support', () => {
    const compPath = path.resolve('src/components/MobileCarousel.jsx');
    assert.ok(fs.existsSync(compPath), 'MobileCarousel.jsx must exist');
    const compContent = fs.readFileSync(compPath, 'utf8');

    assert.ok(compContent.includes('snap-x'), 'Should apply snap-x');
    assert.ok(compContent.includes('snap-mandatory'), 'Should apply snap-mandatory');
    assert.ok(compContent.includes('snap-center'), 'Children should have snap-center');
    assert.ok(compContent.includes('mobile-card-scroll'), 'Should use mobile-card-scroll class');
    assert.ok(compContent.includes('w-[85vw]'), 'Should use mobile width 85vw for cards');
    assert.ok(compContent.includes('carousel-dots'), 'Should render carousel dots');
    assert.ok(compContent.includes('autoScrollMs'), 'Should support autoScrollMs prop');
  });

  await t.test('3. Home.jsx integrates MobileCarousel across stats, programs, and events sections', () => {
    const homePath = path.resolve('src/pages/Home.jsx');
    const homeContent = fs.readFileSync(homePath, 'utf8');

    assert.ok(
      homeContent.includes("import MobileCarousel from '../components/MobileCarousel"),
      'Home.jsx should import MobileCarousel'
    );
    assert.ok(
      homeContent.includes('<MobileCarousel cols={4} autoScrollMs={5000}'),
      'Home.jsx should wrap stats/impact cards with MobileCarousel cols={4}'
    );
    assert.ok(
      homeContent.includes('<MobileCarousel cols={3} autoScrollMs={4500}'),
      'Home.jsx should wrap programs section with MobileCarousel cols={3}'
    );
    assert.ok(
      homeContent.includes('<MobileCarousel cols={3} autoScrollMs={5000}'),
      'Home.jsx should wrap events section with MobileCarousel cols={3}'
    );
  });

  await t.test('4. Events.jsx integrates MobileCarousel for event cards with autoScrollMs=0', () => {
    const eventsPath = path.resolve('src/pages/Events.jsx');
    const eventsContent = fs.readFileSync(eventsPath, 'utf8');

    assert.ok(
      eventsContent.includes("import MobileCarousel from '../components/MobileCarousel"),
      'Events.jsx should import MobileCarousel'
    );
    assert.ok(
      eventsContent.includes('<MobileCarousel cols={3} autoScrollMs={0}'),
      'Events.jsx should wrap event cards with MobileCarousel cols={3} autoScrollMs={0}'
    );
  });
});
