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

  await t.test('5. Tablet carousel support: applies swipable scroll snap under lg breakpoint with tablet card widths and indicator dots', () => {
    const compPath = path.resolve('src/components/MobileCarousel.jsx');
    const compContent = fs.readFileSync(compPath, 'utf8');

    assert.ok(compContent.includes('sm:w-[50vw]'), 'Should size cards for tablet viewports (~50vw)');
    assert.ok(compContent.includes('lg:hidden'), 'Carousel dots should stay visible on tablet and hide on lg (>=1024px)');
    assert.ok(compContent.includes('lg:grid'), 'Should switch from horizontal scroll to grid at lg (>=1024px)');
    assert.ok(compContent.includes('window.innerWidth < 1024'), 'Touch and auto-scroll logic should target <1024px');
  });

  await t.test('6. Sitewide card sections wrap with MobileCarousel for mobile and tablet swipability', () => {
    const pages = [
      'src/pages/Sponsors.jsx',
      'src/pages/Programs.jsx',
      'src/pages/BoardAndStaff.jsx',
      'src/pages/News.jsx',
      'src/pages/Directory.jsx',
      'src/pages/Training.jsx',
      'src/pages/Community.jsx',
      'src/pages/Volunteer.jsx',
      'src/pages/Resources.jsx'
    ];

    pages.forEach((p) => {
      const content = fs.readFileSync(path.resolve(p), 'utf8');
      assert.ok(
        content.includes('MobileCarousel'),
        `${p} must integrate MobileCarousel for tablet and mobile swipable cards`
      );
    });

    const aboutContent = fs.readFileSync(path.resolve('src/pages/About.jsx'), 'utf8');
    assert.ok(
      aboutContent.includes('max-w-5xl mx-auto w-full items-stretch'),
      'About.jsx partner boxes must preserve center-aligned max-w-5xl mx-auto layout'
    );
    assert.ok(
      aboutContent.includes('[overflow-wrap:anywhere]'),
      'About.jsx partner boxes must preserve overflow-wrap:anywhere for multilingual text containment'
    );
  });
});
