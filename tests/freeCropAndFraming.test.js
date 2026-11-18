import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

describe('Admin Image Studio: Free Crop & Zero Unintended Cropping Verification', () => {
  it('1. ImageCropperModal exports Free Crop and Full Image (No Crop) presets', () => {
    const modalContent = fs.readFileSync('src/admin/components/ImageCropperModal.jsx', 'utf8');

    // Must define original (full image / no crop) and free (custom free crop)
    assert.ok(modalContent.includes("id: 'original'"), "Must have 'original' preset");
    assert.ok(modalContent.includes("id: 'free'"), "Must have 'free' preset");
    assert.ok(modalContent.includes("Free Crop (Custom)"), "Must label Free Crop clearly");
    assert.ok(modalContent.includes("Full Image (No Crop)"), "Must label Full Image / No Crop clearly");

    // Must have 8 handles (4 corners + 4 edges for free crop)
    assert.ok(modalContent.includes("cursor-nwse-resize"), "Must have diagonal corner resize handles");
    assert.ok(modalContent.includes("cursor-nesw-resize"), "Must have diagonal corner resize handles");
    assert.ok(modalContent.includes("cursor-ns-resize"), "Must have top/bottom edge resize handles");
    assert.ok(modalContent.includes("cursor-ew-resize"), "Must have left/right edge resize handles");
  });

  it('2. ImagePicker defaults to original (no forced 16:9 auto-crop) and offers direct upload', () => {
    const pickerContent = fs.readFileSync('src/admin/components/ImagePicker.jsx', 'utf8');

    // Must pass initialAspect="original" so unselected ratio never cuts the image
    assert.ok(pickerContent.includes('initialAspect="original"'), "Must pass initialAspect='original' to prevent random auto-cropping");

    // Must provide Upload Original (No Crop) button
    assert.ok(pickerContent.includes('Upload Original (No Crop)'), "Must provide one-click Upload Original (No Crop) button");

    // Must provide preview framing toggle (contain / cover) so uncropped images are not visually clipped in the admin preview
    assert.ok(pickerContent.includes('previewFit'), "Must support preview framing control");
    assert.ok(pickerContent.includes('object-contain'), "Must support object-contain preview");
  });

  it('3. All mirror copies of ImageCropperModal and ImagePicker stay in sync', () => {
    const mainCropper = fs.readFileSync('src/admin/components/ImageCropperModal.jsx', 'utf8');
    const mirrorCropper1 = fs.readFileSync('src/admin/ImageCropperModal.jsx', 'utf8');
    const mirrorCropper2 = fs.readFileSync('admin/src/components/ImageCropperModal.jsx', 'utf8');

    assert.equal(mainCropper, mirrorCropper1, 'src/admin/ImageCropperModal.jsx must match');
    assert.equal(mainCropper, mirrorCropper2, 'admin/src/components/ImageCropperModal.jsx must match');

    const mainPicker = fs.readFileSync('src/admin/components/ImagePicker.jsx', 'utf8');
    const mirrorPicker1 = fs.readFileSync('src/admin/ImagePicker.jsx', 'utf8');
    const mirrorPicker2 = fs.readFileSync('admin/src/components/ImagePicker.jsx', 'utf8');

    assert.equal(mainPicker, mirrorPicker1, 'src/admin/ImagePicker.jsx must match');
    assert.equal(mainPicker, mirrorPicker2, 'admin/src/components/ImagePicker.jsx must match');
  });
});
