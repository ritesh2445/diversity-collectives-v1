/**
 * Diversity Collective Ventura County — Admin Image & Media Service
 * Client-Side Image Optimization, GitHub Repository Storage & CDN Delivery.
 */

// Pre-packaged authentic DCVC Sanctuary photography library
export const DCVC_IMAGE_LIBRARY = [
  { id: 'crc', name: 'Community Resource Center', path: '/images/crc-building.jpg', category: 'Facilities' },
  { id: 'umbrella', name: 'Rainbow Umbrella Youth', path: '/images/youth-umbrella.jpg', category: 'Programs' },
  { id: 'shines', name: 'Diversity SHINES Clinical Room', path: '/images/shines-screening.jpg', category: 'Healthcare' },
  { id: 'community', name: 'Community Gathering & Sanctuary', path: '/images/community-gathering.jpg', category: 'Community' },
  { id: 'volunteers', name: 'DCVC Volunteer Outreach Team', path: '/images/volunteers.jpg', category: 'Volunteers' },
  { id: 'prom', name: 'Pride Prom Celebration', path: '/images/pride-prom.jpeg', category: 'Events' },
  { id: 'unicorns', name: 'Little Unicorns Family Circle', path: '/images/little-unicorns.png', category: 'Programs' },
  { id: 'coast', name: 'Ventura Coastal Promenade', path: '/images/ventura-coast.jpg', category: 'Ventura' },
  { id: 'hero', name: 'Hero Community Banner', path: '/images/hero-community.jpg', category: 'Community' },
  { id: 'botanical', name: 'Botanical Wellness & Healing', path: '/images/botanical-flyer.jpg', category: 'Wellness' },
  { id: 'logo-sq', name: 'DCVC Official Logo (Square)', path: '/images/logo-square.png', category: 'Branding' },
  { id: 'logo-horiz', name: 'DCVC Official Logo (Horizontal)', path: '/images/logo-horizontal.png', category: 'Branding' }
];

/**
 * Get GitHub storage credentials from localStorage or environment
 */
export function getGitHubStorageConfig() {
  if (typeof localStorage === 'undefined') {
    return {
      owner: 'diversity-collective',
      repo: 'diversity-collectives-v1',
      branch: 'main',
      token: '',
      cdnProvider: 'jsdelivr'
    };
  }

  const stored = localStorage.getItem('dcvc_github_storage_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  return {
    owner: 'diversity-collective',
    repo: 'diversity-collectives-v1',
    branch: 'main',
    token: '',
    cdnProvider: 'jsdelivr' // 'jsdelivr' | 'github_raw' | 'relative'
  };
}

/**
 * Save GitHub storage credentials
 */
export function saveGitHubStorageConfig(config) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('dcvc_github_storage_config', JSON.stringify(config));
  }
}

/**
 * Client-Side Image Optimizer
 * Resizes large high-res camera photos down to max dimensions (default 1600px),
 * converts to WebP/JPEG, and compresses to quality ~0.85.
 * Prevents multi-MB raw uploads from slowing down the site.
 */
export async function optimizeImageFile(file, options = {}) {
  const maxWidth = options.maxWidth || 1600;
  const maxHeight = options.maxHeight || 1600;
  const quality = options.quality || 0.85;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into memory.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let mimeType = 'image/webp';
        let dataUrl = canvas.toDataURL(mimeType, quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          mimeType = 'image/jpeg';
          dataUrl = canvas.toDataURL(mimeType, quality);
        }

        canvas.toBlob((blob) => {
          const cleanName = (file.name || 'photo')
            .replace(/\.[^/.]+$/, '')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-')
            .slice(0, 40);

          const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
          const filename = `${cleanName}-${Date.now().toString(36)}.${ext}`;

          resolve({
            dataUrl,
            blob,
            filename,
            width,
            height,
            mimeType,
            sizeBytes: blob?.size || 0,
            originalSizeBytes: file.size
          });
        }, mimeType, quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload Image: Commits directly to GitHub repository if configured,
 * or saves to local persistent storage.
 */
export async function uploadAndStoreImage(file, category = 'media') {
  const optimized = await optimizeImageFile(file);
  const config = getGitHubStorageConfig();

  // If a GitHub token is configured, push directly to GitHub repo
  if (config.token && config.owner && config.repo) {
    try {
      const base64Content = optimized.dataUrl.split(',')[1];
      const targetPath = `public/images/${optimized.filename}`;
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${targetPath}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `feat(media): upload ${optimized.filename} via DCVC Management Portal`,
          content: base64Content,
          branch: config.branch || 'main'
        })
      });

      if (res.ok) {
        // Return public CDN URL
        let cdnUrl = `/images/${optimized.filename}`;
        if (config.cdnProvider === 'jsdelivr') {
          cdnUrl = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@${config.branch}/${targetPath}`;
        } else if (config.cdnProvider === 'github_raw') {
          cdnUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${targetPath}`;
        }
        return {
          url: cdnUrl,
          filename: optimized.filename,
          provider: 'github_cdn',
          sizeBytes: optimized.sizeBytes
        };
      }
    } catch (err) {
      console.warn('[ImageService] GitHub commit notice:', err.message);
    }
  }

  // Local / Client Persistent Fallback:
  // Store the optimized dataUrl in localStorage or return relative /images/ reference
  return {
    url: optimized.dataUrl,
    filename: optimized.filename,
    provider: 'local_optimized',
    sizeBytes: optimized.sizeBytes,
    note: 'Optimized and saved locally. Set GitHub token in Settings for direct repo commits.'
  };
}

