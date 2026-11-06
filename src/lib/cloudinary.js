/**
 * Diversity Collective Ventura County — Cloudinary Media Helper
 * Centralized image delivery abstraction providing automatic WebP/AVIF formatting,
 * responsive width scaling, and intelligent quality adjustments.
 * Safely falls back to local /images/ assets when Cloudinary cloud name is unconfigured.
 */

const CLOUD_NAME = typeof window !== 'undefined'
  ? (import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || '')
  : '';

/**
 * Build an optimized Cloudinary delivery URL or return local fallback
 * @param {string} publicIdOrPath - Cloudinary public ID or local asset path (e.g. '/images/crc-building.jpg')
 * @param {Object} [options]
 * @param {number} [options.width] - Target width in pixels
 * @param {number} [options.height] - Target height in pixels
 * @param {string} [options.crop='fill'] - Crop mode ('fill', 'scale', 'fit', 'thumb')
 * @param {string} [options.gravity='auto'] - Gravity focus
 * @param {string} [options.quality='auto'] - Quality setting ('auto', 'eco', 'best')
 * @param {string} [options.format='auto'] - Output format ('auto', 'webp', 'avif')
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(publicIdOrPath, options = {}) {
  if (!publicIdOrPath) return '/images/hero-community.jpg';

  // If already an absolute external URL or local path without Cloudinary configured, return as-is
  if (publicIdOrPath.startsWith('http') || !CLOUD_NAME || publicIdOrPath.startsWith('/images/')) {
    return publicIdOrPath;
  }

  const {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto',
    format = 'auto'
  } = options;

  const transforms = [
    `f_${format}`,
    `q_${quality}`
  ];

  if (width) transforms.push(`w_${width}`);
  if (height) {
    transforms.push(`h_${height}`);
    transforms.push(`c_${crop}`);
    transforms.push(`g_${gravity}`);
  }

  const transformString = transforms.join(',');
  const cleanId = publicIdOrPath.replace(/^\//, '');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformString}/${cleanId}`;
}

/**
 * Generate responsive srcset string for responsive <img> tags
 */
export function getResponsiveImageSrcSet(publicIdOrPath, widths = [320, 640, 960, 1280]) {
  if (!CLOUD_NAME || publicIdOrPath.startsWith('http') || publicIdOrPath.startsWith('/images/')) {
    return undefined;
  }

  return widths
    .map(w => `${getOptimizedImageUrl(publicIdOrPath, { width: w })} ${w}w`)
    .join(', ');
}

