import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getTierForAmount, TIER_CONFIGS } from '../src/data/appreciationTiers.js';

describe('Donate Page Logic & Appreciation Tier Resolution', () => {
  it('correctly resolves appreciation tiers for various donation amounts', () => {
    assert.strictEqual(getTierForAmount(25).id, 'community_ally');
    assert.strictEqual(getTierForAmount(50).id, 'pride_advocate');
    assert.strictEqual(getTierForAmount(150).id, 'rainbow_champion');
    assert.strictEqual(getTierForAmount(500).id, 'visionary_benefactor');
    assert.strictEqual(getTierForAmount(1000).id, 'visionary_benefactor');
    assert.strictEqual(getTierForAmount(1).id, 'community_ally');
    assert.strictEqual(getTierForAmount(0).id, 'community_ally');
  });

  it('provides complete title, circleName, and minAmount across all tiers', () => {
    for (const key of Object.keys(TIER_CONFIGS)) {
      const config = TIER_CONFIGS[key];
      assert.ok(config.title, `Missing title on ${key}`);
      assert.ok(config.circleName, `Missing circleName on ${key}`);
      assert.ok(typeof config.minAmount === 'number', `Invalid minAmount on ${key}`);
    }
  });
});
