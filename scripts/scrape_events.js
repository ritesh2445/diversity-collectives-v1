import fs from 'node:fs';

const inventory = JSON.parse(fs.readFileSync('scripts/source_inventory.json', 'utf8'));
const eventUrls = inventory['tribe_events-sitemap'] || [];

// Sort / filter for recent events (2024-2026)
const recentEvents = eventUrls.filter(url => 
  url.includes('2026') || url.includes('2025') || url.includes('2024') ||
  url.includes('pride') || url.includes('gala') || url.includes('aids-walk') ||
  url.includes('umbrella') || url.includes('shines') || url.includes('unicorn')
);

console.log(`Total events: ${eventUrls.length}`);
console.log(`Relevant / recent events identified: ${recentEvents.length}`);
fs.writeFileSync('scripts/recent_event_urls.json', JSON.stringify(recentEvents.slice(0, 30), null, 2));

