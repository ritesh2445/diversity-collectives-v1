/**
 * Diversity Collective Ventura County — Authoritative Live Site State Service
 * Persists Hero design, Homepage layout blocks, Global Site Theme, and CMS overrides
 * in Turso with strict sanitization, URL allowlisting, and atomic version increments.
 */

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
const SAFE_HERO_ID_RE = /^[a-z0-9-]{1,64}$/i;
const SAFE_BLOCK_TYPE_RE = /^[a-z0-9_]{1,64}$/i;
const SAFE_FONT_NAME_RE = /^[A-Za-z0-9 _-]{1,64}$/;
const SAFE_COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([^;{}<>]+\)|linear-gradient\([^;{}<>]+\))$/i;
const SAFE_UNIT_RE = /^\d+(?:\.\d+)?(px|rem|em|%)?$/i;

const MAX_STATE_BYTES = 750 * 1024; // 750 KB cap on serialized live state

export function sanitizePublicUrl(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  if (trimmed.startsWith('#')) {
    return trimmed;
  }
  if (SAFE_DATA_IMAGE_RE.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

const URL_LIKE_KEY_RE = /(url|link|href|image|photo|src|logo|cover|avatar|website|spotlightImage|heroImage)$/i;

function sanitizeGenericValue(val, keyName = '', depth = 0) {
  if (depth > 6) return undefined;
  if (val === null || val === undefined) return val;
  if (typeof val === 'boolean' || typeof val === 'number') {
    return Number.isNaN(val) ? undefined : val;
  }
  if (typeof val === 'string') {
    if (URL_LIKE_KEY_RE.test(keyName)) {
      return sanitizePublicUrl(val, '');
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .slice(0, 250)
      .map((item) => sanitizeGenericValue(item, '', depth + 1))
      .filter((item) => item !== undefined);
  }
  if (typeof val === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      const sanitized = sanitizeGenericValue(v, k, depth + 1);
      if (sanitized !== undefined) {
        clean[k] = sanitized;
      }
    }
    return clean;
  }
  return undefined;
}

export function sanitizeSiteTheme(rawTheme) {
  if (!rawTheme || typeof rawTheme !== 'object' || Array.isArray(rawTheme)) {
    return null;
  }
  const clean = {};
  for (const [key, val] of Object.entries(rawTheme)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (key === 'headingFont' || key === 'bodyFont') {
      if (typeof val === 'string' && SAFE_FONT_NAME_RE.test(val.trim())) {
        clean[key] = val.trim();
      }
    } else if (key === 'fontSizeScale') {
      const num = Number(val);
      if (Number.isFinite(num) && num >= 75 && num <= 140) {
        clean[key] = num;
      }
    } else if (key === 'cardElevation') {
      if (['subtle', 'standard', 'pronounced'].includes(val)) {
        clean[key] = val;
      }
    } else if (/radius/i.test(key)) {
      if (typeof val === 'string' && SAFE_UNIT_RE.test(val.trim())) {
        clean[key] = val.trim();
      }
    } else if (typeof val === 'string' && SAFE_COLOR_RE.test(val.trim())) {
      clean[key] = val.trim();
    }
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

export function sanitizeLayoutBlocks(rawBlocks) {
  if (!Array.isArray(rawBlocks)) return null;
  const blocks = [];
  for (let i = 0; i < Math.min(rawBlocks.length, 30); i++) {
    const raw = rawBlocks[i];
    if (!raw || typeof raw !== 'object' || typeof raw.type !== 'string') continue;
    const blockType = raw.type.trim();
    if (!SAFE_BLOCK_TYPE_RE.test(blockType)) continue;
    blocks.push({
      id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim().slice(0, 80) : `block-${blockType}`,
      type: blockType,
      title: typeof raw.title === 'string' ? raw.title.slice(0, 140) : blockType,
      enabled: raw.enabled !== false,
      props: sanitizeGenericValue(raw.props && typeof raw.props === 'object' ? raw.props : {}, '', 1) || {}
    });
  }
  return blocks.length > 0 ? blocks : null;
}

const CMS_ALLOWED_KEYS = new Set([
  'programs',
  'events',
  'news',
  'resources',
  'staff',
  'gallery',
  'memoryLane',
  'settings',
  'trainings',
  'testimonials',
  'lastUpdated',
  'deletedPrograms',
  'deletedEvents',
  'deletedStaff'
]);

const SAFE_STATUS_TYPE_RE = /^(live|launch_timer|maintenance|custom)$/i;
const SAFE_STATUS_ID_RE = /^[a-z0-9_-]{1,64}$/i;

function sanitizeSiteStatus(rawStatus) {
  if (!rawStatus || typeof rawStatus !== 'object' || Array.isArray(rawStatus)) return null;
  const clean = {};
  for (const [key, val] of Object.entries(rawStatus)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (key === 'id') {
      if (typeof val === 'string' && SAFE_STATUS_ID_RE.test(val.trim())) clean.id = val.trim();
    } else if (key === 'name') {
      if (typeof val === 'string') clean.name = val.trim().slice(0, 120);
    } else if (key === 'type') {
      if (typeof val === 'string' && SAFE_STATUS_TYPE_RE.test(val.trim())) clean.type = val.trim().toLowerCase();
    } else if (key === 'isActive') {
      clean.isActive = Boolean(val);
    } else if (key === 'isPredefined') {
      clean.isPredefined = Boolean(val);
    } else if (key === 'message') {
      if (typeof val === 'string') clean.message = val.trim().slice(0, 500);
    } else if (key === 'timerEnd') {
      if (typeof val === 'string' || val === null) clean.timerEnd = val;
    } else if (key === 'quotes') {
      if (Array.isArray(val)) {
        clean.quotes = val.filter(q => typeof q === 'string').map(q => q.trim().slice(0, 300)).slice(0, 50);
      }
    } else if (key === 'gradientColors') {
      if (Array.isArray(val)) {
        clean.gradientColors = val.filter(c => typeof c === 'string' && SAFE_COLOR_RE.test(c.trim())).slice(0, 20);
      }
    } else if (key === 'fontFamily') {
      if (typeof val === 'string') clean.fontFamily = val.trim().slice(0, 100);
    } else if (key === 'createdAt' || key === 'updatedAt') {
      if (typeof val === 'string') clean[key] = val;
    }
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

export function sanitizeCmsData(rawCms) {
  if (!rawCms || typeof rawCms !== 'object' || Array.isArray(rawCms)) return null;
  const clean = {};
  for (const [key, val] of Object.entries(rawCms)) {
    if (!CMS_ALLOWED_KEYS.has(key)) continue;
    clean[key] = sanitizeGenericValue(val, key, 1);
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

export function sanitizeSiteStatePatch(patch, existingState = {}) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('Site state payload must be a JSON object.');
  }

  const next = { ...(existingState && typeof existingState === 'object' ? existingState : {}) };

  if (Object.prototype.hasOwnProperty.call(patch, 'heroTheme')) {
    const heroId = typeof patch.heroTheme === 'string' ? patch.heroTheme.trim() : '';
    if (!SAFE_HERO_ID_RE.test(heroId)) {
      throw new Error('Invalid heroTheme identifier.');
    }
    next.heroTheme = heroId;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'layoutBlocks')) {
    const cleanBlocks = sanitizeLayoutBlocks(patch.layoutBlocks);
    if (!cleanBlocks) {
      throw new Error('layoutBlocks must be a non-empty array of valid sections.');
    }
    next.layoutBlocks = cleanBlocks;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'siteTheme')) {
    const cleanTheme = sanitizeSiteTheme(patch.siteTheme);
    if (!cleanTheme) {
      throw new Error('siteTheme must contain valid color, font, or spacing tokens.');
    }
    next.siteTheme = {
      ...(next.siteTheme && typeof next.siteTheme === 'object' ? next.siteTheme : {}),
      ...cleanTheme
    };
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'cmsData')) {
    const cleanCms = sanitizeCmsData(patch.cmsData);
    if (!cleanCms) {
      throw new Error('cmsData must be a valid CMS collections object.');
    }
    next.cmsData = {
      ...(next.cmsData && typeof next.cmsData === 'object' ? next.cmsData : {}),
      ...cleanCms,
      lastUpdated: new Date().toISOString()
    };
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'siteStatus')) {
    const cleanStatus = sanitizeSiteStatus(patch.siteStatus);
    if (!cleanStatus) {
      throw new Error('siteStatus must contain valid status configuration.');
    }
    next.siteStatus = cleanStatus;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'siteFeatures')) {
    const cleanFeatures = sanitizeGenericValue(patch.siteFeatures, '', 1);
    if (cleanFeatures && typeof cleanFeatures === 'object') {
      next.siteFeatures = cleanFeatures;
    }
  }

  const serialized = JSON.stringify(next);
  if (serialized.length > MAX_STATE_BYTES) {
    throw new Error('Site state payload exceeds maximum allowed size.');
  }

  return next;
}

async function ensureSiteStateTable(db) {
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS site_state (
      state_key TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    args: []
  });
}

