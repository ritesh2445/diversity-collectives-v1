import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Star, 
  Flame, 
  Clock, 
  ArrowRight,
  Heart,
  ShieldCheck,
  Check,
  Compass,
  Layers,
  Maximize2,
  Minimize2,
  Crosshair,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { directoryService } from '../services/directoryService';
import { 
  VENTURA_COUNTY_CENTER, 
  CITY_COORDINATES, 
  getBusinessCoordinates 
} from '../utils/geoCoordinates';
import DcvcApprovedBadge from './DcvcApprovedBadge';
import AirDropPulseWaves from './AirDropPulseWaves';

const TILE_PROVIDERS = {
  voyager: {
    name: 'Vibrant Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  positron: {
    name: 'Editorial Clean',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  dark: {
    name: 'Night Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }
};

export default function DirectoryMapView({ businesses = [], onHype, activeHypeId }) {
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedBiz, setSelectedBiz] = useState(() => businesses[0] || null);
  const [activeTileStyle, setActiveTileStyle] = useState('voyager');
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const leafletRef = useRef(null);

  const cities = ['All', 'Ventura', 'Oxnard', 'Camarillo', 'Ojai', 'Thousand Oaks', 'Simi Valley'];

  // Filter businesses by city if selected
  const displayedBusinesses = selectedCity === 'All'
    ? businesses
    : businesses.filter((b) => (b.city || '').toLowerCase() === selectedCity.toLowerCase());

  // Keep selectedBiz valid when list changes
  useEffect(() => {
    if (displayedBusinesses.length > 0) {
      if (!selectedBiz || !displayedBusinesses.some((b) => (b.id || b.slug) === (selectedBiz.id || selectedBiz.slug))) {
        setSelectedBiz(displayedBusinesses[0]);
      }
    } else {
      setSelectedBiz(null);
    }
  }, [displayedBusinesses]);

  // 1. Initialize Real Leaflet Map (Browser Only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      leafletRef.current = L.default || L;

      // Prevent re-initialization if container already has a map
      if (!mapRef.current) {
        const initialCenter = VENTURA_COUNTY_CENTER;
        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 11,
          zoomControl: false, // We add custom styled zoom control in top-right
          attributionControl: true
        });

        // Add sleek zoom control in top-right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Add base tile layer
        const provider = TILE_PROVIDERS[activeTileStyle] || TILE_PROVIDERS.voyager;
        const tileLayer = L.tileLayer(provider.url, {
          attribution: provider.attribution,
          subdomains: provider.subdomains,
          maxZoom: provider.maxZoom
        }).addTo(map);

        map.tileLayerInstance = tileLayer;

        // Initialize Marker Group Layer
        const markerGroup = L.featureGroup().addTo(map);
        markerGroupRef.current = markerGroup;

        mapRef.current = map;
      }
    }).catch((err) => {
      console.warn('[DirectoryMapView] Failed to load Leaflet:', err);
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerGroupRef.current = null;
      }
    };
  }, []);

  // 2. Handle Tile Layer Switch
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !map.tileLayerInstance) return;

    const provider = TILE_PROVIDERS[activeTileStyle] || TILE_PROVIDERS.voyager;
    map.removeLayer(map.tileLayerInstance);

    const nextTileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains,
      maxZoom: provider.maxZoom
    }).addTo(map);

    map.tileLayerInstance = nextTileLayer;
  }, [activeTileStyle]);

  // 3. Update Markers when Businesses or SelectedBiz change (Dynamic Live Updates)
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !L || !markerGroup) return;

    // Clear old markers
    markerGroup.clearLayers();

    if (displayedBusinesses.length === 0) return;

    displayedBusinesses.forEach((biz, idx) => {
      const coords = getBusinessCoordinates(biz, idx);
      const isSelected = selectedBiz && (selectedBiz.id === biz.id || (selectedBiz.slug && selectedBiz.slug === biz.slug));
      const isApproved = Boolean(biz.is_verified || biz.isVerifiedAffirming || biz.verified);
      const stats = directoryService.getBusinessStats(biz);
      const openStatus = directoryService.getOpenStatus(biz);
      const directionsUrl = directoryService.getDirectionsUrl(biz);

      const initials = (biz.name || 'Biz').slice(0, 2).toUpperCase();

      // Custom HTML Marker Icon
      const markerHtml = `
        <div class="dcvc-map-marker-wrapper ${isSelected ? 'is-selected' : ''} ${isApproved ? 'is-approved' : ''}" title="${biz.name} (${biz.city})">
          <div class="marker-pin-outer">
            ${isApproved ? '<div class="marker-rainbow-ring"></div>' : ''}
            <div class="marker-pin-core">
              <span>${initials}</span>
              ${isApproved ? '<span class="marker-verified-dot">✓</span>' : ''}
            </div>
          </div>
          <div class="marker-rating-badge">★ ${stats.rating}</div>
          <div class="marker-arrow"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: markerHtml,
        iconSize: [42, 46],
        iconAnchor: [21, 46],
        popupAnchor: [0, -46]
      });

      const marker = L.marker(coords, {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : (isApproved ? 500 : 100)
      });

      // Rich Interactive Popup
      const popupHtml = `
        <div style="font-family: inherit; width: 220px; padding: 12px; background: #ffffff;">
          <div style="position: relative; height: 95px; width: 100%; border-radius: 10px; overflow: hidden; background: #f1f5f9; margin-bottom: 8px;">
            <img 
              src="${biz.image || biz.cover_url || '/images/community-gathering.jpg'}" 
              alt="${biz.name}" 
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.src='/images/community-gathering.jpg'"
            />
            ${isApproved ? '<span style="position: absolute; top: 6px; left: 6px; padding: 2px 7px; border-radius: 9999px; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; background: #10B981; color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">✓ DCVC Approved</span>' : ''}
            <span style="position: absolute; top: 6px; right: 6px; padding: 2px 6px; border-radius: 6px; font-size: 9px; font-weight: 900; background: rgba(255,255,255,0.95); color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">${stats.price}</span>
          </div>

          <div style="margin-bottom: 6px;">
            <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #5A1E65; margin-bottom: 2px;">
              ${biz.category || 'Business'}
            </div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; line-height: 1.2;">
              ${biz.name}
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 8px; color: #475569;">
            <span style="font-weight: 800; color: #d97706;">★ ${stats.rating} <span style="font-weight: 500; color: #94a3b8;">(${stats.ratingCount})</span></span>
            <span style="font-weight: 800; color: #7c3aed;">🔥 ${stats.hypes} Hypes</span>
          </div>

          <div style="display: flex; items-center; justify-content: space-between; gap: 6px; pt: 6px; border-top: 1px solid #f1f5f9; font-size: 11px; font-weight: 800;">
            <a href="/directory/${biz.slug || biz.id}" style="color: #5A1E65; text-decoration: none;">View Profile →</a>
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="color: #64748b; text-decoration: none;">Directions ↗</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'dcvc-custom-leaflet-popup'
      });

      // Pin Click Handler: Select business in drawer & pan smoothly
      marker.on('click', () => {
        setSelectedBiz(biz);
        map.panTo(coords, { animate: true, duration: 0.6 });
      });

      markerGroup.addLayer(marker);
    });

    // Auto-fit bounds if list changed or newly rendered
    try {
      const bounds = markerGroup.getBounds();
      if (bounds.isValid() && selectedCity === 'All') {
        map.fitBounds(bounds.pad(0.12), { maxZoom: 14 });
      }
    } catch (_) {}
  }, [displayedBusinesses, selectedBiz, selectedCity]);

  // 4. City Quick-Jump Handler (Fly to City)
  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    const map = mapRef.current;
    if (!map) return;

    if (cityName === 'All') {
      const markerGroup = markerGroupRef.current;
      if (markerGroup) {
        try {
          const bounds = markerGroup.getBounds();
          if (bounds.isValid()) {
            map.flyToBounds(bounds.pad(0.15), { duration: 1.2 });
            return;
          }
        } catch (_) {}
      }
      map.flyTo(VENTURA_COUNTY_CENTER, 11, { duration: 1.2 });
      return;
    }

    const cityKey = cityName.toLowerCase();
    const cityData = CITY_COORDINATES[cityKey];
    if (cityData) {
      map.flyTo([cityData.lat, cityData.lng], cityData.zoom, { duration: 1.2 });
    }
  };

  // 5. Fit All Pins Button
  const handleFitAllPins = () => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    try {
      const bounds = markerGroup.getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds.pad(0.15), { duration: 1.2 });
      } else {
        map.flyTo(VENTURA_COUNTY_CENTER, 11, { duration: 1.2 });
      }
    } catch (_) {
      map.flyTo(VENTURA_COUNTY_CENTER, 11, { duration: 1.2 });
    }
  };

  // 6. User Geolocation Handler (Locate Me)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);

        // Place pulsing user marker
        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
        }

        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="position: relative; width: 20px; height: 20px;">
              <span style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: absolute; inset: 0; border-radius: 9999px; background: #2563EB; border: 3px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></span>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
        userMarker.bindPopup('<b>You are here</b><br/>Searching nearby affirming businesses.').openPopup();
        userMarkerRef.current = userMarker;

        map.flyTo([latitude, longitude], 13, { duration: 1.2 });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert('Could not retrieve your location. Please check browser permissions.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className={`w-full flex flex-col gap-5 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4 sm:p-6' : ''}`}>
      {/* Top Filter & Map Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 p-3 rounded-2xl border border-slate-200/90 shadow-sm backdrop-blur-md">
        
        {/* City Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mr-1 shrink-0">
            <Compass className="w-4 h-4 text-[#5A1E65]" />
            <span className="hidden sm:inline">Jump to City:</span>
          </div>

          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleCitySelect(city)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCity === city
                  ? 'bg-[#5A1E65] text-white shadow-xs font-black scale-105'
                  : 'bg-slate-100 hover:bg-purple-50 text-slate-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Action Buttons: Locate Me, Fit Bounds, Tile Switcher */}
        <div className="flex items-center gap-2">
          {/* Fit Bounds */}
          <button
            type="button"
            onClick={handleFitAllPins}
            className="p-2 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#5A1E65] transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1.5"
            title="Fit All Businesses in View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Fit All</span>
          </button>

          {/* Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1.5"
            title="Locate Me in Ventura County"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden md:inline">{isLocating ? 'Locating...' : 'Near Me'}</span>
          </button>

          {/* Map Layer Style Switcher */}
          <select
            value={activeTileStyle}
            onChange={(e) => setActiveTileStyle(e.target.value)}
            className="py-1.5 px-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 outline-none cursor-pointer hover:bg-slate-200"
            title="Switch Map Visual Style"
          >
            <option value="voyager">🗺️ Voyager</option>
            <option value="positron">📄 Positron</option>
            <option value="dark">🌙 Dark Mode</option>
          </select>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Map + Yelp Inspection Drawer Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${isFullscreen ? 'flex-1' : 'min-h-[620px]'}`}>
        
        {/* Real Zoomable Leaflet Map Container */}
        <div className="lg:col-span-8 rounded-3xl overflow-hidden border-2 border-purple-200/90 shadow-2xl relative flex flex-col justify-between bg-slate-900">
          
          {/* Map Canvas Root */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-full min-h-[460px] lg:min-h-full"
            style={{ minHeight: isFullscreen ? '100%' : '520px' }}
          />

          {/* Floating Map Status Overlay */}
          <div className="absolute top-4 left-4 z-[400] pointer-events-none">
            <div className="p-2.5 px-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-purple-200/80 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Map · {displayedBusinesses.length} Locations</span>
            </div>
          </div>

          {/* Floating Bottom Help Note */}
          <div className="absolute bottom-4 left-4 right-4 z-[400] pointer-events-none hidden sm:flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span className="p-1.5 px-3 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs">
              💡 Pinch or scroll to zoom · Click any pin to inspect & navigate
            </span>
            <span className="p-1.5 px-3 rounded-xl bg-purple-950/80 text-purple-200 backdrop-blur-md shadow-xs">
              Ventura County Affirming Network
            </span>
          </div>
        </div>

        {/* Selected Business Preview Card (Yelp-style side inspection drawer) */}
        <div className="lg:col-span-4 flex flex-col">
          {selectedBiz ? (() => {
            const stats = directoryService.getBusinessStats(selectedBiz);
            const openStatus = directoryService.getOpenStatus(selectedBiz);
            const directionsUrl = directoryService.getDirectionsUrl(selectedBiz);
            const isApproved = Boolean(selectedBiz.is_verified || selectedBiz.isVerifiedAffirming || selectedBiz.verified);
            const amenities = directoryService.getAmenities(selectedBiz);

            return (
              <div className="h-full rounded-3xl bg-white border border-purple-200/80 shadow-xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
                <AirDropPulseWaves
                  active={activeHypeId === (selectedBiz.id || selectedBiz.slug)}
                  bizId={selectedBiz.id || selectedBiz.slug}
                  category={selectedBiz.category}
                />

                <div className="space-y-4">
                  {/* Photo Header with Badges */}
                  <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 relative border border-slate-200 shadow-inner">
                    <img
                      src={selectedBiz.image || selectedBiz.cover_url || '/images/community-gathering.jpg'}
                      alt={selectedBiz.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/community-gathering.jpg'; }}
                    />
                    <div className="absolute top-2.5 left-2.5 z-10">
                      {isApproved && <DcvcApprovedBadge />}
                    </div>
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/95 text-slate-800 shadow-xs border border-slate-200">
                        {stats.price}
                      </span>
                    </div>
                  </div>

                  {/* Header Title & Ratings */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                      <span className="text-[#5A1E65] font-extrabold uppercase tracking-wider text-[10px]">
                        {selectedBiz.category}
                      </span>
                      <span>{selectedBiz.city}, CA</span>
                    </div>

                    <h3 className="font-display text-xl font-black text-slate-950 leading-tight">
                      {selectedBiz.name}
                    </h3>

                    {/* Yelp-style Stars & Review Metrics */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{stats.rating}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        ({stats.ratingCount} ratings)
                      </span>
                      <span className="text-slate-300">·</span>
                      {/* Live Hypes */}
                      <button
                        type="button"
                        onClick={() => onHype && onHype(selectedBiz)}
                        className="flex items-center gap-1 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200 cursor-pointer transition-colors"
                        title="Tap to Hype this business"
                      >
                        <Flame className="w-3 h-3 text-orange-500 fill-orange-400" />
                        <span>{stats.hypes} Hypes</span>
                      </button>
                    </div>

                    {/* Live Open / Closed Status Pill */}
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold ${
                        openStatus.isOpen 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span>{openStatus.statusText}</span>
                      </span>
                      <span className="text-slate-500 text-[11px] font-medium">
                        {openStatus.detailText}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium">
                    {selectedBiz.description}
                  </p>

                  {/* Amenities Highlights */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {amenities.slice(0, 3).map((amenity, i) => (
                      <span key={i} className="text-[10px] font-medium bg-slate-50 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-800 hover:text-[#5A1E65] text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#5A1E65]" />
                    <span>Get Directions</span>
                  </a>

                  <Link
                    to={`/directory/${selectedBiz.slug || selectedBiz.id}`}
                    className="flex-1 py-2 px-3 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })() : (
            <div className="h-full rounded-3xl bg-white border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
              <MapPin className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold">Select a map pin to view business profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
