import fs from 'node:fs';

const content = JSON.parse(fs.readFileSync('scripts/scraped_content.json', 'utf8'));

console.log('====================================================');
console.log('SUMMARY OF SCRAPED CONTENT FROM ORIGINAL WEBSITE');
console.log('====================================================');

for (const [slug, data] of Object.entries(content)) {
  console.log(`\nPAGE: ${slug} (${data.url})`);
  console.log(`Headings: ${data.headings.length} | Paragraphs: ${data.paragraphs.length} | Images: ${data.images.length}`);
  if (data.headings.length > 0) {
    console.log('  Headings:', data.headings.map(h => `${h.tag.toUpperCase()}: ${h.text}`).slice(0, 5).join(' | '));
  }
}

