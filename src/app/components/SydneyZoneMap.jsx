'use client';

import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../services/googleMapsService';

// Zone boundaries for Sydney regions - covering entire metro area without gaps
const ZONE_BOUNDARIES = {
  eastern: {
    color: '#3B82F6',
    name: 'Eastern Suburbs',
    // Eastern beaches and suburbs
    coordinates: [
      { lat: -33.8400, lng: 151.2000 }, // Harbor edge (matches inner west)
      { lat: -33.8367, lng: 151.2820 }, // Bondi Beach  
      { lat: -33.9500, lng: 151.2620 }, // Maroubra
      { lat: -33.9900, lng: 151.2330 }, // La Perouse
      { lat: -33.9900, lng: 151.1800 }, // Botany Bay west (matches southern)
      { lat: -33.9200, lng: 151.1800 }, // Rosebery (matches inner west)
      { lat: -33.8800, lng: 151.2000 }, // Paddington
      { lat: -33.8400, lng: 151.2000 }  // Back to harbor
    ]
  },
  innerWest: {
    color: '#8B5CF6',
    name: 'Inner West',
    // Inner western suburbs
    coordinates: [
      { lat: -33.8400, lng: 151.2000 }, // Sydney CBD edge (matches eastern & northern)
      { lat: -33.8400, lng: 151.1000 }, // Northwest corner (matches northern)
      { lat: -33.8600, lng: 151.1000 }, // Strathfield (matches western)
      { lat: -33.9200, lng: 151.1000 }, // Campsie (matches western & southern)
      { lat: -33.9200, lng: 151.1800 }, // Marrickville (matches eastern & southern)
      { lat: -33.8800, lng: 151.2000 }, // Newtown to CBD
      { lat: -33.8400, lng: 151.2000 }  // Back to start
    ]
  },
  western: {
    color: '#F97316',
    name: 'Western Sydney',
    // Central western suburbs
    coordinates: [
      { lat: -33.7000, lng: 151.1000 }, // North boundary (matches northern)
      { lat: -33.7000, lng: 150.8000 }, // Northwest (matches northWest)
      { lat: -33.9200, lng: 150.8000 }, // Southwest (matches southWest & southern)
      { lat: -33.9200, lng: 151.0000 }, // Southeast (matches southern & innerWest)
      { lat: -33.8600, lng: 151.1000 }, // Strathfield (matches innerWest)
      { lat: -33.8400, lng: 151.1000 }, // Northeast (matches northern & innerWest)
      { lat: -33.7000, lng: 151.1000 }  // Back to start
    ]
  },
  northern: {
    color: '#10B981',
    name: 'Northern Suburbs',
    // North Shore and Northern Beaches
    coordinates: [
      { lat: -33.8400, lng: 151.2000 }, // Harbor/CBD (matches eastern & innerWest)
      { lat: -33.8000, lng: 151.2850 }, // Manly/Beaches
      { lat: -33.5800, lng: 151.3300 }, // Palm Beach
      { lat: -33.5800, lng: 151.0000 }, // Northern boundary (matches northWest)
      { lat: -33.7000, lng: 151.0000 }, // Northwest (matches northWest)
      { lat: -33.7000, lng: 151.1000 }, // Southwest (matches western)
      { lat: -33.8400, lng: 151.1000 }, // South (matches innerWest & western)
      { lat: -33.8400, lng: 151.2000 }  // Back to harbor
    ]
  },
  southern: {
    color: '#EF4444',
    name: 'Southern Sydney',
    // Sutherland Shire and St George
    coordinates: [
      { lat: -33.9200, lng: 151.1800 }, // Airport area (matches innerWest & eastern)
      { lat: -33.9900, lng: 151.1800 }, // East (matches eastern)
      { lat: -33.9900, lng: 151.2330 }, // Botany Bay
      { lat: -34.0700, lng: 151.1500 }, // Bundeena
      { lat: -34.1200, lng: 150.8000 }, // Southern boundary (matches southWest)
      { lat: -33.9200, lng: 150.8000 }, // Northwest (matches southWest & western)
      { lat: -33.9200, lng: 151.0000 }, // North (matches western & innerWest)
      { lat: -33.9200, lng: 151.1800 }  // Back to start
    ]
  },
  northWest: {
    color: '#6366F1',
    name: 'North West',
    // Hills District and beyond
    coordinates: [
      { lat: -33.5800, lng: 151.0000 }, // East boundary (matches northern)
      { lat: -33.5800, lng: 150.6000 }, // Far west
      { lat: -33.7000, lng: 150.6000 }, // Southwest corner (matches southWest)
      { lat: -33.7000, lng: 150.8000 }, // Southeast (matches western & southWest)
      { lat: -33.7000, lng: 151.0000 }, // East (matches northern & western)
      { lat: -33.5800, lng: 151.0000 }  // Back to start
    ]
  },
  southWest: {
    color: '#EC4899',
    name: 'South West',
    // Liverpool to Campbelltown region
    coordinates: [
      { lat: -33.7000, lng: 150.8000 }, // North boundary (matches northWest & western)
      { lat: -33.7000, lng: 150.6000 }, // Northwest (matches northWest)
      { lat: -34.1200, lng: 150.6000 }, // Far southwest
      { lat: -34.1200, lng: 150.8000 }, // Southeast (matches southern)
      { lat: -33.9200, lng: 150.8000 }, // Northeast (matches southern & western)
      { lat: -33.7000, lng: 150.8000 }  // Back to start
    ]
  }
};

