/**
 * Diversity Collective Ventura County — GitHub Repository & jsDelivr CDN Media Helper
 * Centralized image delivery abstraction providing global edge delivery via jsDelivr CDN
 * from the GitHub repository, with seamless fallback to local /images/ assets.
 * 
 * Replaces Cloudinary with GitHub storage + jsDelivr multi-CDN network.
 */

export const DEFAULT_GITHUB_OWNER = 'diversity-collective';
export const DEFAULT_GITHUB_REPO = 'diversity-collectives-v1';
export const DEFAULT_GITHUB_BRANCH = 'main';

const ENV_OWNER = (typeof window !== 'undefined' ? import.meta.env?.VITE_GITHUB_OWNER : (typeof process !== 'undefined' ? process?.env?.VITE_GITHUB_OWNER : '')) || '';
const ENV_REPO = (typeof window !== 'undefined' ? import.meta.env?.VITE_GITHUB_REPO : (typeof process !== 'undefined' ? process?.env?.VITE_GITHUB_REPO : '')) || '';
const ENV_BRANCH = (typeof window !== 'undefined' ? import.meta.env?.VITE_GITHUB_BRANCH : (typeof process !== 'undefined' ? process?.env?.VITE_GITHUB_BRANCH : '')) || 'main';
const CDN_PROVIDER = (typeof window !== 'undefined' ? import.meta.env?.VITE_CDN_PROVIDER : (typeof process !== 'undefined' ? process?.env?.VITE_CDN_PROVIDER : '')) || '';

/**
 * Builds high-performance jsDelivr CDN URL for an asset committed to GitHub repository
 * @param {Object} [options]
 * @param {string} [options.owner]
 * @param {string} [options.repo]
 * @param {string} [options.branch]
 * @param {string} [options.path]
 * @returns {string} jsDelivr CDN URL
 */
export function buildJsDelivrUrl({
  owner = ENV_OWNER || DEFAULT_GITHUB_OWNER,
  repo = ENV_REPO || DEFAULT_GITHUB_REPO,
  branch = ENV_BRANCH || DEFAULT_GITHUB_BRANCH,
  path = ''
} = {}) {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  if (!cleanPath) return '';
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${cleanPath}`;
}

/**
 * Build an optimized jsDelivr CDN delivery URL or return local fallback
 * @param {string} publicIdOrPath - Asset path or filename (e.g. '/images/crc-building.jpg')
 * @param {Object} [options]
 * @param {boolean} [options.cdn] - Force CDN delivery URL
 * @param {boolean} [options.local] - Force local path
 * @param {string} [options.owner] - Override GitHub owner
 * @param {string} [options.repo] - Override GitHub repo
 * @param {string} [options.branch] - Override GitHub branch
 * @returns {string} jsDelivr CDN URL or local asset path
 */
export function getOptimizedImageUrl(publicIdOrPath, options = {}) {
  if (!publicIdOrPath) return '/images/hero-community.jpg';

  // If already an absolute external URL, data URL, or blob URL, return as-is
  if (
    publicIdOrPath.startsWith('http://') ||
    publicIdOrPath.startsWith('https://') ||
    publicIdOrPath.startsWith('data:') ||
    publicIdOrPath.startsWith('blob:')
  ) {
    return publicIdOrPath;
  }

  // If local fallback forced or relative provider explicitly requested
  if (options.local || CDN_PROVIDER === 'relative') {
    return publicIdOrPath.startsWith('/') ? publicIdOrPath : `/${publicIdOrPath}`;
  }

  const owner = options.owner || ENV_OWNER;
  const repo = options.repo || ENV_REPO;
  const branch = options.branch || ENV_BRANCH || DEFAULT_GITHUB_BRANCH;

  // If owner and repo are not configured and cdn flag is not forced, preserve local path
  if (!options.cdn && (!owner || !repo)) {
    return publicIdOrPath;
  }

  const targetOwner = owner || DEFAULT_GITHUB_OWNER;
  const targetRepo = repo || DEFAULT_GITHUB_REPO;

  let clean = publicIdOrPath.replace(/^\/+/, '');
  if (clean.startsWith('images/')) {
    clean = `public/${clean}`;
  } else if (!clean.startsWith('public/')) {
    clean = `public/images/${clean}`;
  }

  return buildJsDelivrUrl({
    owner: targetOwner,
    repo: targetRepo,
    branch,
    path: clean
  });
}

/**
 * Generate responsive srcset string for responsive <img> tags
 */
export function getResponsiveImageSrcSet(publicIdOrPath, widths = [320, 640, 960, 1280]) {
  if (!publicIdOrPath || publicIdOrPath.startsWith('data:') || publicIdOrPath.startsWith('blob:')) {
    return undefined;
  }

  const base = getOptimizedImageUrl(publicIdOrPath);
  return widths.map(w => `${base} ${w}w`).join(', ');
}
