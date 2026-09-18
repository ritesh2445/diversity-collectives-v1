# Diversity Collective Ventura County (DCVC)

Ventura County's Premier LGBTQ+ Cultural Sanctuary, Community Resource Center & Clinical Wellness Home.

Live deployment ready for [Vercel](https://vercel.com).

---

## ✨ Features

- **PFLAG-Style 180° to 0° Semicircle Welcome Animation**:
  - Multi-band pride and brand color sweep (Amethyst, Violet, Azure, Emerald, Yellow, Tangerine, Crimson) sweeping in a mathematical semicircle arc (`180° ➔ 0°`) across the viewport.
  - Floating glassmorphic brand emblem with replay button and instant skip controls.
- **100% Fully Responsive Across All Devices**:
  - Fluid mobile-first architecture optimized for small screens (320px+), tablets, laptops, and ultra-wide desktops.
  - Adaptive header with touch-friendly navigation drawer, collapsible brand title, and quick safe exit button.
- **Zero Dead CTAs**:
  - Every button, form, peer circle registration, and emergency hotline is linked to working handlers, telephone links, mailto pre-fills, or Google Maps navigation.
  - Interactive donation calculator and community compass filter with confetti celebration feedback.
- **3D CardSpotlight & Modern Aesthetics**:
  - Smooth glassmorphism, dynamic radial hover glows, subtle micro-interactions, and high-contrast accessible typography.
- **Vercel Optimized (`vercel.json`)**:
  - Single Page Application (SPA) catch-all rewrite rules.
  - Edge caching headers for static assets and public media.

---

## 🚀 Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + Vanilla Modern CSS Design Tokens
- **Icons**: Lucide React
- **Animations & Effects**: Canvas Confetti, Custom SVG Arc Geometries, CSS Keyframe Interpolation
- **Smooth Scroll**: Lenis Smooth Scrolling

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deploy to Vercel

1. Push to GitHub: `https://github.com/ritesh2445/diversity-collectives-v1`
2. Connect the repository in [Vercel Dashboard](https://vercel.com/new).
3. Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy!
