/**
 * Diversity Collective Ventura County — Cloudinary Upload Signer
 * 
 * Generates secure server-side signatures for authenticated client uploads.
 * Never exposes CLOUDINARY_API_SECRET in browser code.
 * 
 * Restrictions:
 *  - Allowed folders: 'directory', 'gallery', 'cms', 'appreciation_cards'
 *  - Max file size: 10 MB
 *  - Allowed formats: jpg, jpeg, png, webp, svg
 */

export const ALLOWED_UPLOAD_FOLDERS = ['directory', 'gallery', 'cms', 'appreciation_cards'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Generate SHA-1 upload signature for Cloudinary API
 */
export async function generateCloudinarySignature(params, apiSecret) {
  if (!apiSecret) {
    // Development / simulation fallback
    return 'mock_cloudinary_signature_' + Date.now();
  }

  // Sort parameter keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&') + apiSecret;

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(serialized));
  
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate and prepare signed upload parameters
 */
export async function createSignedUploadParameters({ folder = 'directory', tags = 'dcvc', publicId = null }, env) {
  const targetFolder = ALLOWED_UPLOAD_FOLDERS.includes(folder) ? folder : 'directory';
  const timestamp = Math.floor(Date.now() / 1000);
  const cloudName = env.CLOUDINARY_CLOUD_NAME || 'dcvc';
  const apiKey = env.CLOUDINARY_API_KEY || 'mock_cloudinary_api_key';
  const apiSecret = env.CLOUDINARY_API_SECRET || null;

  const paramsToSign = {
    folder: targetFolder,
    timestamp
  };

  if (tags) paramsToSign.tags = tags;
  if (publicId) paramsToSign.public_id = publicId;

  const signature = await generateCloudinarySignature(paramsToSign, apiSecret);

  return {
    cloudName,
    apiKey,
    timestamp,
    folder: targetFolder,
    signature,
    tags: paramsToSign.tags || null,
    publicId: paramsToSign.public_id || null,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  };
}

