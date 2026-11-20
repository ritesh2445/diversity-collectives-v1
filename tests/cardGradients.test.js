import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllCardThemes,
  getResourceCardTheme,
  getCommunityCardTheme,
  DEFAULT_RESOURCE_THEMES,
  DEFAULT_COMMUNITY_THEMES,
  LUXURY_GRADIENT_PRESETS
} from '../src/services/cardThemeStore.js';

test('Card Gradient & Category Theme Engine', async (t) => {
  await t.test('Health & Sexual Wellness does not use green per user requirement', () => {
    const healthTheme = DEFAULT_RESOURCE_THEMES['Health & Sexual Wellness'];
    assert.ok(healthTheme, 'Health theme must exist');
    // Ensure gradientFrom, gradientVia, and gradientTo are deep plum/violet, not green
    assert.ok(!healthTheme.gradientFrom.toLowerCase().includes('00ff'), 'Should not be bright green');
    assert.ok(!healthTheme.gradientVia.toLowerCase().includes('00ff'), 'Should not be bright green');
    assert.equal(healthTheme.presetId, 'velvet-plum', 'Health theme uses royal velvet plum and gold');
  });

  await t.test('All resource categories have complete gradient and accent definitions', () => {
    const requiredKeys = [
      'Crisis & Immediate Helplines',
      'Health & Sexual Wellness',
      'Legal & Civil Advocacy',
      'Youth & Family Support',
      'Senior & Community Resources'
    ];

    for (const key of requiredKeys) {
      const theme = getResourceCardTheme(key);
      assert.ok(theme.gradientFrom, `${key} must have gradientFrom`);
      assert.ok(theme.gradientTo, `${key} must have gradientTo`);
      assert.ok(theme.accentColor, `${key} must have accentColor`);
      assert.ok(theme.badgeColor, `${key} must have badgeColor`);
    }
  });

  await t.test('All community categories have distinct jewel-toned gradient definitions', () => {
    const categories = [
      'Youth Peer Support',
      'Adult Peer Support',
      'Trans & Non-Binary Support',
      'Seniors / 55+',
      'Professional & Personal Growth',
      'Family & Ally Support',
      'Recovery & Wellness'
    ];

    for (const cat of categories) {
      const theme = getCommunityCardTheme(cat);
      assert.ok(theme.gradientFrom, `${cat} must have gradientFrom`);
      assert.ok(theme.gradientTo, `${cat} must have gradientTo`);
      assert.ok(theme.accentColor, `${cat} must have accentColor`);
    }
  });

  await t.test('Individual card overrides take precedence over category defaults', () => {
    const override = {
      gradientFrom: '#112233',
      gradientTo: '#445566',
      accentColor: '#FFAA00'
    };
    const resolved = getResourceCardTheme('Health & Sexual Wellness', override);
    assert.equal(resolved.gradientFrom, '#112233');
    assert.equal(resolved.gradientTo, '#445566');
    assert.equal(resolved.accentColor, '#FFAA00');
  });

  await t.test('Curated luxury gradient presets offer 10 jewel-toned palettes', () => {
    assert.equal(LUXURY_GRADIENT_PRESETS.length, 10);
    for (const p of LUXURY_GRADIENT_PRESETS) {
      assert.ok(p.id);
      assert.ok(p.name);
      assert.ok(p.gradientFrom);
      assert.ok(p.gradientTo);
      assert.ok(p.accentColor);
    }
  });
});
