import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  getBusinessCoordinates, 
  CITY_COORDINATES, 
  KNOWN_BUSINESS_COORDINATES,
  VENTURA_COUNTY_CENTER 
} from '../src/utils/geoCoordinates.js';

describe('Real Zoomable Directory Map & Geolocation Engine', () => {
  it('resolves exact geographic coordinates for known seed businesses', () => {
    const beaconCoords = getBusinessCoordinates({ slug: 'beacon-coffee-company' });
    assert.deepStrictEqual(beaconCoords, KNOWN_BUSINESS_COORDINATES['beacon-coffee-company']);

    const ojaiCoords = getBusinessCoordinates({ slug: 'ojai-valley-botanicals' });
    assert.deepStrictEqual(ojaiCoords, KNOWN_BUSINESS_COORDINATES['ojai-valley-botanicals']);

    const lawCoords = getBusinessCoordinates({ slug: 'channel-islands-law' });
    assert.deepStrictEqual(lawCoords, KNOWN_BUSINESS_COORDINATES['channel-islands-law']);
  });

  it('accurately resolves direct latitude and longitude properties when provided on new businesses', () => {
    const customBiz = {
      name: 'Custom New Cafe',
      latitude: 34.2811,
      longitude: -119.2954
    };
    const coords = getBusinessCoordinates(customBiz);
    assert.deepStrictEqual(coords, [34.2811, -119.2954]);

    const shortPropsBiz = {
      name: 'Another Spot',
      lat: 34.1982,
      lng: -119.1765
    };
    const coordsShort = getBusinessCoordinates(shortPropsBiz);
    assert.deepStrictEqual(coordsShort, [34.1982, -119.1765]);
  });

  it('deterministically maps newly added businesses by city without pin collision', () => {
    const newBizA = { id: 'new-1', name: 'Fresh Bakery', city: 'Oxnard' };
    const newBizB = { id: 'new-2', name: 'Coastal Books', city: 'Oxnard' };

    const coordsA = getBusinessCoordinates(newBizA, 0);
    const coordsB = getBusinessCoordinates(newBizB, 1);

    // Both should be in Oxnard general vicinity (~34.19, -119.17)
    assert.strictEqual(Math.round(coordsA[0]), 34);
    assert.strictEqual(Math.round(coordsA[1]), -119);
    assert.strictEqual(Math.round(coordsB[0]), 34);
    assert.strictEqual(Math.round(coordsB[1]), -119);

    // Pins should not have identical coordinates (dispersion prevents overlap)
    assert.notDeepStrictEqual(coordsA, coordsB, 'Pins in same city should not collide directly');
  });

  it('covers all major Ventura County cities and regions', () => {
    const expectedCities = ['ventura', 'oxnard', 'camarillo', 'ojai', 'thousand oaks', 'simi valley', 'port hueneme', 'moorpark', 'santa paula', 'fillmore'];
    for (const city of expectedCities) {
      assert.ok(CITY_COORDINATES[city], `Missing city coordinate data for ${city}`);
      assert.ok(typeof CITY_COORDINATES[city].lat === 'number');
      assert.ok(typeof CITY_COORDINATES[city].lng === 'number');
      assert.ok(typeof CITY_COORDINATES[city].zoom === 'number');
    }
  });

  it('gracefully falls back to Ventura County center when no location info is provided', () => {
    const emptyBiz = {};
    const coords = getBusinessCoordinates(emptyBiz);
    assert.deepStrictEqual(coords, VENTURA_COUNTY_CENTER);

    const nullBiz = null;
    const coordsNull = getBusinessCoordinates(nullBiz);
    assert.deepStrictEqual(coordsNull, VENTURA_COUNTY_CENTER);
  });

  it('strictly uses 100% free map tile services that do NOT require any API key or subscription', async () => {
    const fs = await import('node:fs');
    const mapSource = fs.readFileSync('src/components/DirectoryMapView.jsx', 'utf8');

    // Must NOT use cartocdn (which displays "API key is required" watermark)
    assert.doesNotMatch(mapSource, /basemaps\.cartocdn\.com/i, 'Must not use cartocdn watermarked endpoints');
    assert.doesNotMatch(mapSource, /api[_-]?key/i, 'Must not require any API keys in map providers');

    // Must include free OpenStreetMap and ArcGIS services
    assert.match(mapSource, /arcgisonline\.com/i, 'Should include free Esri ArcGIS World Street map');
    assert.match(mapSource, /tile\.openstreetmap\.org/i, 'Should include free OpenStreetMap standard tile server');
  });
});
