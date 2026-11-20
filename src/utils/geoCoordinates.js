/**
 * geoCoordinates.js
 * Comprehensive geographic resolution engine for Ventura County businesses.
 * Provides exact coordinates for recognized businesses and deterministic
 * geographic positioning for newly added businesses based on city/address.
 */

export const VENTURA_COUNTY_CENTER = [34.2746, -119.2290]; // Ventura, CA
export const VENTURA_COUNTY_BOUNDS = [
  [34.0500, -119.4500], // Southwest (Coastal Pacific)
  [34.5500, -118.6500]  // Northeast (Mountains / Simi Valley)
];

export const CITY_COORDINATES = {
  ventura: { lat: 34.2746, lng: -119.2290, zoom: 13, name: 'Ventura' },
  oxnard: { lat: 34.1975, lng: -119.1771, zoom: 13, name: 'Oxnard' },
  camarillo: { lat: 34.2164, lng: -119.0376, zoom: 13, name: 'Camarillo' },
  ojai: { lat: 34.4480, lng: -119.2429, zoom: 14, name: 'Ojai' },
  'thousand oaks': { lat: 34.1706, lng: -118.8376, zoom: 13, name: 'Thousand Oaks' },
  'simi valley': { lat: 34.2694, lng: -118.7815, zoom: 13, name: 'Simi Valley' },
  'port hueneme': { lat: 34.1478, lng: -119.1951, zoom: 14, name: 'Port Hueneme' },
  moorpark: { lat: 34.2856, lng: -118.8823, zoom: 13, name: 'Moorpark' },
  'santa paula': { lat: 34.3542, lng: -119.0593, zoom: 14, name: 'Santa Paula' },
  fillmore: { lat: 34.3992, lng: -118.9182, zoom: 14, name: 'Fillmore' }
};

// Known exact coordinates for seed & recognized businesses
export const KNOWN_BUSINESS_COORDINATES = {
  'beacon-coffee-company': [34.2562, -119.2215],
  'coastal-pride-counseling': [34.2783, -119.2841],
  'channel-islands-law': [34.2251, -119.1783],
  'channel-islands-inclusive-law-group': [34.2251, -119.1783],
  'ojai-valley-botanicals': [34.4485, -119.2432],
  'ojai-valley-botanicals-tea-lounge': [34.4485, -119.2432],
  'conejo-valley-fitness': [34.1712, -118.8741],
  'conejo-valley-fitness-collective': [34.1712, -118.8741],
  'pacific-view-creative': [34.2384, -119.0062],
  'pacific-view-creative-web-studio': [34.2384, -119.0062],
  'the-fight-magazine': [34.2815, -119.2934],
  'planned-parenthood-ventura': [34.2618, -119.2312],
  'planned-parenthood-california-central-coast': [34.2618, -119.2312],
  'mitec-solutions-it-voip': [34.2691, -119.2450],
  'ventura-county-roller-derby-vcrd': [34.2753, -119.2931],
  'california-lutheran-university': [34.2255, -118.8812],
  'wheelhouse-cannabis-dispensary-delivery': [34.1792, -119.2014],
  'free-mom-hugs-ventura-county-chapter': [34.2711, -119.2789],
  'autism-society-ventura-county': [34.2185, -119.0321],
  'our-redeemer-lutheran-church-redimidos': [34.1952, -119.1684]
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolves a real geographic [latitude, longitude] pair for any business.
 * Handles exact coordinates, direct lat/lng properties, known addresses,
 * and deterministic scatter for new businesses added dynamically.
 */
export function getBusinessCoordinates(biz, index = 0) {
  if (!biz) return VENTURA_COUNTY_CENTER;

  // 1. Direct explicit coordinates on the business object
  if (typeof biz.latitude === 'number' && typeof biz.longitude === 'number') {
    return [biz.latitude, biz.longitude];
  }
  if (typeof biz.lat === 'number' && typeof biz.lng === 'number') {
    return [biz.lat, biz.lng];
  }

  // 2. Exact match in known dictionary
  const slugKey = (biz.slug || '').toLowerCase();
  if (KNOWN_BUSINESS_COORDINATES[slugKey]) {
    return KNOWN_BUSINESS_COORDINATES[slugKey];
  }

  const idKey = (biz.id || '').toLowerCase();
  if (KNOWN_BUSINESS_COORDINATES[idKey]) {
    return KNOWN_BUSINESS_COORDINATES[idKey];
  }

  // 3. Fallback based on city name or address text
  const cityStr = (biz.city || '').trim().toLowerCase();
  const addrStr = (biz.address || '').trim().toLowerCase();

  // If completely empty business with no identifiable fields, return center
  if (!cityStr && !addrStr && !biz.name && !biz.id && !biz.slug) {
    return VENTURA_COUNTY_CENTER;
  }

  let matchedCity = CITY_COORDINATES[cityStr];

  if (!matchedCity) {
    for (const [key, cityData] of Object.entries(CITY_COORDINATES)) {
      if (addrStr.includes(key)) {
        matchedCity = cityData;
        break;
      }
    }
  }

  if (!matchedCity) {
    matchedCity = CITY_COORDINATES.ventura;
  }

  // 4. Deterministic natural radial dispersion so pins don't overlap directly
  const idSeed = `${biz.id || ''}-${biz.slug || ''}-${biz.name || ''}-${index}`;
  const hash = hashString(idSeed);
  const angle = ((hash % 360) * Math.PI) / 180;
  // Radius between ~300 meters and 1.8 kilometers
  const dist = 0.003 + ((hash % 18) * 0.0006);

  const lat = matchedCity.lat + Math.cos(angle) * dist;
  const lng = matchedCity.lng + Math.sin(angle) * (dist * 1.2);

  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
}
