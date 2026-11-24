/**
 * directoryService.js
 * Yelp-style live ratings, AirDrop hype engine, operating hours, amenities,
 * and local favorites for the DCVC LGBTQ+ Affirming Business Directory.
 */

const RATINGS_KEY = 'dcvc_directory_ratings';
const HYPES_KEY = 'dcvc_directory_hypes';
const SAVED_KEY = 'dcvc_saved_businesses';

const DEFAULT_SCHEDULES = {
  dining: {
    mon: '7:00 AM – 7:00 PM',
    tue: '7:00 AM – 7:00 PM',
    wed: '7:00 AM – 7:00 PM',
    thu: '7:00 AM – 7:00 PM',
    fri: '7:00 AM – 8:00 PM',
    sat: '7:30 AM – 8:00 PM',
    sun: '8:00 AM – 5:00 PM'
  },
  health: {
    mon: '9:00 AM – 5:00 PM',
    tue: '9:00 AM – 5:00 PM',
    wed: '9:00 AM – 6:00 PM',
    thu: '9:00 AM – 5:00 PM',
    fri: '9:00 AM – 4:00 PM',
    sat: '10:00 AM – 2:00 PM',
    sun: 'Closed'
  },
  retail: {
    mon: '10:00 AM – 6:00 PM',
    tue: '10:00 AM – 6:00 PM',
    wed: '10:00 AM – 6:00 PM',
    thu: '10:00 AM – 6:00 PM',
    fri: '10:00 AM – 7:00 PM',
    sat: '10:00 AM – 7:00 PM',
    sun: '11:00 AM – 5:00 PM'
  },
  services: {
    mon: '8:30 AM – 5:30 PM',
    tue: '8:30 AM – 5:30 PM',
    wed: '8:30 AM – 5:30 PM',
    thu: '8:30 AM – 5:30 PM',
    fri: '8:30 AM – 5:00 PM',
    sat: 'Closed',
    sun: 'Closed'
  }
};

const DEFAULT_AMENITIES_BY_CAT = {
  dining: [
    '🏳️‍⚧️ Gender-Neutral Restrooms',
    '♿ Wheelchair Accessible',
    '🐾 Dog & Pet Friendly Patio',
    '☕ Free High-Speed Wi-Fi',
    '💳 Accepts Apple Pay & Cards',
    '🌿 Vegan & Gluten-Free Options'
  ],
  health: [
    '🏳️‍⚧️ Gender-Affirming Trained Staff',
    '♿ ADA Compliant Facility',
    '🔒 100% Confidential Care',
    '📋 Sliding Scale & Insurance',
    '🌐 Telehealth Appointments',
    '🌈 LGBTQIA+ Specialization'
  ],
  retail: [
    '🏳️‍⚧️ Inclusive Changing Rooms',
    '♿ Wheelchair Accessible',
    '🐾 Pet Friendly',
    '💳 Contactless & Apple Pay',
    '🎁 Queer Artisans & Gifts',
    '📦 In-Store Pickup Available'
  ],
  services: [
    '🏳️‍⚧️ Affirming Documentation Aid',
    '♿ Accessible Meeting Spaces',
    '🌐 Virtual & In-Person Options',
    '💳 Flexible Payment Plans',
    '💬 Bilingual Staff (English/Spanish)',
    '⭐ Verified Community Partner'
  ]
};

// Baseline metrics: start at 0 until genuine community interaction occurs
const SEED_METRICS = {
  'biz-1': { rating: 0, ratingCount: 0, hypes: 0, price: '$$', cat: 'dining' },
  'biz-2': { rating: 0, ratingCount: 0, hypes: 0, price: '$$$', cat: 'health' },
  'biz-3': { rating: 0, ratingCount: 0, hypes: 0, price: '$$$', cat: 'services' },
  'biz-4': { rating: 0, ratingCount: 0, hypes: 0, price: '$$', cat: 'retail' },
  'biz-5': { rating: 0, ratingCount: 0, hypes: 0, price: '$$', cat: 'services' },
  'biz-6': { rating: 0, ratingCount: 0, hypes: 0, price: '$$$', cat: 'services' },
  'biz-7': { rating: 0, ratingCount: 0, hypes: 0, price: '$', cat: 'retail' },
  'biz-8': { rating: 0, ratingCount: 0, hypes: 0, price: '$$', cat: 'health' },
  'biz-9': { rating: 0, ratingCount: 0, hypes: 0, price: '$$', cat: 'services' },
  'biz-10': { rating: 0, ratingCount: 0, hypes: 0, price: '$', cat: 'dining' },
  'biz-11': { rating: 0, ratingCount: 0, hypes: 0, price: '$$$', cat: 'services' },
  'biz-12': { rating: 0, ratingCount: 0, hypes: 0, price: '$$', cat: 'retail' }
};

