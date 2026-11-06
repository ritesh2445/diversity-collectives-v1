// Appreciation Card System Tests
// Validates tier thresholds, anonymous donor protection, and formatting

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  APPRECIATION_TIERS, 
  TIER_CONFIGS, 
  getTierForAmount, 
  formatDonationAmount 
} from '../src/data/appreciationTiers.js';

describe('Appreciation Card Tier Logic', () => {
  it('correctly assigns Community Ally for donations under $50', () => {
    const tier1 = getTierForAmount(5);
    const tier25 = getTierForAmount(25);
    const tier49 = getTierForAmount(49.99);

    assert.equal(tier1.id, APPRECIATION_TIERS.COMMUNITY_ALLY);
    assert.equal(tier25.id, APPRECIATION_TIERS.COMMUNITY_ALLY);
    assert.equal(tier49.id, APPRECIATION_TIERS.COMMUNITY_ALLY);
  });

  it('correctly assigns Pride Advocate for donations between $50 and $149', () => {
    const tier50 = getTierForAmount(50);
    const tier100 = getTierForAmount(100);
    const tier149 = getTierForAmount(149.99);

    assert.equal(tier50.id, APPRECIATION_TIERS.PRIDE_ADVOCATE);
    assert.equal(tier100.id, APPRECIATION_TIERS.PRIDE_ADVOCATE);
    assert.equal(tier149.id, APPRECIATION_TIERS.PRIDE_ADVOCATE);
  });

  it('correctly assigns Rainbow Champion for donations between $150 and $499', () => {
    const tier150 = getTierForAmount(150);
    const tier250 = getTierForAmount(250);
    const tier499 = getTierForAmount(499);

    assert.equal(tier150.id, APPRECIATION_TIERS.RAINBOW_CHAMPION);
    assert.equal(tier250.id, APPRECIATION_TIERS.RAINBOW_CHAMPION);
    assert.equal(tier499.id, APPRECIATION_TIERS.RAINBOW_CHAMPION);
  });

  it('correctly assigns Visionary Benefactor for donations $500 and above', () => {
    const tier500 = getTierForAmount(500);
    const tier1000 = getTierForAmount(1000);
    const tier5000 = getTierForAmount(5000);

    assert.equal(tier500.id, APPRECIATION_TIERS.VISIONARY_BENEFACTOR);
    assert.equal(tier1000.id, APPRECIATION_TIERS.VISIONARY_BENEFACTOR);
    assert.equal(tier5000.id, APPRECIATION_TIERS.VISIONARY_BENEFACTOR);
  });

  it('supports custom threshold configuration', () => {
    // Custom thresholds: Tier 2 starts at $25 instead of $50
    const custom = {
      [APPRECIATION_TIERS.PRIDE_ADVOCATE]: 25
    };
    const tier = getTierForAmount(30, custom);
    assert.equal(tier.id, APPRECIATION_TIERS.PRIDE_ADVOCATE);
  });

  it('formats donation currency values accurately', () => {
    assert.equal(formatDonationAmount(50), '$50');
    assert.equal(formatDonationAmount(150.50), '$150.50');
    assert.equal(formatDonationAmount(5000, true), '$50'); // 5000 cents = $50
  });

  it('preserves all required visual styling tokens for each tier', () => {
    Object.values(TIER_CONFIGS).forEach(config => {
      assert.ok(config.title, 'Tier missing title');
      assert.ok(config.themeGradient, 'Tier missing themeGradient');
      assert.ok(config.impactNarrative, 'Tier missing impactNarrative');
      assert.ok(config.quote, 'Tier missing quote');
      assert.ok(config.insignia, 'Tier missing insignia');
    });
  });
});

