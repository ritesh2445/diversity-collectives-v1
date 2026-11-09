import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('test_output');

const tiers = ['community_ally', 'pride_advocate', 'rainbow_champion', 'visionary_benefactor'];

console.log('--- GENERATING HIGH-RES SAMPLE PNGS ---');

for (const tier of tiers) {
  const htmlPath = path.join(outDir, `${tier}_standard_A4.html`);
  const pngPath = path.join(outDir, `${tier}_preview_sample.png`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`Missing HTML for ${tier}`);
    continue;
  }

  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  try {
    // Take screenshot with device-scale-factor 2.0 to capture high-resolution reference PNG
    execSync(`"${chromePath}" --headless=new --disable-gpu --force-device-scale-factor=2 --window-size=1000,980 --screenshot="${pngPath}" "${fileUrl}"`, { timeout: 15000 });
    const stat = fs.statSync(pngPath);
    console.log(`[PASS] ${tier}_preview_sample.png (${stat.size} bytes)`);
  } catch (err) {
    console.error(`[FAIL] ${tier}:`, err.message);
  }
}