export async function readSiteState(db) {
  if (!db) {
    return { version: 0, updatedAt: null, updatedBy: null, state: {} };
  }
  try {
    await ensureSiteStateTable(db);
    const res = await db.execute({
      sql: `SELECT payload_json, version, updated_by, updated_at FROM site_state WHERE state_key = 'live' LIMIT 1`,
      args: []
    });
    if (!res.rows || res.rows.length === 0) {
      return { version: 0, updatedAt: null, updatedBy: null, state: {} };
    }
    const row = res.rows[0];
    let parsed = {};
    try {
      parsed = JSON.parse(row.payload_json || '{}');
    } catch {
      parsed = {};
    }
    return {
      version: Number(row.version || 1),
      updatedAt: row.updated_at || null,
      updatedBy: row.updated_by || null,
      state: parsed
    };
  } catch (err) {
    console.warn('[SiteState] Read failed:', err.message);
    return { version: 0, updatedAt: null, updatedBy: null, state: {} };
  }
}

export async function writeSiteStatePatch(db, patch, actorEmail = 'admin@diversitycollective.org') {
  if (!db) {
    throw new Error('Database connection not available');
  }
  await ensureSiteStateTable(db);
  const current = await readSiteState(db);
  const nextState = sanitizeSiteStatePatch(patch, current.state);
  const nextVersion = Number(current.version || 0) + 1;
  const nowIso = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO site_state (state_key, payload_json, version, updated_by, updated_at)
          VALUES ('live', ?, ?, ?, ?)
          ON CONFLICT(state_key) DO UPDATE SET
            payload_json = excluded.payload_json,
            version = excluded.version,
            updated_by = excluded.updated_by,
            updated_at = excluded.updated_at`,
    args: [JSON.stringify(nextState), nextVersion, actorEmail, nowIso]
  });

  return {
    version: nextVersion,
    updatedAt: nowIso,
    updatedBy: actorEmail,
    state: nextState
  };
}

export async function resetSiteState(db, scope = 'all', actorEmail = 'admin@diversitycollective.org') {
  if (!db) {
    throw new Error('Database connection not available');
  }
  await ensureSiteStateTable(db);
  const current = await readSiteState(db);
  let nextState = {};

  if (scope !== 'all' && current.state && typeof current.state === 'object') {
    nextState = { ...current.state };
    if (scope === 'layout') delete nextState.layoutBlocks;
    else if (scope === 'hero') delete nextState.heroTheme;
    else if (scope === 'theme') delete nextState.siteTheme;
    else if (scope === 'cms') delete nextState.cmsData;
  }

  const nextVersion = Number(current.version || 0) + 1;
  const nowIso = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO site_state (state_key, payload_json, version, updated_by, updated_at)
          VALUES ('live', ?, ?, ?, ?)
          ON CONFLICT(state_key) DO UPDATE SET
            payload_json = excluded.payload_json,
            version = excluded.version,
            updated_by = excluded.updated_by,
            updated_at = excluded.updated_at`,
    args: [JSON.stringify(nextState), nextVersion, actorEmail, nowIso]
  });

  return {
    version: nextVersion,
    updatedAt: nowIso,
    updatedBy: actorEmail,
    state: nextState
  };
}

