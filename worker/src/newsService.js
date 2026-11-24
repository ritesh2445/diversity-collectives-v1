/**
 * Diversity Collective Ventura County — Dedicated Turso News & Blog Service
 *
 * Stores news & blog articles in a dedicated indexed SQLite/Turso table (`news_articles`)
 * rather than inside the 5 MB `site_state` JSON blob, enabling 10,000+ articles (~80-160 MB)
 * comfortably within Turso's 5 GB free tier while keeping homepage loads fast via pagination.
 */

export async function ensureNewsTable(db) {
  if (!db) return;
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS news_articles (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      body TEXT,
      category TEXT DEFAULT 'Community & Culture',
      author TEXT DEFAULT 'DCVC Communications Team',
      published_at TEXT,
      reading_time TEXT DEFAULT '3 min read',
      image TEXT,
      images_json TEXT,
      tags_json TEXT,
      status TEXT DEFAULT 'published',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    args: []
  });
  await db.execute({
    sql: `CREATE INDEX IF NOT EXISTS idx_news_status_created ON news_articles (status, created_at DESC)`,
    args: []
  });
}

function rowToArticle(row) {
  let images = [];
  let tags = [];
  try {
    images = JSON.parse(row.images_json || '[]');
  } catch {
    images = [];
  }
  try {
    tags = JSON.parse(row.tags_json || '[]');
  } catch {
    tags = [];
  }
  const primaryImage = row.image || (Array.isArray(images) && images[0]) || '/images/community-gathering.jpg';
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || '',
    body: row.body || '',
    content: row.body || '',
    category: row.category || 'Community & Culture',
    author: row.author || 'DCVC Communications Team',
    publishedAt: row.published_at || '',
    publishDate: row.published_at || '',
    date: row.published_at || '',
    readingTime: row.reading_time || '3 min read',
    readTime: row.reading_time || '3 min read',
    image: primaryImage,
    images: Array.isArray(images) && images.length > 0 ? images : [primaryImage],
    tags: Array.isArray(tags) ? tags : [],
    status: row.status || 'published',
    isDraft: row.status === 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function slugifyTitle(title, fallbackId) {
  const base = String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base || String(fallbackId || `article-${Date.now()}`);
}

export async function listNewsArticles(db, { page = 1, limit = 12, category = '', search = '', includeDrafts = false } = {}) {
  if (!db) return { articles: [], total: 0, page: 1, limit, totalPages: 1 };
  await ensureNewsTable(db);

  const safeLimit = Math.min(Math.max(1, Number(limit) || 12), 100);
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  const whereClauses = [];
  const args = [];

  if (!includeDrafts) {
    whereClauses.push(`(status IS NULL OR status != 'draft')`);
  }
  if (category && category !== 'All') {
    whereClauses.push(`category = ?`);
    args.push(category);
  }
  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    whereClauses.push(`(LOWER(title) LIKE ? OR LOWER(COALESCE(excerpt, '')) LIKE ? OR LOWER(COALESCE(category, '')) LIKE ?)`);
    args.push(q, q, q);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRes = await db.execute({
    sql: `SELECT COUNT(*) AS cnt FROM news_articles ${whereSql}`,
    args
  });
  const total = Number(countRes.rows?.[0]?.cnt || 0);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  const rowsRes = await db.execute({
    sql: `SELECT * FROM news_articles ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, safeLimit, offset]
  });

  return {
    articles: (rowsRes.rows || []).map(rowToArticle),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages
  };
}

export async function getNewsArticleBySlugOrId(db, slugOrId) {
  if (!db || !slugOrId) return null;
  await ensureNewsTable(db);
  const res = await db.execute({
    sql: `SELECT * FROM news_articles WHERE slug = ? OR id = ? LIMIT 1`,
    args: [slugOrId, slugOrId]
  });
  if (!res.rows || res.rows.length === 0) return null;
  return rowToArticle(res.rows[0]);
}

export async function upsertNewsArticle(db, payload = {}) {
  if (!db) throw new Error('Database connection not available');
  await ensureNewsTable(db);

  const id = String(payload.id || `news-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`).trim();
  const title = String(payload.title || '').trim();
  if (!title) throw new Error('Article title is required.');

  const slug = String(payload.slug || slugifyTitle(title, id)).trim();
  const excerpt = String(payload.excerpt || '').trim();
  const body = String(payload.body || payload.content || '').trim();
  const category = String(payload.category || 'Community & Culture').trim();
  const author = String(payload.author || 'DCVC Communications Team').trim();
  const publishedAt = String(
    payload.publishedAt ||
    payload.publishDate ||
    payload.date ||
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  ).trim();
  const readingTime = String(payload.readingTime || payload.readTime || '3 min read').trim();
  const images = Array.isArray(payload.images) && payload.images.length > 0
    ? payload.images
    : (payload.image ? [payload.image] : ['/images/community-gathering.jpg']);
  const image = String(payload.image || images[0] || '/images/community-gathering.jpg').trim();
  const tags = Array.isArray(payload.tags)
    ? payload.tags
    : (typeof payload.tags === 'string' ? payload.tags.split(',').map((t) => t.trim()).filter(Boolean) : []);
  const status = payload.status === 'draft' || payload.isDraft === true ? 'draft' : 'published';
  const nowIso = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO news_articles (
      id, slug, title, excerpt, body, category, author, published_at, reading_time, image, images_json, tags_json, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      title = excluded.title,
      excerpt = excluded.excerpt,
      body = excluded.body,
      category = excluded.category,
      author = excluded.author,
      published_at = excluded.published_at,
      reading_time = excluded.reading_time,
      image = excluded.image,
      images_json = excluded.images_json,
      tags_json = excluded.tags_json,
      status = excluded.status,
      updated_at = excluded.updated_at`,
    args: [
      id,
      slug,
      title,
      excerpt,
      body,
      category,
      author,
      publishedAt,
      readingTime,
      image,
      JSON.stringify(images),
      JSON.stringify(tags),
      status,
      nowIso,
      nowIso
    ]
  });

  return getNewsArticleBySlugOrId(db, id);
}

export async function deleteNewsArticle(db, idOrSlug) {
  if (!db) throw new Error('Database connection not available');
  await ensureNewsTable(db);
  await db.execute({
    sql: `DELETE FROM news_articles WHERE id = ? OR slug = ?`,
    args: [idOrSlug, idOrSlug]
  });
  return { deleted: true, id: idOrSlug };
}

export async function deleteAllNewsArticles(db) {
  if (!db) throw new Error('Database connection not available');
  await ensureNewsTable(db);
  await db.execute({ sql: `DELETE FROM news_articles`, args: [] });
  return { deletedAll: true };
}