function getApiBase() {
  if (typeof window === 'undefined') return 'https://dcvc-api.diversity-collective-vc.workers.dev';
  return window.location.origin.includes('localhost')
    ? 'http://localhost:8787'
    : 'https://dcvc-api.diversity-collective-vc.workers.dev';
}

const nodeMemoryStorage = new Map();

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return {
    getItem: (k) => (nodeMemoryStorage.has(k) ? nodeMemoryStorage.get(k) : null),
    setItem: (k, v) => nodeMemoryStorage.set(k, String(v)),
    removeItem: (k) => nodeMemoryStorage.delete(k)
  };
}

function getStoredJson(key, defaultVal) {
  try {
    const storage = getStorage();
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (_) {
    return defaultVal;
  }
}

function setStoredJson(key, val) {
  try {
    const storage = getStorage();
    storage.setItem(key, JSON.stringify(val));
  } catch (_) {}
}

export const directoryService = {
  /**
   * Returns live ratings, review count, hype count, and user interaction states
   */
  getBusinessStats(biz) {
    if (!biz) return { rating: 0, ratingCount: 0, hypes: 0, price: '$$', isHyped: false, isSaved: false };

    const id = biz.id || biz.slug;
    const seed = SEED_METRICS[biz.id] || SEED_METRICS[biz.slug] || {
      rating: 0,
      ratingCount: 0,
      hypes: 0,
      price: '$$',
      cat: 'dining'
    };

    const storedRatings = getStoredJson(RATINGS_KEY, {});
    const storedHypes = getStoredJson(HYPES_KEY, {});
    const savedList = getStoredJson(SAVED_KEY, []);

    const userRatingData = storedRatings[id];
    const rating = userRatingData ? userRatingData.rating : seed.rating;
    const ratingCount = userRatingData ? userRatingData.count : seed.ratingCount;

    const addedHypes = storedHypes[id] || 0;
    const hypes = seed.hypes + addedHypes;

    const storage = getStorage();
    const isHyped = Boolean(storage.getItem(`dcvc_hyped_${id}`));
    const isSaved = Array.isArray(savedList) && savedList.includes(id);

    return {
      rating: Number(rating.toFixed(1)),
      ratingCount,
      hypes,
      price: biz.price || seed.price || '$$',
      isHyped,
      isSaved
    };
  },

  /**
   * Rate a business without showing public comments (calculates score automatically)
   */
  async rateBusiness(bizId, starRating) {
    const star = Math.max(1, Math.min(5, Number(starRating) || 5));
    const current = this.getBusinessStats({ id: bizId });

    const newCount = current.ratingCount + 1;
    const newRating = current.ratingCount === 0
      ? Number(star.toFixed(1))
      : Number((((current.rating * current.ratingCount) + star) / newCount).toFixed(1));

    const storedRatings = getStoredJson(RATINGS_KEY, {});
    storedRatings[bizId] = {
      rating: newRating,
      count: newCount
    };
    setStoredJson(RATINGS_KEY, storedRatings);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dcvc-directory-updated', { detail: { bizId, rating: newRating } }));
    }

    // Attempt cloud sync
    try {
      fetch(`${getApiBase()}/api/directory/${bizId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: star })
      }).catch(() => {});
    } catch (_) {}

    return { rating: newRating, ratingCount: newCount };
  },

  /**
   * Hype a business — 1 tap per IP/device with live AirDrop animation trigger
   */
  async hypeBusiness(bizId) {
    const storage = getStorage();
    const hypeKey = `dcvc_hyped_${bizId}`;
    if (storage.getItem(hypeKey)) {
      const current = this.getBusinessStats({ id: bizId });
      return { success: false, alreadyHyped: true, hypes: current.hypes };
    }

    // Record local hype
    storage.setItem(hypeKey, 'true');
    const storedHypes = getStoredJson(HYPES_KEY, {});
    storedHypes[bizId] = (storedHypes[bizId] || 0) + 1;
    setStoredJson(HYPES_KEY, storedHypes);

    const current = this.getBusinessStats({ id: bizId });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dcvc-directory-updated', { detail: { bizId, hypes: current.hypes } }));
      window.dispatchEvent(new CustomEvent('dcvc-business-hyped', { detail: { bizId } }));
    }

    // Attempt cloud sync with IP check
    try {
      fetch(`${getApiBase()}/api/directory/${bizId}/hype`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    } catch (_) {}

    return { success: true, alreadyHyped: false, hypes: current.hypes };
  },

  /**
   * Toggle save/bookmark to Favorites
   */
  toggleFavorite(bizId) {
    const list = getStoredJson(SAVED_KEY, []);
    const exists = list.includes(bizId);
    let updated;
    if (exists) {
      updated = list.filter(id => id !== bizId);
    } else {
      updated = [...list, bizId];
    }
    setStoredJson(SAVED_KEY, updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dcvc-directory-updated', { detail: { bizId, isSaved: !exists } }));
    }
    return !exists;
  },

  /**
   * Get list of saved business IDs
   */
  getSavedBusinesses() {
    return getStoredJson(SAVED_KEY, []);
  },

  /**
   * Determine live Open/Closed status based on business category and hours
   */
  getOpenStatus(biz) {
    const cat = (biz?.category || '').toLowerCase();
    let schedule = biz?.weeklyHours;

    if (!schedule) {
      if (cat.includes('dining') || cat.includes('coffee') || cat.includes('food')) {
        schedule = DEFAULT_SCHEDULES.dining;
      } else if (cat.includes('health') || cat.includes('therapy') || cat.includes('wellness')) {
        schedule = DEFAULT_SCHEDULES.health;
      } else if (cat.includes('retail') || cat.includes('book') || cat.includes('shop')) {
        schedule = DEFAULT_SCHEDULES.retail;
      } else {
        schedule = DEFAULT_SCHEDULES.services;
      }
    }

    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()];
    const todayHours = schedule[currentDay] || 'Closed';

    if (!todayHours || todayHours.toLowerCase() === 'closed') {
      return {
        isOpen: false,
        statusText: 'Closed',
        detailText: 'Opens tomorrow',
        todayHours: 'Closed'
      };
    }

    // Try parsing open and close times (e.g., "8:00 AM – 7:00 PM")
    try {
      const parts = todayHours.split(/–|-/);
      if (parts.length === 2) {
        const parseTime = (str) => {
          const match = str.trim().match(/(\d+):?(\d*)\s*(AM|PM)/i);
          if (!match) return null;
          let hour = parseInt(match[1], 10);
          const min = match[2] ? parseInt(match[2], 10) : 0;
          const meridian = match[3].toUpperCase();
          if (meridian === 'PM' && hour !== 12) hour += 12;
          if (meridian === 'AM' && hour === 12) hour = 0;
          return hour * 60 + min;
        };

        const openMinutes = parseTime(parts[0]);
        const closeMinutes = parseTime(parts[1]);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (openMinutes !== null && closeMinutes !== null) {
          if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
            return {
              isOpen: true,
              statusText: 'Open Now',
              detailText: `Closes at ${parts[1].trim()}`,
              todayHours
            };
          } else {
            return {
              isOpen: false,
              statusText: 'Closed',
              detailText: currentMinutes < openMinutes ? `Opens at ${parts[0].trim()}` : 'Opens tomorrow',
              todayHours
            };
          }
        }
      }
    } catch (_) {}

    // Default friendly fallback
    return {
      isOpen: true,
      statusText: 'Open Today',
      detailText: todayHours,
      todayHours
    };
  },

  /**
   * Returns weekly schedule object
   */
  getWeeklyHours(biz) {
    if (biz?.weeklyHours) return biz.weeklyHours;
    const cat = (biz?.category || '').toLowerCase();
    if (cat.includes('dining') || cat.includes('coffee')) return DEFAULT_SCHEDULES.dining;
    if (cat.includes('health') || cat.includes('wellness')) return DEFAULT_SCHEDULES.health;
    if (cat.includes('retail') || cat.includes('gift')) return DEFAULT_SCHEDULES.retail;
    return DEFAULT_SCHEDULES.services;
  },

  /**
   * Returns amenities list
   */
  getAmenities(biz) {
    if (Array.isArray(biz?.amenities) && biz.amenities.length > 0) return biz.amenities;
    const cat = (biz?.category || '').toLowerCase();
    if (cat.includes('dining') || cat.includes('coffee')) return DEFAULT_AMENITIES_BY_CAT.dining;
    if (cat.includes('health') || cat.includes('wellness')) return DEFAULT_AMENITIES_BY_CAT.health;
    if (cat.includes('retail') || cat.includes('gift')) return DEFAULT_AMENITIES_BY_CAT.retail;
    return DEFAULT_AMENITIES_BY_CAT.services;
  },

  /**
   * Generates Google Maps directions link
   */
  getDirectionsUrl(biz) {
    const query = biz?.address || `${biz?.name || 'Business'}, ${biz?.city || 'Ventura'}, CA`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
};
