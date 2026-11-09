import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function countPdfPages(pdfBuffer) {
  const text = pdfBuffer.toString('latin1');
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

// Ensure test_output directory exists
const outDir = path.resolve('test_output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const tiers = [
  {
    id: 'community_ally',
    title: 'Community Ally',
    badgeText: 'COMMUNITY ALLY',
    bg: 'linear-gradient(to bottom right, rgba(254, 243, 199, 0.9), #FCF9F2, rgba(255, 228, 230, 0.6))',
    border: '#fde68a',
    textColor: '#0f172a',
    accentGrad: 'linear-gradient(to right, #f59e0b, #fb7185, #d97706)',
    quote: '"Thank you for believing that everyone deserves a space where they are welcomed without reservation."',
    impact: 'Your generous contribution provides vital safer-sex supplies, harm reduction kits, welcoming computer access, and warm hospitality for local community members finding sanctuary at our Ventura Community Resource Center.'
  },
  {
    id: 'pride_advocate',
    title: 'Pride Advocate',
    badgeText: 'PRIDE ADVOCATE',
    bg: 'linear-gradient(to bottom right, rgba(250, 245, 255, 0.9), #FAF5FF, rgba(240, 249, 255, 0.6))',
    border: '#d8b4fe',
    textColor: '#0f172a',
    accentGrad: 'linear-gradient(to right, #c026d3, #ec4899, #06b6d4)',
    quote: '"Because of your advocacy, community members have immediate, compassionate access to the care they need to stay healthy and thrive."',
    impact: 'Your gift directly funds free, confidential rapid HIV and STI testing clinics, PrEP/PEP healthcare navigation, and stigma-free education through Diversity SHINES across all 10 Ventura County cities.'
  },
  {
    id: 'rainbow_champion',
    title: 'Rainbow Champion',
    badgeText: 'RAINBOW CHAMPION',
    bg: 'linear-gradient(to bottom right, rgba(236, 253, 245, 0.9), #F0FDF4, rgba(250, 245, 255, 0.6))',
    border: '#86efac',
    textColor: '#0f172a',
    accentGrad: 'linear-gradient(to right, #ef4444, #f59e0b, #10b981, #06b6d4, #8b5cf6)',
    quote: '"Research proves having even one affirming adult reduces youth suicide risk by 40%. Your support ensures that sanctuary is always open."',
    impact: 'Your partnership underwrites weekly Rainbow Umbrella and Little Unicorns youth peer circles, creating lifelong friendships, mental health resilience, and affirming spaces where young people can be their authentic selves.'
  },
  {
    id: 'visionary_benefactor',
    title: 'Visionary Benefactor',
    badgeText: 'VISIONARY BENEFACTOR',
    bg: 'linear-gradient(to bottom right, #0F0D22, #1B1238, #0D1527)',
    border: '#fbbf24',
    textColor: '#ffffff',
    accentGrad: 'linear-gradient(to right, #fde047, #f59e0b, #b45309)',
    quote: '"Your leadership transforms our community from surviving to thriving. We honor your extraordinary commitment to LGBTQ+ equality and dignity."',
    impact: 'As a Visionary Benefactor, your profound investment anchors the operational foundation of Diversity Collective Ventura County. You empower the flagship Community Resource Center, sustain year-round advocacy, and ensure Ventura County Pride and the Youth Pride Prom remain forever free, affirming, and accessible to all.'
  }
];

const donors = [
  { label: 'standard', name: 'Jordan Rivers' },
  { label: 'long_name', name: 'Dr. Alexandria Montgomery-Hollingsworth, Esq. & The Ventura Community Health Coalition' }
];

const paperSizes = [
  { name: 'A4', css: 'size: A4 landscape; margin: 8mm;' },
  { name: 'Letter', css: 'size: letter landscape; margin: 8mm;' }
];

console.log('--- EXHAUSTIVE PRINT PAGINATION AUDIT ---');

const results = [];

for (const tier of tiers) {
  for (const donor of donors) {
    for (const paper of paperSizes) {
      const testId = `${tier.id}_${donor.label}_${paper.name}`;
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page {
  ${paper.css}
}
html, body {
  background: #ffffff;
  color: ${tier.textColor};
  margin: 0 !important;
  padding: 0 !important;
  height: 100% !important;
  overflow: hidden !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
header, footer, nav, aside {
  display: none !important;
}
#appreciation-card-render {
  width: 896px;
  max-width: 100%;
  box-sizing: border-box;
  padding: 32px 48px;
  border-radius: 24px;
  border: 2px solid ${tier.border};
  background: ${tier.bg};
  box-shadow: none !important;
  zoom: var(--print-scale, 0.76);
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  margin: 0 auto !important;
  position: relative;
}
.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 12px;
  background: ${tier.accentGrad};
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
  padding-bottom: 20px;
  margin-bottom: 20px;
}
.brand-title {
  font-size: 20px;
  font-weight: 900;
  color: ${tier.textColor};
}
.badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 900;
  background: #ffffff;
  color: #5A1E65;
  border: 1px solid #cbd5e1;
}
.artwork-box {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}
.donor-name {
  font-size: 34px;
  font-weight: 900;
  text-align: center;
  margin: 14px 0 8px 0;
  color: ${tier.textColor};
  line-height: 1.2;
}
.quote {
  font-style: italic;
  text-align: center;
  font-size: 16px;
  opacity: 0.9;
  max-width: 650px;
  margin: 0 auto 16px auto;
}
.impact-box {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 13px;
  line-height: 1.5;
  color: #1e293b;
  margin-bottom: 20px;
}
.seal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
  padding-top: 16px;
}
.notice {
  font-size: 10px;
  text-align: center;
  opacity: 0.75;
  margin-top: 16px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
}
</style>
</head>
<body>
  <div id="appreciation-card-render">
    <div class="accent-bar"></div>
    <div class="header-row">
      <div>
        <div class="brand-title">Diversity Collective</div>
        <div style="font-size: 11px; opacity: 0.8; text-transform: uppercase;">Ventura County 501(c)(3) Nonprofit</div>
      </div>
      <div style="text-align: right;">
        <span class="badge">${tier.badgeText}</span>
        <div style="font-size: 10px; font-family: monospace; margin-top: 4px;">ID: DCVC-AC-2026-TEST</div>
      </div>
    </div>

    <!-- Authentic Tier Artwork SVG Simulation -->
    <div class="artwork-box">
      <svg width="400" height="160" viewBox="0 0 400 160">
        <circle cx="200" cy="80" r="60" fill="${tier.border}" opacity="0.4" />
        <circle cx="200" cy="80" r="35" fill="${tier.textColor}" opacity="0.8" />
        <path d="M 120,130 C 160,110 240,110 280,130" stroke="${tier.border}" stroke-width="3" fill="none" />
      </svg>
    </div>

    <div style="text-align: center; font-size: 11px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase;">
      Official 501(c)(3) Certificate of Authentic Gratitude
    </div>

    <div class="donor-name">With Heartfelt Thanks To<br><span style="text-decoration: underline;">${donor.name}</span></div>

    <div class="quote">${tier.quote}</div>

    <div class="impact-box">
      <strong>YOUR VENTURA COUNTY COMMUNITY IMPACT:</strong><br>
      ${tier.impact}
    </div>

    <div class="seal-row">
      <div>
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">With Deepest Gratitude</div>
        <div style="font-size: 16px; font-weight: bold; font-style: italic;">Diversity Collective Ventura County</div>
        <div style="font-size: 11px; opacity: 0.8;">Board of Directors, Staff, Volunteers & Community Sanctuary</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; font-weight: bold;">501(c)(3) Nonprofit Public Charity</div>
        <div style="font-size: 10px; opacity: 0.8;">Ventura County, California · Established 2014</div>
      </div>
    </div>

    <div class="notice">
      Commemorative Keepsake Notice: This appreciation card is an expressive cultural keepsake honoring your generous partnership. It does not serve as an official IRS tax receipt. Official tax-deductible donation receipts are issued independently via Zeffy.
    </div>
  </div>
</body>
</html>`;

      const htmlPath = path.join(outDir, `${testId}.html`);
      const pdfPath = path.join(outDir, `${testId}.pdf`);
      fs.writeFileSync(htmlPath, html);

      const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
      try {
        execSync(`"${chromePath}" --headless=new --disable-gpu --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${fileUrl}"`, { timeout: 15000 });
        const pdfBytes = fs.readFileSync(pdfPath);
        const pages = countPdfPages(pdfBytes);
        console.log(`[PASS] ${testId.padEnd(45)} -> Pages: ${pages} (File size: ${pdfBytes.length} bytes)`);
        results.push({ testId, pages, pass: pages === 1, size: pdfBytes.length, pdfPath });
      } catch (err) {
        console.error(`[FAIL] ${testId}:`, err.message);
        results.push({ testId, pass: false, error: err.message });
      }
    }
  }
}

console.log('\n--- AUDIT SUMMARY ---');
const allOnePage = results.every(r => r.pages === 1);
console.log(`Total Scenarios Tested: ${results.length}`);
console.log(`All Exactly 1 Page: ${allOnePage ? 'YES (100% PASSED)' : 'NO (FAILED)'}`);
if (!allOnePage) {
  results.filter(r => r.pages !== 1).forEach(r => console.log('Failed:', r.testId, 'Pages:', r.pages));
}

