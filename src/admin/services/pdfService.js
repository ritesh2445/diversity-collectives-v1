/**
 * Diversity Collective Ventura County — Admin PDF & Document Service
 * Validation, Client-Side Size Formatting, GitHub Storage & Local Fallback.
 */

import { getGitHubStorageConfig } from './imageService.js';

export const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15 Megabytes

/**
 * Format bytes into human-readable file size (e.g. "340 KB", "2.4 MB")
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) {
    return 'PDF Document';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Strict PDF File Validator
 * Validates file presence, MIME type, and size limit.
 */
export function validatePdfFile(file, options = {}) {
  const maxBytes = options.maxSizeBytes || (options.maxSizeMb ? options.maxSizeMb * 1024 * 1024 : MAX_PDF_SIZE_BYTES);

  if (!file) {
    return {
      isValid: false,
      error: 'No document file was selected. Please choose a valid PDF.'
    };
  }

  // Handle file name extraction
  const fileName = String(file.name || file.fileName || 'document.pdf');
  const lowerName = fileName.toLowerCase();
  const fileType = String(file.type || '').toLowerCase();

  // Validate extension and MIME type
  const isPdfExtension = lowerName.endsWith('.pdf');
  const isPdfMime = fileType === 'application/pdf' || fileType === 'application/x-pdf';

  if (!isPdfExtension && !isPdfMime) {
    return {
      isValid: false,
      error: `Invalid file type "${fileType || 'unknown'}". Only PDF (.pdf) documents are accepted for sponsorship packets.`
    };
  }

  // Check file size
  const sizeBytes = typeof file.size === 'number' ? file.size : 0;
  if (sizeBytes > maxBytes) {
    const sizeFormatted = formatFileSize(sizeBytes);
    const limitFormatted = formatFileSize(maxBytes);
    return {
      isValid: false,
      error: `File size (${sizeFormatted}) exceeds the maximum allowed limit of ${limitFormatted}. Please compress the PDF.`
    };
  }

  // Sanitize filename for safe URLs and storage
  const cleanBase = fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 60);

  const cleanFileName = `${cleanBase}.pdf`;

  return {
    isValid: true,
    fileName: cleanFileName,
    originalName: fileName,
    sizeBytes,
    sizeFormatted: formatFileSize(sizeBytes),
    mimeType: 'application/pdf'
  };
}

/**
 * Read File or Blob as Base64 Data URL
 */
export function readPdfAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided to read.'));

    // If already a data URL or path URL string
    if (typeof file === 'string') {
      return resolve(file);
    }

    const actualFile = (file && typeof file === 'object' && !file.type && !file.size && (file.file || file.blob))
      ? (file.file || file.blob)
      : file;

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read PDF file contents.'));
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.readAsDataURL(actualFile);
  });
}

/**
 * Upload and Store PDF Document
 * Commits directly to GitHub repository if credentials exist,
 * or persists as base64 data URL / object URL locally.
 */
export async function uploadAndStorePdf(file, options = {}) {
  const validation = validatePdfFile(file, options);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const dataUrl = await readPdfAsDataUrl(file);
  const config = getGitHubStorageConfig();

  // If a GitHub token is configured, commit file directly to GitHub repo
  if (config.token && config.owner && config.repo) {
    try {
      const base64Content = dataUrl.split(',')[1];
      const targetPath = `public/documents/sponsorships/${validation.fileName}`;
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${targetPath}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `feat(sponsorships): upload ${validation.fileName} via DCVC Management Portal`,
          content: base64Content,
          branch: config.branch || 'main'
        })
      });

      if (res.ok) {
        let publicUrl = `/documents/sponsorships/${validation.fileName}`;
        if (config.cdnProvider === 'jsdelivr') {
          publicUrl = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@${config.branch}/${targetPath}`;
        } else if (config.cdnProvider === 'github_raw') {
          publicUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${targetPath}`;
        }
        return {
          url: publicUrl,
          fileName: validation.fileName,
          fileSize: validation.sizeFormatted,
          sizeBytes: validation.sizeBytes,
          provider: 'github_cdn'
        };
      }
    } catch (err) {
      console.warn('[PdfService] GitHub repository commit notice:', err.message);
    }
  }

  // Local / Client Persistent Fallback:
  return {
    url: dataUrl,
    fileName: validation.fileName,
    fileSize: validation.sizeFormatted,
    sizeBytes: validation.sizeBytes,
    provider: 'local_data_url',
    note: 'Stored locally. Configure GitHub integration in Settings for direct repo commits.'
  };
}
