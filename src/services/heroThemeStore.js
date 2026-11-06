/**
 * Diversity Collective Ventura County — Hero Theme & Festival Event Store
 * Allows administrators to switch hero layouts and activate US LGBTQ+ festival themes dynamically.
 */

export const HERO_THEMES = [
  // ==========================================
  // CORE HERO DESIGNS (Admin Switchable)
  // ==========================================
  {
    id: 'aurora',
    number: '01',
    name: 'Design 1: Flagship Aurora Ribbon (Default)',
    category: 'layout',
    badge: 'Design 1 · Active Default',
    badgeColor: 'bg-purple-100 text-[#5A1E65] border-purple-300',
    description: 'Vivid multi-color aurora atmosphere, Fraunces humanist serif, animated liquid-flow "Always", 3 stacked high-contrast action pills, authentic volunteers photography, and flowing Pride aurora waves.',
    palette: ['#FAF7F2', '#5A1E65', '#E11D48', '#F59E0B', '#06B6D4'],
    bestFor: 'Everyday high-visibility sanctuary presence with rich gradients & flowing Pride ribbons'
  },
  {
    id: 'spotlight',
    number: '02',
    name: 'Design 2: Civic Sanctuary & 3D Spotlight Pathfinder',
    category: 'layout',
    badge: 'Design 2 · Civic Pathfinder',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Civic sanctuary presence from official mockup: Dual helpline command bar, eyebrow pill, "You Are Always Welcome Here" with sunset serif underline, 3 CTA buttons, 4-tab Instant Sanctuary Navigator, and interactive 3D Card Spotlight with Portola Rd safe harbor emblem.',
    palette: ['#5A1E65', '#B45309', '#0F172A', '#FAF5FF', '#38BDF8'],
    bestFor: 'Immediate community service triage, direct helpline access, and interactive 3D safe harbor showcase'
  },
  {
    id: 'default',
    number: '02B',
    name: 'Design 2 (Legacy Alias: default)',
    category: 'layout',
    badge: 'Design 2 Alias',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Legacy alias mapping directly to Design 2 (Civic Sanctuary & 3D Spotlight Pathfinder).',
    palette: ['#5A1E65', '#B45309', '#0F172A', '#FAF5FF', '#38BDF8'],
    bestFor: 'System compatibility'
  },
  {
    id: 'portal',
    number: '03',
    name: 'Sanctuary Navigator Portal',
    category: 'layout',
    badge: 'Civic Service Finder',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Immediate community utility with an interactive 4-card service triage: Free Rapid Testing, Youth Circles, Drop-In Library & Volunteer Aid.',
    palette: ['#0D9488', '#5A1E65', '#F59E0B', '#F43F5E', '#FFFFFF'],
    bestFor: 'Direct service navigation with zero wasted space'
  },
  {
    id: 'bento',
    number: '04',
    name: 'Bento Editorial Grid',
    category: 'layout',
    badge: 'Modern Modular Tiles',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Apple/Linear-inspired modular bento cards organizing identity, photography, live hours, crisis lines, and four pillars into high-tech blocks.',
    palette: ['#4F46E5', '#10B981', '#5A1E65', '#F59E0B', '#FAF8F5'],
    bestFor: '100% space utilization and modern tech-forward visual rhythm'
  },
  {
    id: 'mosaic',
    number: '05',
    name: 'Community Story Mosaic',
    category: 'layout',
    badge: 'Authentic Human Warmth',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Centered welcoming statement paired with a 3-photo authentic community mosaic celebrating Pride crowds, volunteers, and the Portola Rd center.',
    palette: ['#FAF7F2', '#E11D48', '#5A1E65', '#EA580C', '#0284C7'],
    bestFor: 'Grassroots human connection and real community faces'
  },
  {
    id: 'architectural',
    number: '06',
    name: 'Modern Architectural Split',
    category: 'layout',
    badge: 'Prestige Magazine Layout',
    badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'High-contrast architectural split with razor-sharp structural dividing rules, high-fashion typography, and full-height visual framing.',
    palette: ['#0F172A', '#5A1E65', '#FFFFFF', '#64748B', '#F1F5F9'],
    bestFor: 'Authoritative civic leadership and cultural prestige'
  },
  {
    id: 'sunset',
    number: '07',
    name: 'Prismatic Sunset',
    category: 'layout',
    badge: 'High-Energy Queer Joy',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'Full-bleed glowing gradient canvas in royal purple, magenta, and sunburst gold, featuring tilted Polaroid-style authentic photo cards.',
    palette: ['#2E0854', '#C2185B', '#F57C00', '#FACC15', '#FFFFFF'],
    bestFor: 'Celebratory festival energy, youth engagement, and vibrant spirit'
  },
  {
    id: 'magazine',
    number: '08',
    name: 'Cultural Magazine Masthead',
    category: 'layout',
    badge: 'Vogue & New Yorker Style',
    badgeColor: 'bg-stone-100 text-stone-900 border-stone-300',
    description: 'World-class publication layout featuring an architectural masthead, editorial pull-quotes, and dispatch columns.',
    palette: ['#FAF6F0', '#0F172A', '#5A1E65', '#78350F', '#E2E8F0'],
    bestFor: 'Cultural arts authority and museum-grade institutional presence'
  },
  {
    id: 'constellation',
    number: '09',
    name: 'Constellation Hub',
    category: 'layout',
    badge: 'Kinetic Orbiting Circles',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Playful kinetic hub with orbiting interactive circular service bubbles around the central welcoming declaration.',
    palette: ['#F5EEFB', '#059669', '#D97706', '#7C3AED', '#E11D48'],
    bestFor: 'Interactive playfulness and dynamic multi-path exploration'
  },
  {
    id: 'night',
    number: '10',
    name: 'Luminous Night Sanctuary',
    category: 'layout',
    badge: 'Dark Luxe Obsidian',
    badgeColor: 'bg-purple-950 text-purple-200 border-purple-700',
    description: 'Deep midnight obsidian backdrop (#0B0F19) with glowing neon aurora ribbons—symbolizing an illuminated safe harbor in the night.',
    palette: ['#0B0F19', '#A855F7', '#06B6D4', '#10B981', '#F43F5E'],
    bestFor: 'Dramatic evening aesthetic, high contrast, and safe haven symbolism'
  },
  {
    id: 'dual',
    number: '11',
    name: 'Dual Care & Pride Split',
    category: 'layout',
    badge: 'Action-First Decision Split',
    badgeColor: 'bg-pink-100 text-pink-900 border-pink-300',
    description: 'Two clear decision pathways: "I Need Care & Safe Harbor" (testing, youth, crisis) vs "I Want to Celebrate & Give" (Pride, volunteering, donating).',
    palette: ['#0F766E', '#5A1E65', '#FAF8F5', '#F43F5E', '#FFFFFF'],
    bestFor: 'Zero ambiguity and clear audience triage'
  },

  // ==========================================
  // MAJOR US LGBTQ+ FESTIVALS & CALENDAR EVENTS
  // ==========================================
  {
    id: 'fest-pride',
    number: '12',
    name: 'Pride Month Festival (June)',
    category: 'festival',
    badge: 'June Pride Month',
    badgeColor: 'bg-gradient-to-r from-red-100 via-amber-100 to-purple-100 text-purple-950 border-purple-300',
    eventDates: 'All of June (Annual Highlight)',
    headline: 'Ventura County Pride — All 10 Cities, One Family',
    description: 'Full Progress Pride spectrum celebration with animated confetti bursts, parade schedules, Pride festival booth volunteering, and sponsor highlights.',
    palette: ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#06B6D4', '#8B5CF6', '#FFFFFF', '#F472B6', '#38BDF8'],
    bestFor: 'June Pride celebrations and major festival announcements'
  },
  {
    id: 'fest-tvd',
    number: '13',
    name: 'Transgender Visibility & Care',
    category: 'festival',
    badge: 'March 31 & Nov 13-20',
    badgeColor: 'bg-cyan-100 text-cyan-950 border-cyan-300',
    eventDates: 'TDOV (March 31) · Trans Awareness Week (Nov 13–20)',
    headline: 'Visibility. Dignity. Unconditional Safe Harbor.',
    description: 'Trans Pride palette (soft cyan, pastel pink, white) highlighting free gender-affirming resources, clinical healthcare navigation, name-change clinics, and trans youth peer circles.',
    palette: ['#38BDF8', '#F472B6', '#FFFFFF', '#0F172A', '#5A1E65'],
    bestFor: 'TDOV, Trans Awareness Week, and TDOR community solidarity'
  },
  {
    id: 'fest-spirit',
    number: '14',
    name: 'Spirit Day: Go Purple for Youth',
    category: 'festival',
    badge: 'Third Thursday in October',
    badgeColor: 'bg-purple-100 text-purple-950 border-purple-300',
    eventDates: 'Third Thursday of October (Annual Anti-Bullying)',
    headline: 'Go Purple — Standing Resolutely With LGBTQ+ Youth',
    description: 'Luminous royal amethyst purple theme dedicated to anti-bullying solidarity, youth peer circles through Rainbow Umbrella, and 24/7 crisis support.',
    palette: ['#5A1E65', '#7E22CE', '#A855F7', '#FAF5FF', '#FDE047'],
    bestFor: 'Spirit Day and annual anti-bullying awareness month'
  },
  {
    id: 'fest-coming-out',
    number: '15',
    name: 'National Coming Out Day',
    category: 'festival',
    badge: 'October 11',
    badgeColor: 'bg-rose-100 text-rose-950 border-rose-300',
    eventDates: 'October 11 (Annual Celebration)',
    headline: 'Living Openly. Loved Fiercely. You Are Safe Here.',
    description: 'Radiant, brave celebration of authenticity and pride. Direct access to affirming community circles, family guidance, and safe harbor in Ventura County.',
    palette: ['#E11D48', '#EA580C', '#F59E0B', '#10B981', '#06B6D4'],
    bestFor: 'National Coming Out Day and autumn community milestones'
  },
  {
    id: 'fest-world-aids',
    number: '16',
    name: 'World AIDS Day: Zero Stigma',
    category: 'festival',
    badge: 'December 1',
    badgeColor: 'bg-red-100 text-red-950 border-red-300',
    eventDates: 'December 1 (Annual Global Day)',
    headline: 'Remember. Advocate. Free Rapid Screenings for All.',
    description: 'Red ribbon solidarity honoring lives lost and celebrating scientific advancement. Direct walk-in rapid HIV/STI testing appointments through Diversity SHINES with zero stigma.',
    palette: ['#DC2626', '#991B1B', '#0F172A', '#FEE2E2', '#FFFFFF'],
    bestFor: 'World AIDS Day and clinical community health outreach'
  },
  {
    id: 'fest-lesbian',
    number: '17',
    name: 'Lesbian Visibility & Leadership',
    category: 'festival',
    badge: 'Late April',
    badgeColor: 'bg-amber-100 text-amber-950 border-amber-300',
    eventDates: 'April 26 (Annual Visibility Day) · Late April Week',
    headline: 'Celebrating Lesbian Leadership, Heritage & Visibility',
    description: 'Sunset orange, peach, white, and magenta pride spectrum honoring lesbian leadership, grassroots organizers, women’s peer circles, and historical archives in Ventura.',
    palette: ['#D9480F', '#F76707', '#FFA94D', '#FFFFFF', '#D6336C'],
    bestFor: 'Lesbian Visibility Week and women’s leadership events'
  },
  {
    id: 'fest-bi',
    number: '18',
    name: 'Bisexual Awareness Week',
    category: 'festival',
    badge: 'September 16–23',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-300',
    eventDates: 'September 16–23 (Bi+ Awareness Week)',
    headline: 'Visible, Valid, Empowered: Celebrating Bi+ Community',
    description: 'Magenta, lavender, and royal blue pride gradient dedicated to bisexuality/pansexuality awareness, eliminating erasure, and affirming mental health circles.',
    palette: ['#D946EF', '#8B5CF6', '#3B82F6', '#FAF5FF', '#0F172A'],
    bestFor: 'Bi+ Visibility Week and autumn mental health awareness'
  },
  {
    id: 'fest-prom',
    number: '19',
    name: 'Youth Pride Prom & Gala Season',
    category: 'festival',
    badge: 'Spring Season',
    badgeColor: 'bg-yellow-100 text-yellow-950 border-yellow-300',
    eventDates: 'Spring Season (Annual Youth Pride Prom & Gala)',
    headline: 'An Unforgettable Night of Authentic Queer Joy',
    description: 'Glamorous starlight, gold, and royal violet gala aesthetic promoting free prom tickets for local youth (13–23), community gala seating, and attire donations.',
    palette: ['#F59E0B', '#7C3AED', '#4C1D95', '#FEF3C7', '#FFFFFF'],
    bestFor: 'Annual Youth Pride Prom, community galas, and spring fundraising'
  }
];

const STORAGE_KEY = 'dcvc_active_hero_theme';

export function getActiveHeroTheme() {
  if (typeof window === 'undefined') return 'aurora';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'default') return 'spotlight';
    if (saved && HERO_THEMES.some(t => t.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'aurora';
}

export function setActiveHeroTheme(themeId) {
  if (typeof window === 'undefined') return;
  try {
    const normalizedId = themeId === 'default' ? 'spotlight' : themeId;
    const theme = HERO_THEMES.find(t => t.id === normalizedId || t.id === themeId);
    if (theme) {
      localStorage.setItem(STORAGE_KEY, normalizedId);
      window.dispatchEvent(new CustomEvent('dcvc-hero-theme-changed', { 
        detail: { themeId: normalizedId, theme } 
      }));
    }
  } catch (err) {
    console.error('Error saving hero theme:', err);
  }
}

export function subscribeToHeroTheme(callback) {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (e) => {
    callback(e.detail.themeId, e.detail.theme);
  };
  
  window.addEventListener('dcvc-hero-theme-changed', handler);
  return () => window.removeEventListener('dcvc-hero-theme-changed', handler);
}
