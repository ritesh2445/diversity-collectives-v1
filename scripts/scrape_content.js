import fs from 'node:fs';

const pagesToScrape = [
  { slug: "home", url: "https://www.diversitycollectivevc.org/" },
  { slug: "about", url: "https://www.diversitycollectivevc.org/about/" },
  { slug: "crc-resources", url: "https://www.diversitycollectivevc.org/crc-resources/" },
  { slug: "accessibility-statement", url: "https://www.diversitycollectivevc.org/accessibility-statement/" },
  { slug: "adult-programs", url: "https://www.diversitycollectivevc.org/adult-programs/" },
  { slug: "services", url: "https://www.diversitycollectivevc.org/services/" },
  { slug: "rainbow-umbrella", url: "https://www.diversitycollectivevc.org/rainbow-umbrella/" },
  { slug: "gsa-resources", url: "https://www.diversitycollectivevc.org/services/gsa-resources/" },
  { slug: "youth-services", url: "https://www.diversitycollectivevc.org/services/youth-services/" },
  { slug: "terms-and-conditions", url: "https://www.diversitycollectivevc.org/terms-and-conditions/" },
  { slug: "privacy-policy", url: "https://www.diversitycollectivevc.org/privacy-policy/" },
  { slug: "sponsor", url: "https://www.diversitycollectivevc.org/sponsor/" },
  { slug: "virtual-vendors", url: "https://www.diversitycollectivevc.org/virtual-vendors/" },
  { slug: "volunteer", url: "https://www.diversitycollectivevc.org/volunteer/" },
  { slug: "youth-programs", url: "https://www.diversitycollectivevc.org/youth-programs/" },
  { slug: "schedule-your-appointment", url: "https://www.diversitycollectivevc.org/schedule-your-appointment/" },
  { slug: "venturapride", url: "https://www.diversitycollectivevc.org/venturapride/" },
  { slug: "shines", url: "https://www.diversitycollectivevc.org/shines/" },
  { slug: "dcvc-events", url: "https://www.diversitycollectivevc.org/dcvc-events/" },
  { slug: "get-involved", url: "https://www.diversitycollectivevc.org/get-involved/" }
];

function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
}

function extractHeadings(html) {
  const headings = [];
  const regex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text) headings.push({ tag: match[1].toLowerCase(), text });
  }
  return headings;
}

function extractParagraphs(html) {
  const paragraphs = [];
  const regex = /<p[^>]*>(.*?)<\/p>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text && text.length > 20) paragraphs.push(text);
  }
  return paragraphs;
}

function extractImages(html) {
  const images = new Set();
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let src = match[1];
    if (src.includes('diversitycollectivevc.org/wp-content/uploads/')) {
      images.add(src);
    }
  }
  return Array.from(images);
}

function extractLinks(html) {
  const links = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text && href.startsWith('http')) {
      links.push({ href, text });
    }
  }
  return links;
}

async function scrape() {
  console.log(`Starting content extraction for ${pagesToScrape.length} core pages...`);
  const results = {};

  for (const page of pagesToScrape) {
    console.log(`Extracting: ${page.slug} (${page.url})`);
    try {
      const res = await fetch(page.url);
      if (!res.ok) {
        results[page.slug] = { status: 'ERROR', code: res.status, url: page.url };
        continue;
      }
      const rawHtml = await res.text();
      const cleaned = cleanHtml(rawHtml);
      
      results[page.slug] = {
        status: 'SUCCESS',
        url: page.url,
        headings: extractHeadings(cleaned),
        paragraphs: extractParagraphs(cleaned),
        images: extractImages(cleaned),
        links: extractLinks(cleaned)
      };
    } catch (err) {
      results[page.slug] = { status: 'FETCH_FAILED', error: err.message, url: page.url };
    }
  }

  fs.writeFileSync('scripts/scraped_content.json', JSON.stringify(results, null, 2));
  console.log('\nAll scraped content written to scripts/scraped_content.json');
}

scrape();
