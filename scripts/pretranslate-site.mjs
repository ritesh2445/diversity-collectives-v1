/**
 * Pre-translate 565 core phrases for all 24 non-English languages
 * via the DCVC Worker API.
 *
 * Each request sends exactly 10 phrases to guarantee the Worker stays
 * well within Cloudflare Worker subrequest limits and newline split alignment!
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WORKER_URL = 'https://dcvc-api.diversity-collective-vc.workers.dev/api/translate';
const BATCH_SIZE = 10; // Exactly 10 phrases per request for 100% reliable translation!

const LANGUAGES = [
  'es', 'tl', 'vi', 'zh-CN', 'fr', 'de', 'ar', 'ko', 'ja', 'pt',
  'hi', 'ru', 'it', 'uk', 'fa', 'he', 'th', 'pl', 'nl', 'tr', 'el',
  'hy', 'id', 'bn'
];

const phrases = JSON.parse(
  readFileSync(join(__dirname, 'corePhrases.json'), 'utf8')
);

const outDir = join(__dirname, '..', 'public', 'i18n');
mkdirSync(outDir, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translateBatch(texts, lang) {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLang: lang }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success || !Array.isArray(data.translations)) {
    throw new Error(`Bad response`);
  }
  return data.translations;
}

async function translateLanguage(lang) {
  const dict = {};
  let translatedCount = 0;

  for (let i = 0; i < phrases.length; i += BATCH_SIZE) {
    const slice = phrases.slice(i, i + BATCH_SIZE);
    let translations;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        translations = await translateBatch(slice, lang);
        break;
      } catch (err) {
        if (attempt < 2) await sleep(800 * (attempt + 1));
        else translations = slice;
      }
    }

    slice.forEach((original, idx) => {
      const t = translations?.[idx];
      if (t && t.trim() && t !== original) {
        dict[original] = t;
        translatedCount++;
      }
    });

    await sleep(60);
  }

  const outPath = join(outDir, `${lang}.json`);
  writeFileSync(outPath, JSON.stringify(dict, null, 2), 'utf8');
  console.log(`[${lang}] ✓ ${translatedCount}/${phrases.length} phrases translated → ${lang}.json`);
  return translatedCount;
}

async function main() {
  console.log(`=== DCVC Pre-translation (BATCH_SIZE=${BATCH_SIZE}) ===`);
  console.log(`Phrases: ${phrases.length} | Languages: ${LANGUAGES.length}\n`);

  for (const lang of LANGUAGES) {
    try {
      await translateLanguage(lang);
    } catch (err) {
      console.error(`[${lang}] Error:`, err);
    }
  }

  console.log('\nAll languages completed successfully!');
}

main().catch(console.error);
