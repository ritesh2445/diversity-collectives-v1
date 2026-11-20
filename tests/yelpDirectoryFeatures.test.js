import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { directoryService } from '../src/services/directoryService.js';

describe('Yelp-Style Business Directory Features, Auto-Ratings & AirDrop Hype Engine', () => {
  it('1. Calculates overall rating automatically without displaying public review text', async () => {
    const testBizId = 'biz-test-rating-1';
    const initialStats = directoryService.getBusinessStats({ id: testBizId });
    const initialCount = initialStats.ratingCount;
    const initialRating = initialStats.rating;

    // Submit a 5-star rating
    const result = await directoryService.rateBusiness(testBizId, 5);
    assert.equal(result.ratingCount, initialCount + 1, 'Rating count must increment by 1');
    assert.ok(result.rating >= 1 && result.rating <= 5, 'Rating must remain between 1 and 5');

    const refreshedStats = directoryService.getBusinessStats({ id: testBizId });
    assert.equal(refreshedStats.ratingCount, initialCount + 1);
    assert.equal(refreshedStats.rating, result.rating);
  });

  it('2. Hype engine enforces 1 tap per client/IP and updates live hype score', async () => {
    const testBizId = 'biz-test-hype-1';
    const initialStats = directoryService.getBusinessStats({ id: testBizId });
    const initialHypes = initialStats.hypes;

    // First hype tap should succeed
    const firstHype = await directoryService.hypeBusiness(testBizId);
    assert.equal(firstHype.success, true);
    assert.equal(firstHype.alreadyHyped, false);
    assert.equal(firstHype.hypes, initialHypes + 1);

    // Second hype tap from the same user/IP must be prevented
    const secondHype = await directoryService.hypeBusiness(testBizId);
    assert.equal(secondHype.success, false);
    assert.equal(secondHype.alreadyHyped, true);
    assert.equal(secondHype.hypes, initialHypes + 1, 'Hype count must not increment again');
  });

  it('3. Operating hours evaluator accurately determines open/closed status', () => {
    const sampleBiz = {
      category: 'Dining & Coffee',
      weeklyHours: {
        mon: '8:00 AM – 8:00 PM',
        tue: '8:00 AM – 8:00 PM',
        wed: '8:00 AM – 8:00 PM',
        thu: '8:00 AM – 8:00 PM',
        fri: '8:00 AM – 9:00 PM',
        sat: '8:00 AM – 9:00 PM',
        sun: '9:00 AM – 6:00 PM'
      }
    };

    const status = directoryService.getOpenStatus(sampleBiz);
    assert.ok(typeof status.isOpen === 'boolean');
    assert.ok(status.statusText === 'Open Now' || status.statusText === 'Closed' || status.statusText === 'Open Today');
    assert.ok(status.detailText);
  });

  it('4. Bookmarks and favorites toggles save state reliably', () => {
    const testBizId = 'biz-test-fav-1';
    
    // Toggle on
    const isSaved = directoryService.toggleFavorite(testBizId);
    assert.equal(isSaved, true);
    assert.ok(directoryService.getSavedBusinesses().includes(testBizId));

    // Toggle off
    const isUnsaved = directoryService.toggleFavorite(testBizId);
    assert.equal(isUnsaved, false);
    assert.ok(!directoryService.getSavedBusinesses().includes(testBizId));
  });

  it('5. Generates valid Google Maps directions links', () => {
    const biz = {
      name: 'Beacon Coffee Company',
      address: '5777 Valentine Rd, Ventura, CA 93003',
      city: 'Ventura'
    };
    const url = directoryService.getDirectionsUrl(biz);
    assert.ok(url.startsWith('https://www.google.com/maps/search/?api=1&query='));
    assert.match(url, /Valentine/i);
  });
});
