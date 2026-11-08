import fs from 'node:fs';

const postUrls = [
  "https://www.diversitycollectivevc.org/your-rights-in-california/",
  "https://www.diversitycollectivevc.org/transgender-day-of-remembrance-tdor/",
  "https://www.diversitycollectivevc.org/have-a-sexual-health-emergency/",
  "https://www.diversitycollectivevc.org/cdc-declares-mpox-a-public-health-emergency/",
  "https://www.diversitycollectivevc.org/gsa-leadership-summit/",
  "https://www.diversitycollectivevc.org/pride-prom-2026/",
  "https://www.diversitycollectivevc.org/hometown-heroes-drag-night/",
  "https://www.diversitycollectivevc.org/botanical-gardens-2026/",
  "https://www.diversitycollectivevc.org/surviving-the-holidays-tips-and-resources/",
  "https://www.diversitycollectivevc.org/pride-training-parents-and-family/"
];

async function scrapePosts() {
  const posts = [];
  for (const url of postUrls) {
    const slug = url.replace('https://www.diversitycollectivevc.org/', '').replace(/\/$/, '');
    console.log(`Scraping post: ${slug}`);
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const html = await res.text();
      
      const titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>(.*?)<\/h1>/i) ||
                         html.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : slug;
      
      const dateMatch = html.match(/class=["'][^"']*published[^"']*["'][^>]*>(.*?)<\//i) ||
                        html.match(/<time[^>]*>(.*?)<\/time>/i);
      const date = dateMatch ? dateMatch[1].trim() : '2026';

      const pMatches = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gi)]
        .map(m => m[1].replace(/<[^>]+>/g, '').trim())
        .filter(t => t.length > 30 && !t.includes('Join Our Mailing List') && !t.includes('Diversity Collective of Ventura County is able'));

      const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
        .map(m => m[1])
        .filter(s => s.includes('diversitycollectivevc.org/wp-content/uploads/'));

      posts.push({
        slug,
        title,
        date,
        excerpt: pMatches[0] || '',
        paragraphs: pMatches,
        images: Array.from(new Set(imgMatches)),
        url
      });
    } catch (err) {
      console.error(`Error scraping ${slug}:`, err.message);
    }
  }

  fs.writeFileSync('scripts/scraped_posts.json', JSON.stringify(posts, null, 2));
  console.log(`Saved ${posts.length} posts to scripts/scraped_posts.json`);
}

scrapePosts();
