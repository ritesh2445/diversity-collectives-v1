/**
 * Diversity Collective Ventura County — Admin Image & Media Service
 * Client-Side Image Optimization, GitHub Repository Storage & CDN Delivery.
 */

// Pre-packaged authentic DCVC Center photography library
export const DCVC_IMAGE_LIBRARY = [
  { id: 'crc', name: 'Community Resource Center', path: '/images/crc-building.jpg', category: 'Facilities' },
  { id: 'umbrella', name: 'Rainbow Umbrella Youth', path: '/images/youth-umbrella.jpg', category: 'Programs' },
  { id: 'shines', name: 'Diversity SHINES Clinical Room', path: '/images/shines-screening.jpg', category: 'Healthcare' },
  { id: 'community', name: 'Community Gathering & Center', path: '/images/community-gathering.jpg', category: 'Community' },
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
  const envOwner = (typeof window !== 'undefined' ? import.meta.env?.VITE_GITHUB_OWNER : (typeof process !== 'undefined' ? process?.env?.VITE_GITHUB_OWNER : '')) || 'diversity-collective';
  const envRepo = (typeof window !== 'undefined' ? import.meta.env?.VITE_GITHUB_REPO : (typeof process !== 'undefined' ? process?.env?.VITE_GITHUB_REPO : '')) || 'diversity-collectives-v1';
  const envBranch = (typeof window !== 'undefined' ? import.meta.env?.VITE_GITHUB_BRANCH : (typeof process !== 'undefined' ? process?.env?.VITE_GITHUB_BRANCH : '')) || 'main';
  const envToken = (typeof window !== 'undefined' ? import.meta.env?.VITE_GITHUB_TOKEN : (typeof process !== 'undefined' ? process?.env?.VITE_GITHUB_TOKEN : '')) || '';
  const envCdn = (typeof window !== 'undefined' ? import.meta.env?.VITE_CDN_PROVIDER : (typeof process !== 'undefined' ? process?.env?.VITE_CDN_PROVIDER : '')) || 'jsdelivr';

  if (typeof localStorage === 'undefined') {
    return {
      owner: envOwner,
      repo: envRepo,
      branch: envBranch,
      token: envToken,
      cdnProvider: envCdn
    };
  }

  const stored = localStorage.getItem('dcvc_github_storage_config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        owner: parsed.owner || envOwner,
        repo: parsed.repo || envRepo,
        branch: parsed.branch || envBranch,
        token: parsed.token || envToken,
        cdnProvider: parsed.cdnProvider || envCdn
      };
    } catch {
      // fallback
    }
  }

  return {
    owner: envOwner,
    repo: envRepo,
    branch: envBranch,
    token: envToken,
    cdnProvider: envCdn // 'jsdelivr' | 'github_raw' | 'relative'
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
 * Resizes large high-res camera photos down to optimized web dimensions (default 1280px),
 * converts to WebP/JPEG, and compresses to quality ~0.82.
 * Prevents multi-MB raw uploads from slowing down the site or exceeding browser storage.
 */
export async function optimizeImageFile(file, options = {}) {
  const maxWidth = options.maxWidth || 1280;
  const maxHeight = options.maxHeight || 960;
  const quality = options.quality || 0.82;

  // 1. Direct pass-through if string URL that isn't a base64 data URL
  if (typeof file === 'string') {
    if (file.startsWith('/images/') || file.startsWith('http://') || file.startsWith('https://')) {
      return {
        url: file,
        dataUrl: file,
        filename: file.split('/').pop() || 'image.jpg',
        width: 800,
        height: 600,
        mimeType: 'image/jpeg',
        sizeBytes: 0,
        originalSizeBytes: 0
      };
    }
  }

  // Handle object wrappers { file } or { blob } or { dataUrl }
  const actualFile = (file && typeof file === 'object' && !file.type && !file.size && (file.file || file.blob))
    ? (file.file || file.blob)
    : file;

  return new Promise((resolve, reject) => {
    // If it's already a base64 data URL string or blob URL string
    if (typeof actualFile === 'string' && (actualFile.startsWith('data:image/') || actualFile.startsWith('blob:'))) {
      const img = new Image();
      img.onload = () => {
        let width = img.width || 800;
        let height = img.height || 600;
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

        let mimeType = 'image/webp';
        let dataUrl = canvas.toDataURL(mimeType, quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          mimeType = 'image/jpeg';
          dataUrl = canvas.toDataURL(mimeType, quality);
        }

        const filename = `photo-${Date.now().toString(36)}.${mimeType === 'image/webp' ? 'webp' : 'jpg'}`;
        canvas.toBlob((blob) => {
          const finalFile = blob ? new File([blob], filename, { type: mimeType }) : null;
          resolve({
            dataUrl,
            blob,
            file: finalFile,
            filename,
            width,
            height,
            mimeType,
            sizeBytes: blob?.size || dataUrl.length,
            originalSizeBytes: actualFile.length
          });
        }, mimeType, quality);
      };
      img.onerror = () => {
        // Fallback: return as-is
        resolve({
          dataUrl: actualFile,
          blob: null,
          file: null,
          filename: `photo-${Date.now().toString(36)}.jpg`,
          width: 800,
          height: 600,
          mimeType: 'image/jpeg',
          sizeBytes: actualFile.length,
          originalSizeBytes: actualFile.length
        });
      };
      img.src = actualFile;
      return;
    }

    if (!actualFile) {
      return reject(new Error('No image file provided for upload.'));
    }

    // Check if it's a valid Blob / File
    const isBlob = actualFile instanceof Blob || (typeof actualFile === 'object' && actualFile.slice);
    if (!isBlob && (!actualFile.type || !actualFile.type.startsWith('image/'))) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into memory.'));
      img.onload = () => {
        let width = img.width || 800;
        let height = img.height || 600;

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

        const cleanName = (actualFile.name || 'photo')
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-')
          .slice(0, 40);

        const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
        const filename = `${cleanName}-${Date.now().toString(36)}.${ext}`;

        const finalize = (blob) => {
          const finalFile = blob ? new File([blob], filename, { type: mimeType }) : null;
          resolve({
            dataUrl,
            blob,
            file: finalFile,
            filename,
            width,
            height,
            mimeType,
            sizeBytes: blob?.size || dataUrl.length,
            originalSizeBytes: actualFile.size || dataUrl.length
          });
        };

        try {
          canvas.toBlob((blob) => {
            finalize(blob);
          }, mimeType, quality);
        } catch {
          finalize(null);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(actualFile);
  });
}

/**
 * Upload Image: Persists to Cloudflare Worker + Turso (/api/media/upload) first,
 * then optionally commits to GitHub repository if configured,
 * or falls back to compact client-optimized data URL when offline.
 */
export async function uploadAndStoreImage(file, category = 'media') {
  const isPortrait = category === 'avatar' || category === 'staff' || category === 'board';
  const options = isPortrait
    ? { maxWidth: 480, maxHeight: 480, quality: 0.80 }
    : { maxWidth: 960, maxHeight: 720, quality: 0.82 };
  const optimized = await optimizeImageFile(file, options);

  // If already a remote HTTP(S) or static /images/ URL, return directly
  if (!optimized.dataUrl?.startsWith('data:')) {
    return {
      url: optimized.url || optimized.dataUrl,
      filename: optimized.filename,
      provider: 'external_url',
      sizeBytes: optimized.sizeBytes || 0
    };
  }

  const base64Content = optimized.dataUrl.split(',')[1];

  if (typeof window !== 'undefined') {
    const apiBases = [];
    const envBase = typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
      : '';
    if (envBase) apiBases.push(envBase);
    apiBases.push('/api', 'https://dcvc-api.diversity-collective-vc.workers.dev/api');

    const uniqueBases = [...new Set(apiBases)];
    const token = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('dcvc_admin_token') || sessionStorage.getItem('dcvc_admin_token') || '')
      : '';

    for (const base of uniqueBases) {
      try {
        const res = await fetch(`${base}/media/upload`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            folder: category,
            fileName: optimized.filename,
            mimeType: optimized.mimeType,
            fileData: base64Content
          })
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.success && data?.url) {
            return {
              url: data.url,
              filename: optimized.filename,
              provider: data.provider || 'turso_media',
              sizeBytes: optimized.sizeBytes
            };
          }
        }
      } catch (err) {
        console.warn(`[ImageService] Worker upload failed for ${base}:`, err.message);
      }
    }
  }

  const config = getGitHubStorageConfig();

  // If a GitHub token is configured, push directly to GitHub repo
  if (config.token && config.owner && config.repo) {
    try {
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
  // Store the optimized dataUrl if server upload is unreachable
  return {
    url: optimized.dataUrl,
    filename: optimized.filename,
    provider: 'local_optimized',
    sizeBytes: optimized.sizeBytes,
    note: 'Optimized and saved locally. Server media storage was unreachable.'
  };
}

