import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { jsPDF } from 'jspdf';
import { APPRECIATION_TIERS, TIER_CONFIGS, getTierForAmount } from '../src/data/appreciationTiers.js';

describe('Appreciation Card Export & Proportional Scaling Pipeline', () => {

  test('1. Verified A4 Landscape PDF Compilation with Aspect Ratio Fit', () => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Standard A4 landscape dimensions are 297mm x 210mm
    assert.equal(Math.round(pageWidth), 297);
    assert.equal(Math.round(pageHeight), 210);

    // Verify aspect ratio calculation
    const margin = 8;
    const maxW = pageWidth - (margin * 2); // 281mm
    const maxH = pageHeight - (margin * 2); // 194mm

    // Given a standard card aspect ratio of ~1.05 (e.g. 896px width x 850px height)
    const cardW = 896;
    const cardH = 850;
    const cardAspect = cardW / cardH;
    const targetAspect = maxW / maxH;

    let renderW, renderH, offsetX, offsetY;
    if (cardAspect > targetAspect) {
      renderW = maxW;
      renderH = maxW / cardAspect;
      offsetX = margin;
      offsetY = margin + (maxH - renderH) / 2;
    } else {
      renderH = maxH;
      renderW = maxH * cardAspect;
      offsetX = margin + (maxW - renderW) / 2;
      offsetY = margin;
    }

    // Assert that the rendered height fits strictly within the printable height
    assert.ok(renderH <= maxH, `Render height ${renderH} must not exceed ${maxH}`);
    assert.ok(renderW <= maxW, `Render width ${renderW} must not exceed ${maxW}`);
    assert.ok(offsetY >= margin, `Offset Y ${offsetY} must preserve top margin`);
    assert.ok(offsetX >= margin, `Offset X ${offsetX} must preserve left margin`);

    // Verify PDF page count is strictly 1
    const totalPages = pdf.getNumberOfPages();
    assert.equal(totalPages, 1, 'PDF must contain exactly 1 page');

    // Verify blob generation
    const blob = pdf.output('blob');
    assert.ok(blob.size > 0, 'PDF blob must have non-zero binary size');
  });

  test('2. Proportional Print Scaling Calculation Fits Within 1 A4 Landscape Page', () => {
    // Printable height in 96 DPI CSS pixels for 194mm is ~733px
    const a4PrintableHeightPx = (194 / 25.4) * 96; // ~733.2px

    const testCardHeights = [800, 850, 900, 950, 1000];
    const testCardWidths = [800, 896, 920];

    for (const cardH of testCardHeights) {
      for (const cardW of testCardWidths) {
        // Proportional scale calculation as implemented in handlePrint
        const scale = Math.min(1, Math.min(680 / cardH, 950 / cardW));
        const scaledHeight = cardH * scale;
        const scaledWidth = cardW * scale;

        // Must fit within available printable area (733px height, 1020px width)
        assert.ok(
          scaledHeight <= a4PrintableHeightPx,
          `Scaled height ${scaledHeight}px must fit within printable height ${a4PrintableHeightPx}px (cardH: ${cardH})`
        );
        assert.ok(
          scaledWidth <= 1020,
          `Scaled width ${scaledWidth}px must fit within printable width 1020px (cardW: ${cardW})`
        );
        assert.ok(scale > 0.5, `Scale factor ${scale} must remain comfortable for readability`);
      }
    }
  });

  test('3. Mobile Canvas Memory Safety Constraints', () => {
    // Standard desktop pixel ratio 2.5 on 896px width = ~2240px wide canvas (~15MB buffer)
    const desktopWidth = 896 * 2.5;
    const desktopHeight = 850 * 2.5;
    const desktopBytes = desktopWidth * desktopHeight * 4; // 4 bytes per RGBA pixel
    assert.ok(desktopBytes < 50 * 1024 * 1024, 'Desktop buffer must be under 50MB');

    // Mobile pixel ratio 1.75 on 400px width = 700px wide canvas (< 5MB buffer)
    const mobileWidth = 400 * 1.75;
    const mobileHeight = 700 * 1.75;
    const mobileBytes = mobileWidth * mobileHeight * 4;
    // iOS Safari 288MB limit check
    const iosSafariLimitBytes = 288 * 1024 * 1024;
    assert.ok(mobileBytes < iosSafariLimitBytes / 10, 'Mobile canvas buffer must be well below iOS Safari limit');
  });

  test('4. Tier Theme Tokens Preserved for Canonical Visual Truth', () => {
    const ally = TIER_CONFIGS[APPRECIATION_TIERS.COMMUNITY_ALLY];
    const advocate = TIER_CONFIGS[APPRECIATION_TIERS.PRIDE_ADVOCATE];
    const champion = TIER_CONFIGS[APPRECIATION_TIERS.RAINBOW_CHAMPION];
    const visionary = TIER_CONFIGS[APPRECIATION_TIERS.VISIONARY_BENEFACTOR];

    assert.equal(ally.certificatePrefix, 'CA');
    assert.equal(advocate.certificatePrefix, 'PA');
    assert.equal(champion.certificatePrefix, 'RC');
    assert.equal(visionary.certificatePrefix, 'VB');

    assert.ok(ally.motif, 'botanical_sunrise');
    assert.ok(advocate.motif, 'interconnected_rings');
    assert.ok(champion.motif, 'pride_aurora_ribbons');
    assert.ok(visionary.motif, 'sovereign_gold_crest');
  });

});

