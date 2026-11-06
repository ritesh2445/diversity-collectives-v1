import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateCloudinarySignature,
  createSignedUploadParameters,
  ALLOWED_UPLOAD_FOLDERS
} from '../worker/src/cloudinarySigner.js';

describe('Cloudinary Server-Side Upload Signing & Media Security', () => {

  it('1. generates correct SHA-1 signature with sorted parameters', async () => {
    const params = { folder: 'directory', timestamp: 1700000000 };
    const secret = 'my_test_secret_123';
    const sig = await generateCloudinarySignature(params, secret);

    assert.ok(sig);
    assert.strictEqual(typeof sig, 'string');
    assert.strictEqual(sig.length, 40); // Standard SHA-1 hex output is 40 characters
  });

  it('2. restricts upload folders to allowed categories', async () => {
    const env = { CLOUDINARY_CLOUD_NAME: 'dcvc', CLOUDINARY_API_KEY: 'key_123' };
    
    // Valid folder
    const validRes = await createSignedUploadParameters({ folder: 'gallery' }, env);
    assert.strictEqual(validRes.folder, 'gallery');

    // Invalid folder falls back to directory
    const invalidRes = await createSignedUploadParameters({ folder: 'unauthorized_folder' }, env);
    assert.strictEqual(invalidRes.folder, 'directory');
  });

  it('3. returns correct upload URL and parameters without exposing secret', async () => {
    const env = { 
      CLOUDINARY_CLOUD_NAME: 'dcvc-prod', 
      CLOUDINARY_API_KEY: 'key_abc',
      CLOUDINARY_API_SECRET: 'secret_xyz' 
    };

    const res = await createSignedUploadParameters({ folder: 'cms', tags: 'news,event' }, env);
    assert.strictEqual(res.cloudName, 'dcvc-prod');
    assert.strictEqual(res.apiKey, 'key_abc');
    assert.strictEqual(res.uploadUrl, 'https://api.cloudinary.com/v1_1/dcvc-prod/image/upload');
    assert.ok(res.signature);
    assert.strictEqual(res.apiSecret, undefined); // Never exposed
  });

  it('4. provides mock signature fallback in development mode', async () => {
    const env = { CLOUDINARY_CLOUD_NAME: 'dcvc' };
    const res = await createSignedUploadParameters({ folder: 'directory' }, env);
    assert.match(res.signature, /^mock_cloudinary_signature_/);
  });

});

