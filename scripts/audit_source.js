import fs from 'node:fs';

async function fetchSitemap(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    return [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    return [];
  }
}

async function audit() {
  const indexUrl = 'https://www.diversitycollectivevc.org/sitemap_index.xml';
  const submaps = await fetchSitemap(indexUrl);
  console.log(`Found ${submaps.length} sub-sitemaps in index:`);
  
  const allUrls = {};
  for (const sm of submaps) {
    const urls = await fetchSitemap(sm);
    const key = sm.split('/').pop().replace('.xml', '');
    allUrls[key] = urls;
    console.log(`- ${key}: ${urls.length} URLs`);
  }

  fs.writeFileSync('scripts/source_inventory.json', JSON.stringify(allUrls, null, 2));
  console.log('\nInventory written to scripts/source_inventory.json');
}

audit();

