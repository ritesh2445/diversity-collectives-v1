import fs from 'node:fs';
import path from 'node:path';

const files = [
  'src/data/dcvcData.js',
  'src/data/siteDefaults.js',
  'src/pages/Home.jsx',
  'src/components/Header.jsx'
];

const phrases = new Set([
  "You Are Always Welcome Here.",
  "You Are Welcome Here.",
  "Explore Free Programs",
  "Send us an email",
  "ESTABLISHED 2014 · VENTURA COUNTY 501(C)(3) NONPROFIT",
  "Programs Built for Every Age & Stage.",
  "View All Programs",
  "Signature Annual Events & Galas",
  "Events for the Upcoming Week",
  "Upcoming Community Calendar",
  "Special Engagements & Hosted Collectives",
  "Verified Civic Alliances & Public Health Leadership",
  "LGBTQ+ Affirming Business Directory",
  "Flex Space & Community Desks",
  "In our community's words.",
  "Stay Connected with Diversity Collective",
  "Subscribe for community event announcements, advocacy updates, and monthly health wellness schedules delivered directly to your inbox.",
  "Subscribe to Newsletter",
  "DCVC Community Resource Center",
  "Free Confidential HIV & STI Testing",
  "Rainbow Umbrella Youth Group",
  "Little Unicorns Youth Peer Group",
  "Queer Adulting Life Navigation Group",
  "Trans Peer Group by Transverse",
  "Narcotics Anonymous LGBTQ+ Recovery",
  "Ventura County Toastmasters",
  "Men's Collective",
  "Silver Collective (50+)",
  "Ventura County Pride Festival",
  "Pride Prom",
  "AIDS Walk Ventura County",
  "Amplify Arts (Amplify After Hours)",
  "The Transverse Peer Gatherings",
  "Book HIV/STI Screening Slot",
  "Reserve Flex Space",
  "Quick Exit",
  "Get Support",
  "Donate",
  "Search",
  "About",
  "Programs",
  "Directory",
  "Training",
  "Community",
  "Events",
  "Resources",
  "News",
  "Gallery",
  "Contact",
  "Volunteer",
  "Youth Voice",
  "Parent Voice",
  "Volunteer Voice"
]);

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  // Match string literals
  const m = content.match(/["']([A-Z][a-zA-Z0-9 ,.·&'’\(\)\-\/]{3,80})["']/g) || [];
  for (const item of m) {
    const raw = item.slice(1, -1).trim();
    if (raw.length > 3 && !raw.startsWith('http') && !raw.includes('<') && !raw.includes('{') && !raw.includes('/images/')) {
      phrases.add(raw);
    }
  }
}

const list = Array.from(phrases).filter((s) => !s.includes('${') && !s.includes('className') && !s.includes('import '));
fs.mkdirSync('scripts', { recursive: true });
fs.writeFileSync('scripts/corePhrases.json', JSON.stringify(list, null, 2));
console.log(`Saved ${list.length} high-priority phrases to scripts/corePhrases.json`);

