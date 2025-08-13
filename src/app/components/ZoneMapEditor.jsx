import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadGoogleMaps } from '../services/googleMapsService';

function ZoneMapEditor({ onZoneUpdate }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonRef = useRef(null);
  const geocoderRef = useRef(null);
  const markersRef = useRef([]);
  
  const [activeZone, setActiveZone] = useState(null);
  const [zonePolygons, setZonePolygons] = useState({
    northern: null,
    eastern: null,
    western: null,
    southern: null
  });
  const [capturedPostcodes, setCapturedPostcodes] = useState({
    northern: [],
    eastern: [],
    western: [],
    southern: []
  });

  // Zone colors
  const zoneColors = {
    northern: '#3B82F6', // blue
    eastern: '#10B981',  // green
    western: '#F59E0B',  // amber
    southern: '#EF4444'  // red
  };

  // Default zone boundaries for Sydney (as polygon paths with 5 points)
  const defaultZonePaths = {
    northern: [
      { lat: -33.6, lng: 151.1 },    // NW corner
      { lat: -33.6, lng: 151.225 },  // N mid point
      { lat: -33.6, lng: 151.35 },   // NE corner
      { lat: -33.85, lng: 151.35 },  // SE corner
      { lat: -33.85, lng: 151.1 }    // SW corner
    ],
    eastern: [
      { lat: -33.75, lng: 151.15 },
      { lat: -33.75, lng: 151.25 },  // E mid point
      { lat: -33.75, lng: 151.35 },
      { lat: -34.0, lng: 151.35 },
      { lat: -34.0, lng: 151.15 }
    ],
    western: [
      { lat: -33.65, lng: 150.6 },
      { lat: -33.65, lng: 150.85 },  // W mid point
      { lat: -33.65, lng: 151.1 },
      { lat: -33.95, lng: 151.1 },
      { lat: -33.95, lng: 150.6 }
    ],
    southern: [
      { lat: -33.95, lng: 150.9 },
      { lat: -33.95, lng: 151.1 },   // S mid point
      { lat: -33.95, lng: 151.3 },
      { lat: -34.3, lng: 151.3 },
      { lat: -34.3, lng: 150.9 }
    ]
  };

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMaps();
        
        if (!mapRef.current) return;

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: -33.8688, lng: 151.2093 }, // Sydney center
          zoom: 10,
          mapTypeId: 'roadmap',
          streetViewControl: false,
          fullscreenControl: false
        });

        mapInstanceRef.current = map;
        geocoderRef.current = new window.google.maps.Geocoder();

        // Load saved zones from localStorage, or use defaults
        const savedZones = localStorage.getItem('zonePolygonPaths');
        const zonesToLoad = savedZones ? JSON.parse(savedZones) : defaultZonePaths;
        
        // Save defaults if nothing saved yet
        if (!savedZones) {
          localStorage.setItem('zonePolygonPaths', JSON.stringify(defaultZonePaths));
        }
        
        Object.entries(zonesToLoad).forEach(([zone, path]) => {
          if (path) {
            createPolygonForZone(zone, path);
            // Get initial postcodes for default zones
            if (!savedZones) {
              const bounds = getPolygonBounds(path);
              findPostcodesInBounds(bounds, zone);
            }
          }
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      clearActivePolygon();
    };
  }, []);

  const getPolygonBounds = (path) => {
    const bounds = new window.google.maps.LatLngBounds();
    path.forEach(point => {
      bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
    });
    return bounds;
  };

  const createPolygonForZone = (zone, path) => {
    const polygon = new window.google.maps.Polygon({
      paths: path,
      strokeColor: zoneColors[zone],
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: zoneColors[zone],
      fillOpacity: 0.35,
      map: mapInstanceRef.current,
      clickable: true
    });

    polygon.addListener('click', () => {
      if (!activeZone) {
        startEditingZone(zone, polygon);
      }
    });

    setZonePolygons(prev => ({
      ...prev,
      [zone]: polygon
    }));
  };

  const clearActivePolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  const startEditingZone = (zone, existingPolygon) => {
    // Clear any active editing
    clearActivePolygon();
    
    // Hide the existing polygon
    if (existingPolygon) {
      existingPolygon.setMap(null);
    }

    setActiveZone(zone);
    
    // Get the path from existing polygon or create default
    const path = existingPolygon ? existingPolygon.getPath().getArray().map(p => ({lat: p.lat(), lng: p.lng()})) : null;
    
    if (path) {
      createEditablePolygon(zone, path);
    }
  };

  const startDrawingZone = (zone) => {
    // Clear any existing zone polygon
    if (zonePolygons[zone]) {
      zonePolygons[zone].setMap(null);
    }

    setActiveZone(zone);

    // Create default pentagon based on map center
    const center = mapInstanceRef.current.getCenter();
    const size = 0.1; // Initial size

    const defaultPath = [
      { lat: center.lat() - size/2, lng: center.lng() - size/2 },  // Bottom left
      { lat: center.lat() - size/2, lng: center.lng() },           // Bottom mid
      { lat: center.lat() - size/2, lng: center.lng() + size/2 },  // Bottom right
      { lat: center.lat() + size/2, lng: center.lng() + size/2 },  // Top right
      { lat: center.lat() + size/2, lng: center.lng() - size/2 }   // Top left
    ];

    createEditablePolygon(zone, defaultPath);
  };

  const createEditablePolygon = (zone, path) => {
    clearActivePolygon();

    // Create editable polygon
    const polygon = new window.google.maps.Polygon({
      paths: path,
      strokeColor: zoneColors[zone],
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: zoneColors[zone],
      fillOpacity: 0.35,
      map: mapInstanceRef.current,
      draggable: true
    });

    polygonRef.current = polygon;

    // Create draggable markers at each vertex
    path.forEach((point, index) => {
      const marker = new window.google.maps.Marker({
        position: point,
        map: mapInstanceRef.current,
        draggable: true,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 11,  // Increased from 8 to 11 (roughly 40% bigger)
          fillColor: '#FFFFFF',
          fillOpacity: 1,
          strokeColor: zoneColors[zone],
          strokeWeight: 3
        },
        title: `Drag to adjust point ${index + 1}`,
        cursor: 'move'
      });

      // Update polygon when marker is dragged
      marker.addListener('drag', () => {
        const newPath = polygon.getPath();
        newPath.setAt(index, marker.getPosition());
      });

      marker.addListener('dragend', () => {
        const bounds = getPolygonBounds(polygon.getPath().getArray().map(p => ({lat: p.lat(), lng: p.lng()})));
        debouncedFindPostcodes(bounds, zone);
      });

      markersRef.current.push(marker);
    });

    // Update postcodes when polygon is dragged
    polygon.addListener('dragend', () => {
      // Update marker positions
      const newPath = polygon.getPath().getArray();
      markersRef.current.forEach((marker, index) => {
        marker.setPosition(newPath[index]);
      });
      
      const bounds = getPolygonBounds(newPath.map(p => ({lat: p.lat(), lng: p.lng()})));
      debouncedFindPostcodes(bounds, zone);
    });

    // Get initial postcodes
    const bounds = getPolygonBounds(path);
    findPostcodesInBounds(bounds, zone);
  };

  const debouncedFindPostcodes = useCallback(
    debounce((bounds, zone) => {
      findPostcodesInBounds(bounds, zone);
    }, 500),
    []
  );

  const findPostcodesInBounds = async (bounds, zone) => {
    if (!geocoderRef.current) return;

    const postcodes = new Set();
    
    // Create a smaller grid to avoid rate limits
    const numPoints = 5; // Check 5x5 grid
    const north = bounds.getNorthEast().lat();
    const south = bounds.getSouthWest().lat();
    const east = bounds.getNorthEast().lng();
    const west = bounds.getSouthWest().lng();
    
    const latStep = (north - south) / numPoints;
    const lngStep = (east - west) / numPoints;

    // Sample a few points to get postcodes
    for (let i = 0; i <= numPoints; i++) {
      for (let j = 0; j <= numPoints; j++) {
        const lat = south + (latStep * i);
        const lng = west + (lngStep * j);
        
        try {
          await new Promise((resolve) => {
            geocoderRef.current.geocode(
              { location: { lat, lng } },
              (results, status) => {
                if (status === 'OK' && results[0]) {
                  const addressComponents = results[0].address_components;
                  const postcodeComponent = addressComponents.find(
                    component => component.types.includes('postal_code')
                  );
                  if (postcodeComponent) {
                    postcodes.add(postcodeComponent.long_name);
                  }
                }
                setTimeout(resolve, 100); // Small delay between requests
              }
            );
          });
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }
    }
    
    const postcodeArray = Array.from(postcodes).sort();
    setCapturedPostcodes(prev => ({
      ...prev,
      [zone]: postcodeArray
    }));
  };

  const saveZone = () => {
    if (!activeZone || !polygonRef.current) return;

    const path = polygonRef.current.getPath().getArray().map(p => ({
      lat: p.lat(),
      lng: p.lng()
    }));

    // Save path to localStorage
    const savedZones = localStorage.getItem('zonePolygonPaths') || '{}';
    const zones = JSON.parse(savedZones);
    zones[activeZone] = path;
    localStorage.setItem('zonePolygonPaths', JSON.stringify(zones));

    // Create non-editable polygon
    createPolygonForZone(activeZone, path);

    // Save postcodes to zone configuration
    const postcodeRanges = convertPostcodesToRanges(capturedPostcodes[activeZone]);
    const savedZonePostcodes = localStorage.getItem('zonePostcodes') || '{}';
    const zonePostcodes = JSON.parse(savedZonePostcodes);
    zonePostcodes[activeZone] = postcodeRanges;
    localStorage.setItem('zonePostcodes', JSON.stringify(zonePostcodes));

    if (onZoneUpdate) {
      onZoneUpdate(activeZone, postcodeRanges);
    }

    clearActivePolygon();
    setActiveZone(null);
  };

  const cancelDrawing = () => {
    clearActivePolygon();
    
    // Restore the original polygon if it exists
    const savedZones = localStorage.getItem('zonePolygonPaths');
    if (savedZones && activeZone) {
      const zones = JSON.parse(savedZones);
      if (zones[activeZone]) {
        createPolygonForZone(activeZone, zones[activeZone]);
      }
    }
    
    setActiveZone(null);
    setCapturedPostcodes(prev => ({
      ...prev,
      [activeZone]: []
    }));
  };

  const resetToDefaults = () => {
    if (confirm('Reset all zones to default boundaries? This will overwrite your current configuration.')) {
      // Clear existing polygons
      Object.values(zonePolygons).forEach(polygon => {
        if (polygon) polygon.setMap(null);
      });
      
      clearActivePolygon();
      
      // Reset to defaults
      localStorage.setItem('zonePolygonPaths', JSON.stringify(defaultZonePaths));
      
      // Recreate polygons
      Object.entries(defaultZonePaths).forEach(([zone, path]) => {
        createPolygonForZone(zone, path);
        const bounds = getPolygonBounds(path);
        findPostcodesInBounds(bounds, zone);
      });
      
      setZonePolygons({});
      window.location.reload(); // Refresh to fully reset
    }
  };

  const convertPostcodesToRanges = (postcodes) => {
    if (!postcodes || postcodes.length === 0) return [];
    
    const ranges = [];
    let start = postcodes[0];
    let prev = postcodes[0];
    
    for (let i = 1; i < postcodes.length; i++) {
      const current = postcodes[i];
      if (parseInt(current) !== parseInt(prev) + 1) {
        // End of a range
        ranges.push(start === prev ? start : `${start}-${prev}`);
        start = current;
      }
      prev = current;
    }
    
    // Add the last range
    ranges.push(start === prev ? start : `${start}-${prev}`);
    
    return ranges;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-4">Zone Coverage Map</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click a zone button below to edit its coverage area. Drag the corners to adjust boundaries.
          </p>
        </div>
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div ref={mapRef} className="w-full h-[48rem] rounded-lg border border-gray-300" />
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                const currentZoom = mapInstanceRef.current.getZoom();
                mapInstanceRef.current.setZoom(currentZoom + 1);
              }
            }}
            className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                const currentZoom = mapInstanceRef.current.getZoom();
                mapInstanceRef.current.setZoom(currentZoom - 1);
              }
            }}
            className="p-3 hover:bg-gray-100 transition-colors"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
        
        {/* Active zone indicator */}
        {activeZone && (
          <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium">
              Drawing: <span style={{ color: zoneColors[activeZone] }}>
                {activeZone.charAt(0).toUpperCase() + activeZone.slice(1)} Zone
              </span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Postcodes found: {capturedPostcodes[activeZone]?.length || 0}
            </p>
          </div>
        )}
      </div>

      {/* Zone Buttons */}
      <div className="grid grid-cols-4 gap-4">
        {['northern', 'eastern', 'western', 'southern'].map((zone) => (
          <button
            key={zone}
            onClick={() => {
              if (zonePolygons[zone]) {
                startEditingZone(zone, zonePolygons[zone]);
              } else {
                startDrawingZone(zone);
              }
            }}
            disabled={activeZone && activeZone !== zone}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              activeZone === zone
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : `text-white hover:opacity-90`
            }`}
            style={{
              backgroundColor: activeZone === zone ? '#E5E7EB' : zoneColors[zone]
            }}
          >
            {zone.charAt(0).toUpperCase() + zone.slice(1)}
            {zonePolygons[zone] && !activeZone && (
              <span className="block text-xs mt-1">✓ Click to edit</span>
            )}
          </button>
        ))}
      </div>

      {/* Save/Cancel buttons when actively drawing */}
      {activeZone && (
        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
          <div>
            <p className="text-sm font-medium text-blue-900">
              {capturedPostcodes[activeZone]?.length || 0} postcodes captured
            </p>
            {capturedPostcodes[activeZone]?.length > 0 && (
              <p className="text-xs text-blue-700 mt-1">
                {capturedPostcodes[activeZone].slice(0, 5).join(', ')}
                {capturedPostcodes[activeZone].length > 5 && '...'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={cancelDrawing}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveZone}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Save Zone
            </button>
          </div>
        </div>
      )}

      {/* Current zone postcodes display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Zone Postcodes</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(capturedPostcodes).map(([zone, postcodes]) => {
            const saved = localStorage.getItem('zonePostcodes');
            const savedPostcodes = saved ? JSON.parse(saved)[zone] : [];
            const displayPostcodes = postcodes.length > 0 ? postcodes : savedPostcodes;
            
            return (
              <div key={zone}>
                <span className="font-medium" style={{ color: zoneColors[zone] }}>
                  {zone.charAt(0).toUpperCase() + zone.slice(1)}:
                </span>
                <span className="ml-2 text-gray-600">
                  {Array.isArray(displayPostcodes) && displayPostcodes.length > 0
                    ? displayPostcodes.slice(0, 3).join(', ') + (displayPostcodes.length > 3 ? '...' : '')
                    : 'Not configured'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default ZoneMapEditor;