function SydneyZoneMap({ highlightedZone = null }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonsRef = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMaps();
        
        if (!mapRef.current) return;
        
        // Create map centered on Sydney
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: -33.8688, lng: 151.0093 }, // Sydney center with western bias
          zoom: 10,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "transit",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        
        mapInstanceRef.current = map;
        
        // Create zone polygons
        Object.entries(ZONE_BOUNDARIES).forEach(([zoneKey, zone]) => {
          const polygon = new window.google.maps.Polygon({
            paths: zone.coordinates,
            strokeColor: zone.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: zone.color,
            fillOpacity: 0.35,
            map: map
          });
          
          // Add hover effect
          polygon.addListener('mouseover', function() {
            this.setOptions({ fillOpacity: 0.5 });
          });
          
          polygon.addListener('mouseout', function() {
            this.setOptions({ fillOpacity: 0.35 });
          });
          
          // Add click to show zone name
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <strong>${zone.name}</strong>
              </div>
            `
          });
          
          polygon.addListener('click', function(event) {
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
          });
          
          polygonsRef.current[zoneKey] = polygon;
        });
        
        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading map:', error);
        setMapError('Unable to load map. Please check your connection.');
      }
    };
    
    initMap();
  }, []);
  
  // Highlight specific zone when prop changes
  useEffect(() => {
    if (!mapLoaded || !polygonsRef.current) return;
    
    // Reset all polygons
    Object.values(polygonsRef.current).forEach(polygon => {
      polygon.setOptions({ fillOpacity: 0.35 });
    });
    
    // Highlight selected zone
    if (highlightedZone && polygonsRef.current[highlightedZone]) {
      polygonsRef.current[highlightedZone].setOptions({ fillOpacity: 0.6 });
    }
  }, [highlightedZone, mapLoaded]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-blue-900">Sydney Delivery Zones Map</h4>
        <p className="text-xs text-gray-600">Click zones for details</p>
      </div>
      
      {mapError ? (
        <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300">
          <p className="text-sm text-gray-600">{mapError}</p>
        </div>
      ) : (
        <div 
          ref={mapRef} 
          className="h-96 rounded-lg border border-blue-200 shadow-sm"
        />
      )}
      
      {/* Zone Legend */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {Object.entries(ZONE_BOUNDARIES).map(([key, zone]) => (
          <div key={key} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: zone.color }}
            />
            <span className="text-gray-700">{zone.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SydneyZoneMap;