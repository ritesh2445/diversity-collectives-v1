/**
 * Diversity Collective Ventura County — Sanity CMS & Global Edge CDN Adapter
 * Queries Sanity's globally cached Edge APICDN (`apicdn.sanity.io`) and transforms
 * uploaded Sanity image assets (`cdn.sanity.io`) with automatic WebP/AVIF formatting
 * for instant rendering across every page.
 */

const SANITY_PROJECT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SANITY_PROJECT_ID) || '6abul0sq';

const SANITY_DATASET =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SANITY_DATASET) || 'production';

const SANITY_API_VERSION = '2024-03-01';

/**
 * Transform any Sanity Asset CDN URL (`cdn.sanity.io/images/...`) into an instant,
 * format-negotiated WebP/AVIF + quality-optimized URL served from Sanity's global edge CDN.
 * Non-Sanity URLs pass through unchanged.
 */
export function optimizeSanityImageUrl(url, { width = 1200, quality = 85, fit = 'max' } = {}) {
  if (!url || typeof url !== 'string') return url || '';
  if (!url.includes('cdn.sanity.io/images/')) return url;
  const cleanUrl = url.split('?')[0];
  const params = new URLSearchParams({
    auto: 'format',
    fit,
    q: String(quality)
  });
  if (width) params.set('w', String(width));
  return `${cleanUrl}?${params.toString()}`;
}

/**
 * Warm browser cache for critical Sanity CDN images so they appear instantaneously.
 */
export function preloadImageUrls(urls = []) {
  if (typeof window === 'undefined' || !Array.isArray(urls)) return;
  const seen = new Set();
  urls.slice(0, 12).forEach((raw) => {
    const src = optimizeSanityImageUrl(raw, { width: 1200, quality: 85 });
    if (!src || seen.has(src)) return;
    seen.add(src);
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  });
}

/**
 * Execute a GROQ query against Sanity's global Edge APICDN endpoint.
 */
export async function fetchSanityContent(query, params = {}) {
  if (!SANITY_PROJECT_ID) return null;

  const url = new URL(
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`
  );
  url.searchParams.set('query', query);
  Object.entries(params || {}).forEach(([k, v]) => {
    url.searchParams.set(`$${k}`, JSON.stringify(v));
  });

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Sanity CDN HTTP ${res.status}`);
    const json = await res.json();
    return json.result;
  } catch (err) {
    console.warn('[Sanity CDN] Falling back to cached/seed data:', err.message);
    return null;
  }
}

/**
 * Standard GROQ Queries
 */
export const SANITY_QUERIES = {
  siteSettings: `*[_type == "siteSettings" && _id == "siteSettings"][0]{
    orgName, tagline, mission, ein, phone, email, address, hours, socials,
    announcementBanner,
    hero{
      titleLine1, titleAccentWord, titleLine2, subtitle,
      primaryCtaText, primaryCtaLink, secondaryCtaText, secondaryCtaLink,
      emailAddress, cardTitle, cardSubtitle, helplineText, heroTheme,
      "spotlightImage": spotlightImage.asset->url
    },
    theme,
    sections
  }`,
  allPrograms: `*[_type == "program"] | order(order asc, chapter asc) {
    _id, title, "slug": coalesce(slug.current, _id), chapter, tagline, summary, description,
    audience, schedule, location, contactEmail, contactPhone, accentColor, imageFit,
    "heroImage": heroImage.asset->url, amenities, order
  }`,
  allEvents: `*[_type == "event"] | order(order asc, date asc) {
    _id, title, "slug": coalesce(slug.current, _id), date, month, day, year, time,
    category, location, address, description, registrationUrl, contactEmail,
    isRecurring, recurrenceRule, isCancelled, cancellationReason, featured, order,
    "image": image.asset->url
  }`,
  allBoardMembers: `*[_type == "boardMember"] | order(order asc) {
    _id, name, role, bio, "photo": photo.asset->url, order
  }`,
  allStaffMembers: `*[_type == "staffMember"] | order(order asc) {
    _id, name, title, department, bio, email, "photo": photo.asset->url, order
  }`,
  allSponsors: `*[_type == "sponsor"] | order(order asc, tier asc) {
    _id, name, shortName, tier, role, url, "logo": logo.asset->url, order
  }`,
  allResources: `*[_type == "resource"] | order(category asc, title asc) {
    _id, title, category, description, phone, website, address, city,
    spanishAvailable, isFreeOrSlidingScale
  }`,
  allNewsArticles: `*[_type == "newsArticle"] | order(publishedAt desc) {
    _id, title, "slug": coalesce(slug.current, _id), publishedAt, excerpt, author, readingTime,
    "mainImage": coalesce(coverImage.asset->url, mainImage.asset->url), body
  }`,
  allGalleryItems: `*[_type == "galleryItem"] | order(order asc, year desc) {
    _id, title, eventTag, caption, alt, year, order,
    "image": coalesce(image.asset->url, imageUrl)
  }`,
  allTrainingModules: `*[_type == "trainingModule"] | order(order asc) {
    _id, code, title, "slug": coalesce(slug.current, _id), duration, audience,
    format, description, learningObjectives, curriculum, ceus, feeStructure, order
  }`
};

/**
 * Compound single-roundtrip fetch for the entire website via Sanity APICDN.
 */
export const SANITY_MASTER_QUERY = `{
  "siteSettings": ${SANITY_QUERIES.siteSettings},
  "programs": ${SANITY_QUERIES.allPrograms},
  "events": ${SANITY_QUERIES.allEvents},
  "boardMembers": ${SANITY_QUERIES.allBoardMembers},
  "staffMembers": ${SANITY_QUERIES.allStaffMembers},
  "sponsors": ${SANITY_QUERIES.allSponsors},
  "resources": ${SANITY_QUERIES.allResources},
  "newsArticles": ${SANITY_QUERIES.allNewsArticles},
  "galleryItems": ${SANITY_QUERIES.allGalleryItems},
  "trainingModules": ${SANITY_QUERIES.allTrainingModules}
}`;

export async function fetchAllSanityWebsiteData() {
  return fetchSanityContent(SANITY_MASTER_QUERY);
}
