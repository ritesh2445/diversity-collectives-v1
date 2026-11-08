import fs from 'node:fs';

const slug = process.argv[2] || 'home';
const printAll = process.argv.includes('--all');
const content = JSON.parse(fs.readFileSync('scripts/scraped_content.json', 'utf8'));

if (!content[slug]) {
  console.log(`Page "${slug}" not found in scraped content.`);
  console.log('Available keys:', Object.keys(content).join(', '));
} else {
  console.log(`=== PAGE: ${slug} (${content[slug].url}) ===`);
  console.log('\n--- HEADINGS ---');
  console.log(content[slug].headings);
  console.log(`\n--- PARAGRAPHS (${printAll ? 'ALL' : 'First 10'}) ---`);
  const ps = printAll ? content[slug].paragraphs : content[slug].paragraphs.slice(0, 10);
  ps.forEach((p, idx) => console.log(`[${idx + 1}] ${p}`));
  console.log('\n--- IMAGES ---');
  console.log(content[slug].images);
}
