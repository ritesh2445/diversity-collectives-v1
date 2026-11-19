import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CATEGORY_THEMES,
  resolveCategoryTheme,
  loadCategoryThemes,
  saveCategoryThemesToStorage,
  CATEGORY_THEME_STORAGE_KEY,
  GRADIENT_PALETTE_PRESETS
} from '../src/utils/cardGradients.js';

test('Card Gradient & Category Theme Engine', async (t) => {
  await t.test('Health category theme does NOT use green as instructed', () => {
    const healthTheme = DEFAULT_CATEGORY_THEMES['Health & Sexual Wellness'];
    assert.ok(healthTheme, 'health theme must exist');
    // Ensure green is not used as required: "( use appropriate colors do not use the green one )"
    const paletteStr = `${healthTheme.fromColor} ${healthTheme.viaColor} ${healthTheme.toColor} ${healthTheme.borderColor} ${healthTheme.accentColor}`.toLowerCase();
    assert.strictEqual(paletteStr.includes('green'), false, 'health theme must not contain green');
    // Soothing ocean sky/cyan-indigo palette
    assert.strictEqual(healthTheme.accentColor, '#0284c7', 'health theme should use calming ocean sky-blue accent');
  });

  await t.test('Each resource and community category has distinct aesthetic gradients', () => {
    const categories = Object.keys(DEFAULT_CATEGORY_THEMES);
    assert.ok(categories.length >= 8, 'must define themes for all major categories');
    
    // Verify distinct accent colors across categories
    const accents = new Set(categories.map(c => DEFAULT_CATEGORY_THEMES[c].accentColor));
    assert.ok(accents.size >= 6, 'categories should have distinct accent colors');
  });

  await t.test('resolveCategoryTheme resolves correctly by category name, fuzzy match, or fallback', () => {
    // Exact match
    const health = resolveCategoryTheme('Health & Sexual Wellness');
    assert.ok(health.gradient, 'must return a gradient');
    assert.strictEqual(health.accentColor, '#0284c7');

    // Fuzzy match on keyword "health"
    const fuzzyHealth = resolveCategoryTheme('Community Health Clinic');
    assert.strictEqual(fuzzyHealth.accentColor, '#0284c7');

    // Fuzzy match on "crisis"
    const crisis = resolveCategoryTheme('Emergency Crisis Hotline');
    assert.strictEqual(crisis.accentColor, '#e11d48');

    // Fuzzy match on "trans"
    const trans = resolveCategoryTheme('Transgender Support Group');
    assert.strictEqual(trans.accentColor, '#db2777');

    // Direct card custom override
    const directOverride = resolveCategoryTheme('Custom Item', {
      gradient: 'linear-gradient(135deg, #fff 0%, #000 100%)',
      accentColor: '#123456',
      borderColor: '#abcdef'
    });
    assert.strictEqual(directOverride.gradient, 'linear-gradient(135deg, #fff 0%, #000 100%)');
    assert.strictEqual(directOverride.accentColor, '#123456');

    // Fallback for unknown category
    const unknown = resolveCategoryTheme('Completely Unmatched Title');
    assert.ok(unknown.gradient, 'must provide safe fallback gradient');
    assert.ok(unknown.accentColor, 'must provide safe fallback accentColor');
  });

  await t.test('GRADIENT_PALETTE_PRESETS provides 1-click curated palettes including non-green healthcare', () => {
    assert.ok(Array.isArray(GRADIENT_PALETTE_PRESETS) && GRADIENT_PALETTE_PRESETS.length >= 6);
    const healthPreset = GRADIENT_PALETTE_PRESETS.find(p => p.id === 'ocean-cyan');
    assert.ok(healthPreset, 'ocean-cyan preset should be available');
    assert.strictEqual(healthPreset.accentColor, '#0284c7');
  });

  await t.test('saveCategoryThemesToStorage and loadCategoryThemes persist custom overrides in browser', () => {
    const mockStorage = {};
    globalThis.window = {
      dispatchEvent: () => {}
    };
    globalThis.CustomEvent = class {
      constructor(type, eventInitDict) {
        this.type = type;
        this.detail = eventInitDict?.detail;
      }
    };
    globalThis.localStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, val) => { mockStorage[key] = String(val); },
      removeItem: (key) => { delete mockStorage[key]; }
    };

    try {
      const customThemes = {
        ...DEFAULT_CATEGORY_THEMES,
        'Health & Sexual Wellness': {
          ...DEFAULT_CATEGORY_THEMES['Health & Sexual Wellness'],
          accentColor: '#0369a1',
          fromColor: '#f0f9ff'
        }
      };

      saveCategoryThemesToStorage(customThemes);
      assert.ok(mockStorage[CATEGORY_THEME_STORAGE_KEY], 'must save to storage key');

      const loaded = loadCategoryThemes();
      assert.strictEqual(loaded['Health & Sexual Wellness'].accentColor, '#0369a1');

      const resolved = resolveCategoryTheme('Health & Sexual Wellness');
      assert.strictEqual(resolved.accentColor, '#0369a1');
    } finally {
      delete globalThis.window;
      delete globalThis.CustomEvent;
      delete globalThis.localStorage;
    }
  });
});
