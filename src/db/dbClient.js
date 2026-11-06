/**
 * Diversity Collective Ventura County — Unified Database Layer & Query Abstraction
 * Supports libSQL / Turso distributed database with:
 *  - Error handling
 *  - Input validation
 *  - Cursor-based and offset pagination
 *  - Indexed Full-Text Search (FTS5)
 *  - Transaction execution helper
 *  - Safe fallback for offline development & mock testing
 */

import { createClient } from '@libsql/client/web';

/**
 * Factory to instantiate database client
 * @param {Object} config - { url, authToken }
 */
export function createDbClient(config = {}) {
  const url = config.url || (typeof process !== 'undefined' ? process.env?.TURSO_DATABASE_URL : null);
  const authToken = config.authToken || (typeof process !== 'undefined' ? process.env?.TURSO_AUTH_TOKEN : null);

  if (!url || !authToken) {
    return null;
  }

  return createClient({ url, authToken });
}

/**
 * Execute query safely with error formatting
 */
export async function executeQuery(db, sql, args = []) {
  if (!db) {
    return { rows: [], columns: [], rowsAffected: 0, offline: true };
  }

  try {
    const result = await db.execute({ sql, args });
    return {
      rows: result.rows || [],
      columns: result.columns || [],
      rowsAffected: result.rowsAffected || 0
    };
  } catch (err) {
    console.error(`[DB Error] Query failed: "${sql}"`, err);
    throw new Error(`Database execution failed: ${err.message}`);
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function executeTransaction(db, statements = []) {
  if (!db) {
    return { success: true, offline: true };
  }

  try {
    const result = await db.batch(statements, 'write');
    return { success: true, results: result };
  } catch (err) {
    console.error('[DB Transaction Error] Batch failed:', err);
    throw new Error(`Transaction failed: ${err.message}`);
  }
}

/**
 * High-performance cursor-based directory search
 */
export async function searchDirectory(db, { query = '', category = '', city = '', cursor = null, limit = 12 }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

  let sql = `
    SELECT id, slug, name, category, description, address, city, zip, phone, email, website, instagram, hours, logo_url, cover_url, is_featured, is_verified, created_at
    FROM businesses
    WHERE status = 'approved'
  `;
  const args = [];

  if (category && category !== 'All Categories') {
    sql += ` AND category = ?`;
    args.push(category);
  }

  if (city && city !== 'All Cities') {
    sql += ` AND city = ?`;
    args.push(city);
  }

  if (query?.trim()) {
    sql += ` AND id IN (SELECT id FROM businesses_fts WHERE businesses_fts MATCH ?)`;
    args.push(`${query.trim()}*`);
  }

  if (cursor) {
    sql += ` AND (created_at < ? OR (created_at = ? AND id < ?))`;
    const [cDate, cId] = cursor.split('|');
    args.push(cDate, cDate, cId || '');
  }

  sql += ` ORDER BY is_featured DESC, created_at DESC, id DESC LIMIT ?`;
  args.push(safeLimit + 1);

  const res = await executeQuery(db, sql, args);
  const rows = res.rows || [];
  const hasMore = rows.length > safeLimit;
  const items = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore && items.length > 0 
    ? `${items[items.length - 1].created_at}|${items[items.length - 1].id}` 
    : null;

  return {
    items,
    hasMore,
    nextCursor
  };
}

