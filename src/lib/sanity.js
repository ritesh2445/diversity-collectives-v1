/**
 * Diversity Collective Ventura County — Sanity CMS Client Adapter
 * Lightweight, read-only GROQ query abstraction for public frontend content delivery.
 * Keeps administrative and Studio code completely isolated from the visitor bundle.
 */

const SANITY_PROJECT_ID = typeof window !== 'undefined'
  ? (import.meta.env?.VITE_SANITY_PROJECT_ID || '')
  : '';

const SANITY_DATASET = typeof window !== 'undefined'
  ? (import.meta.env?.VITE_SANITY_DATASET || 'production')
  : 'production';

const SANITY_API_VERSION = '2024-03-01';

/**
 * Execute a GROQ query against Sanity's global CDN endpoint
 * @param {string} query - GROQ query string
 * @param {Object} [params] - Optional query parameters
 */
export async function fetchSanityContent(query, params = {}) {
  if (!SANITY_PROJECT_ID) {
    // In Phase 1 development without credentials, signal fallback to local verified fixtures
    return null;
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodedQuery}`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Sanity fetch error HTTP ${res.status}`);
    const json = await res.json();
    return json.result;
  } catch (err) {
    console.warn('[Sanity Client] Falling back to local data:', err.message);
    return null;
  }
}

/**
 * Standard GROQ Queries
 */
export const SANITY_QUERIES = {
  allPrograms: `*[_type == "program"] | order(chapter asc) {
    _id, title, slug, chapter, tagline, summary, description,
    audience, schedule, location, contactEmail, contactPhone,
    "heroImage": heroImage.asset->url, amenities
  }`,
  allEvents: `*[_type == "event"] | order(date asc) {
    _id, title, slug, date, time, category, location, address,
    description, registrationUrl, contactEmail, isCancelled,
    "image": image.asset->url
  }`,
  allBoardMembers: `*[_type == "boardMember"] | order(order asc) {
    _id, name, role, bio, "photo": photo.asset->url
  }`,
  allStaffMembers: `*[_type == "staffMember"] | order(order asc) {
    _id, name, title, department, bio, email, "photo": photo.asset->url
  }`,
  allSponsors: `*[_type == "sponsor"] | order(tier asc) {
    _id, name, shortName, tier, role, url, "logo": logo.asset->url
  }`,
  allNewsArticles: `*[_type == "newsArticle"] | order(publishedAt desc) {
    _id, title, slug, publishedAt, excerpt, author, readingTime,
    "mainImage": mainImage.asset->url, body
  }`,
  allGalleryItems: `*[_type == "galleryItem"] | order(date desc) {
    _id, title, category, date, description, "image": image.asset->url
  }`
};

