/**
 * Diversity Collective Ventura County — GitHub + jsDelivr CDN Gallery Service
 * 
 * Manages community image storage directly in GitHub and delivers assets
 * globally via the jsDelivr multi-CDN edge network.
 * 
 * Features:
 *  - Direct Git commit uploading via GitHub Contents REST API
 *  - Global edge delivery through jsDelivr (Fastly/Cloudflare multi-CDN)
 *  - Seamless local asset fallback for offline/development environments
 *  - Persistent metadata indexing in Turso libSQL database
 */

export const DEFAULT_GITHUB_OWNER = 'ritesh2445';
export const DEFAULT_GITHUB_REPO = 'diversity-collectives-v1';
export const DEFAULT_GITHUB_BRANCH = 'main';

/**
 * Builds high-performance jsDelivr CDN URL for an asset committed to GitHub
 */
export function buildJsDelivrUrl({
  owner = DEFAULT_GITHUB_OWNER,
  repo = DEFAULT_GITHUB_REPO,
  branch = DEFAULT_GITHUB_BRANCH,
  path = ''
} = {}) {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  if (!cleanPath) return '';
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${cleanPath}`;
}

/**
 * Sanitizes a filename into an SEO-friendly, kebab-case string
 */
export function sanitizeFilename(originalName = '') {
  const parts = String(originalName).trim().split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, '') : 'jpg';
  const name = parts.join('.')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'gallery-image';
  return `${name}.${ext}`;
}

/**
 * Commits an image file directly to GitHub repository via REST API
 */
export async function uploadToGitHub({
  githubToken,
  owner = DEFAULT_GITHUB_OWNER,
  repo = DEFAULT_GITHUB_REPO,
  branch = DEFAULT_GITHUB_BRANCH,
  path,
  contentBase64,
  commitMessage
}) {
  if (!githubToken) {
    return {
      success: false,
      error: 'GitHub Personal Access Token (GITHUB_TOKEN) is not configured.'
    };
  }

  if (!path || !contentBase64) {
    return {
      success: false,
      error: 'File path and base64 content are required for GitHub upload.'
    };
  }

  const cleanPath = String(path).replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  // Clean base64 data prefix if present (e.g., data:image/jpeg;base64,...)
  const pureBase64 = contentBase64.includes(',')
    ? contentBase64.split(',')[1]
    : contentBase64;

  const body = {
    message: commitMessage || `feat(gallery): add community image ${cleanPath.split('/').pop()}`,
    content: pureBase64,
    branch: branch || 'main'
  };

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'User-Agent': 'DCVC-Gallery-Engine/1.0',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data.message || `GitHub API error (${res.status})`
      };
    }

    return {
      success: true,
      sha: data.content?.sha,
      path: data.content?.path || cleanPath,
      downloadUrl: data.content?.download_url
    };
  } catch (err) {
    return {
      success: false,
      error: `Network failure connecting to GitHub: ${err.message}`
    };
  }
}

/**
 * Deletes an image file from the GitHub repository
 */
export async function deleteFromGitHub({
  githubToken,
  owner = DEFAULT_GITHUB_OWNER,
  repo = DEFAULT_GITHUB_REPO,
  branch = DEFAULT_GITHUB_BRANCH,
  path,
  sha,
  commitMessage
}) {
  if (!githubToken || !path || !sha) {
    return { success: false, error: 'Token, path, and file SHA are required to delete from GitHub.' };
  }

  const cleanPath = String(path).replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'User-Agent': 'DCVC-Gallery-Engine/1.0',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage || `chore(gallery): remove ${cleanPath.split('/').pop()}`,
        sha,
        branch: branch || 'main'
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Failed to delete file from GitHub' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Baseline Seed Photos used for fallback when database is empty or offline
 */
export const FALLBACK_GALLERY_PHOTOS = [
  {
    id: 'gal-1',
    title: 'Ventura County Pride Coastline Gathering',
    category: 'Festivals & Pride',
    year: '2026',
    image_url: '/images/community-gathering.jpg',
    cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/community-gathering.jpg',
    github_path: 'public/images/community-gathering.jpg',
    description: 'Community members uniting on the Ventura Promenade for celebration, music, and solidarity.',
    quote: 'A coastline illuminated in rainbows, proving love is louder than hate.',
    featured: 1
  },
  {
    id: 'gal-2',
    title: 'Rainbow Umbrella Youth Peer Circle',
    category: 'Youth & Safe Harbor',
    year: '2026',
    image_url: '/images/youth-umbrella.jpg',
    cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/youth-umbrella.jpg',
    github_path: 'public/images/youth-umbrella.jpg',
    description: 'Weekly youth peer support circle exploring creative art and self-expression in a trauma-informed safe harbor.',
    quote: 'Creating an unconditional safe harbor where every young person is celebrated.',
    featured: 1
  },
  {
    id: 'gal-3',
    title: 'First Countywide Youth Pride Prom',
    category: 'Youth & Safe Harbor',
    year: '2023',
    image_url: '/images/pride-prom.jpeg',
    cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/pride-prom.jpeg',
    github_path: 'public/images/pride-prom.jpeg',
    description: 'Hundreds of LGBTQ+ high schoolers across all 10 county cities dancing freely without judgment.',
    quote: 'The magical, affirming night we all deserved in high school.',
    featured: 1
  },
  {
    id: 'gal-4',
    title: 'Dedicated Community Volunteers & Mutual Aid',
    category: 'Volunteers & Action',
    year: '2026',
    image_url: '/images/volunteers.jpg',
    cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/volunteers.jpg',
    github_path: 'public/images/volunteers.jpg',
    description: 'Passionate community members packing SHINE With Me safer-sex and hygiene kits at our outreach pavilion.',
    quote: 'Grassroots mutual aid powered by over 300 passionate volunteers each year.',
    featured: 1
  },
  {
    id: 'gal-5',
    title: 'Community Resource Center Flagship Sanctuary',
    category: 'Sanctuary & Community',
    year: '2026',
    image_url: '/images/crc-building.jpg',
    cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/crc-building.jpg',
    github_path: 'public/images/crc-building.jpg',
    description: 'Our physical sanctuary at 2471 Portola Road, Suite 100 in Ventura, CA.',
    quote: 'A permanent front door for affirming care, education, and belonging.',
    featured: 1
  },
  {
    id: 'gal-6',
    title: 'Diversity SHINES Health Testing Clinic',
    category: 'Health & Wellness',
    year: '2026',
    image_url: '/images/shines-screening.jpg',
    cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/shines-screening.jpg',
    github_path: 'public/images/shines-screening.jpg',
    description: 'State-certified counselors administering free, confidential rapid HIV and STI screenings.',
    quote: '15-minute rapid results with zero judgment and zero cost.',
    featured: 1
  },
  {
    id: 'gal-7',
    title: 'Pacific Coastline Sunset Solidarity Gathering',
    category: 'Festivals & Pride',
    year: '2025',
    image_url: '/images/ventura-coast.jpg',
    cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/ventura-coast.jpg',
    github_path: 'public/images/ventura-coast.jpg',
    description: 'Sunset community connection gathering on the Ventura shore reflecting on a decade of progress.',
    quote: 'Where our Pacific horizon meets our enduring community resilience.',
    featured: 1
  },
  {
    id: 'gal-8',
    title: 'Little Unicorns Family & Youth Circle',
    category: 'Kids & Families',
    year: '2026',
    image_url: '/images/little-unicorns.png',
    cdn_url: 'https://cdn.jsdelivr.net/gh/ritesh2445/diversity-collectives-v1@main/public/images/little-unicorns.png',
    github_path: 'public/images/little-unicorns.png',
    description: 'Monthly gentle gatherings for pre-teens ages 9–13, parents, caregivers, and affirming allies.',
    quote: 'Empowering affirming families and building confidence from the very start.',
    featured: 1
  }
];

/**
 * Queries gallery photos from Turso database with filters
 */
export async function listGalleryPhotos(db, { category, year, featured, limit = 100, offset = 0 } = {}) {
  if (!db) {
    let result = [...FALLBACK_GALLERY_PHOTOS];
    if (category && category !== 'All') {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (year) {
      result = result.filter(p => p.year === String(year));
    }
    if (featured !== undefined) {
      const isFeat = featured === true || featured === 'true' || featured === 1;
      result = result.filter(p => Boolean(p.featured) === isFeat);
    }
    return result.slice(offset, offset + limit);
  }

  try {
    const conditions = [];
    const args = [];

    if (category && category !== 'All') {
      conditions.push('LOWER(category) = LOWER(?)');
      args.push(category);
    }

    if (year) {
      conditions.push('year = ?');
      args.push(String(year));
    }

    if (featured !== undefined) {
      const isFeat = featured === true || featured === 'true' || featured === 1 ? 1 : 0;
      conditions.push('featured = ?');
      args.push(isFeat);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM gallery_photos ${whereClause} ORDER BY featured DESC, year DESC, created_at DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const res = await db.execute({ sql, args });
    const rows = res.rows || [];

    if (rows.length === 0 && !category && !year) {
      return FALLBACK_GALLERY_PHOTOS;
    }

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      year: r.year,
      image_url: r.image_url,
      cdn_url: r.cdn_url || r.image_url,
      github_path: r.github_path,
      github_sha: r.github_sha,
      description: r.description,
      quote: r.quote,
      featured: Boolean(r.featured),
      created_at: r.created_at
    }));
  } catch (err) {
    console.warn('Failed to query gallery_photos from database, using fallback:', err.message);
    return FALLBACK_GALLERY_PHOTOS;
  }
}

/**
 * Inserts a new gallery photo record into database
 */
export async function addGalleryPhoto(db, photo) {
  if (!db) {
    const newRecord = {
      id: photo.id || `gal-${Date.now()}`,
      ...photo,
      created_at: new Date().toISOString()
    };
    return newRecord;
  }

  const id = photo.id || `gal-${crypto.randomUUID().slice(0, 8)}`;
  const sql = `INSERT INTO gallery_photos (
    id, title, category, year, image_url, cdn_url, github_path, github_sha, description, quote, featured, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;

  await db.execute({
    sql,
    args: [
      id,
      photo.title,
      photo.category || 'General Community',
      photo.year || String(new Date().getFullYear()),
      photo.image_url,
      photo.cdn_url || photo.image_url,
      photo.github_path || null,
      photo.github_sha || null,
      photo.description || null,
      photo.quote || null,
      photo.featured ? 1 : 0
    ]
  });

  return { id, ...photo };
}

/**
 * Deletes a gallery photo record from the database
 */
export async function deleteGalleryPhoto(db, id) {
  if (!db || !id) return { success: true };
  try {
    const existing = await db.execute({
      sql: `SELECT * FROM gallery_photos WHERE id = ? LIMIT 1`,
      args: [id]
    });
    const photo = existing.rows?.[0] || null;

    await db.execute({
      sql: `DELETE FROM gallery_photos WHERE id = ?`,
      args: [id]
    });

    return { success: true, photo };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
