import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function countPdfPages(pdfBuffer) {
  const text = pdfBuffer.toString('latin1');
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

function testApproach(name, css) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page {
  size: landscape;
  margin: 8mm;
}
html, body {
  background: #ffffff;
  color: #0f172a;
  margin: 0;
  padding: 0;
}
${css}
</style>
</head>
<body>
  <div id="appreciation-card-render">
    <h1>DCVC Appreciation Card</h1>
    <p>Top inscription</p>
    <div style="height: 700px; background: #e2e8f0; border: 1px solid #94a3b8;">
      Artwork & Personalization Area (Height 700px)
    </div>
    <p>Bottom 501(c)(3) Seal & Legal Notice</p>
  </div>
</body>
</html>`;

  const htmlFile = path.resolve(`temp_test_${name}.html`);
  const pdfFile = path.resolve(`temp_test_${name}.pdf`);
  fs.writeFileSync(htmlFile, html);

  const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}`;
  try {
    execSync(`"${chromePath}" --headless=new --disable-gpu --print-to-pdf="${pdfFile}" --no-pdf-header-footer "${fileUrl}"`, { timeout: 15000 });
    const pdfBytes = fs.readFileSync(pdfFile);
    const pages = countPdfPages(pdfBytes);
    console.log(`[Approach: ${name}] -> Page Count: ${pages}`);
    return { name, pages };
  } catch (err) {
    console.error(`Error testing ${name}:`, err.message);
    return { name, error: err.message };
  }
}

// 1. Current transform scale on in-flow container
testApproach('transform_only', `
#appreciation-card-render {
  width: 896px;
  height: 880px;
  box-sizing: border-box;
  transform: scale(0.78);
  transform-origin: top center;
  page-break-inside: avoid;
  break-inside: avoid;
  margin: 0 auto;
}
`);

// 2. Zoom approach (which changes layout dimensions)
testApproach('zoom_approach', `
#appreciation-card-render {
  width: 896px;
  box-sizing: border-box;
  zoom: 0.78;
  page-break-inside: avoid;
  break-inside: avoid;
  margin: 0 auto;
}
`);

// 3. Fixed page containment approach
testApproach('fixed_page_containment', `
html, body {
  height: 100% !important;
  overflow: hidden !important;
}
#appreciation-card-render {
  width: 896px;
  box-sizing: border-box;
  transform: scale(0.78);
  transform-origin: top center;
  page-break-inside: avoid;
  break-inside: avoid;
  margin: 0 auto;
}
`);
