// Google Maps API configuration
// Use environment variable for API key (falls back to empty string if not set)
// In browser context, we need to check if we're on the client side
export const GOOGLE_API_KEY = typeof window !== 'undefined' 
  ? (window.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCAn-JvV4sTaGP5P4zFb0PlzFYOinzH1A8')
  : 'AIzaSyCAn-JvV4sTaGP5P4zFb0PlzFYOinzH1A8';

// Multi-city origin points
export const CITY_ORIGINS = {
  sydney: '136 Victoria Road, Marrickville NSW',
  brisbane: 'Queen Street Mall, Brisbane QLD',
  melbourne: 'Docklands, Melbourne VIC'
};

// Default to Sydney for backwards compatibility
export const WAREHOUSE_ADDRESS = CITY_ORIGINS.sydney;

// Load Google Maps script
let googleMapsPromise = null;

/**
 * Load Google Maps JavaScript API
 * @returns {Promise} Promise that resolves when Google Maps is loaded
 */
export function loadGoogleMaps() {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(window.google);
    };

    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Calculate distance from a specific city origin
 * @param {string} city - City name ('sydney', 'brisbane', or 'melbourne')
 * @param {string} customerAddress - Customer's delivery address
 * @returns {Promise<Object>} Distance information
 */
export async function calculateDistanceFromCity(city, customerAddress) {
  try {
    await loadGoogleMaps();
    const origin = CITY_ORIGINS[city] || CITY_ORIGINS.sydney;
    
    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [customerAddress],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      }, (response, status) => {
        if (status === 'OK' && response.rows[0]) {
          const element = response.rows[0].elements[0];
          
          if (element.status === 'OK') {
            resolve({
              success: true,
              city,
              origin,
              distanceInMeters: element.distance.value,
              distanceInKm: element.distance.value / 1000,
              distanceText: element.distance.text,
              durationInSeconds: element.duration.value,
              durationText: element.duration.text,
              formattedAddress: response.destinationAddresses[0]
            });
          } else if (element.status === 'ZERO_RESULTS') {
            reject(new Error('No route found to this address'));
          } else {
            reject(new Error(`Cannot calculate delivery to this address: ${element.status}`));
          }
        } else {
          reject(new Error(`Google Maps error: ${status}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to calculate distance: ${error.message}`);
  }
}

/**
 * Calculate distance from Sydney (backwards compatibility)
 * @param {string} customerAddress - Customer's delivery address
 * @returns {Promise<Object>} Distance information
 */
export async function calculateDistance(customerAddress) {
  return calculateDistanceFromCity('sydney', customerAddress);
}

/**
 * Detect which city to calculate from based on address
 * @param {string} address - Address to analyze
 * @returns {string} City key ('sydney', 'brisbane', or 'melbourne')
 */
export function detectCity(address) {
  const upperAddress = address.toUpperCase();
  
  // Check state codes
  if (upperAddress.includes('QLD') || upperAddress.includes('QUEENSLAND')) {
    return 'brisbane';
  }
  if (upperAddress.includes('VIC') || upperAddress.includes('VICTORIA')) {
    return 'melbourne';
  }
  if (upperAddress.includes('ACT') || upperAddress.includes('CANBERRA')) {
    return 'sydney'; // ACT closest to Sydney
  }
  
  // Default to Sydney for NSW and unknown
  return 'sydney';
}

/**
 * Initialize Google Places Autocomplete for address input
 * @param {HTMLInputElement} inputElement - Input element to attach autocomplete
 * @param {Function} onPlaceSelected - Callback when place is selected
 * @returns {Object} Autocomplete instance
 */
export async function initializeAutocomplete(inputElement, onPlaceSelected) {
  try {
    await loadGoogleMaps();
    
    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
      componentRestrictions: { country: 'au' },
      fields: ['formatted_address', 'geometry'],
      types: ['address']
    });

    // Expand bounds to include corridor areas (Sydney to Brisbane)
    const corridorBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(-34.169, 150.502), // Sydney SW
      new window.google.maps.LatLng(-27.384, 153.118)   // Brisbane NE
    );
    autocomplete.setBounds(corridorBounds);

    // Handle place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onPlaceSelected(place.formatted_address);
      }
    });

    return autocomplete;
  } catch (error) {
    throw new Error(`Failed to initialize autocomplete: ${error.message}`);
  }
}


/**
 * Get coordinates for an address
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Coordinates {lat, lng}
 */
export async function geocodeAddress(address) {
  try {
    await loadGoogleMaps();
    
    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formattedAddress: results[0].formatted_address
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
}

/**
 * Create a map showing delivery route
 * @param {HTMLElement} mapElement - Map container element
 * @param {string} customerAddress - Customer's delivery address
 * @returns {Promise<Object>} Map instance with route
 */
export async function createDeliveryMap(mapElement, customerAddress) {
  try {
    console.log('createDeliveryMap called with:', { mapElement, customerAddress });
    
    await loadGoogleMaps();
    console.log('Google Maps loaded successfully');
    
    // Get coordinates for both locations
    console.log('Geocoding addresses...');
    const [warehouseCoords, customerCoords] = await Promise.all([
      geocodeAddress(WAREHOUSE_ADDRESS),
      geocodeAddress(customerAddress)
    ]);
    
    console.log('Coordinates obtained:', { warehouseCoords, customerCoords });

    // Create map centered between the two points
    const map = new window.google.maps.Map(mapElement, {
      zoom: 11,
      center: {
        lat: (warehouseCoords.lat + customerCoords.lat) / 2,
        lng: (warehouseCoords.lng + customerCoords.lng) / 2
      },
      styles: [
        {
          "featureType": "all",
          "elementType": "geometry",
          "stylers": [{ "color": "#f5f5f5" }]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{ "color": "#ffffff" }]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{ "color": "#c9d4e4" }]
        }
      ],
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
    
    console.log('Map instance created');

    // Add markers
    const warehouseMarker = new window.google.maps.Marker({
      position: warehouseCoords,
      map,
      title: 'ausbeds Warehouse',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#6366F1',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    const customerMarker = new window.google.maps.Marker({
      position: customerCoords,
      map,
      title: 'Delivery Address',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#EC4899',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });
    
    console.log('Markers added to map');

    // Draw route
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#6366F1',
        strokeOpacity: 0.7,
        strokeWeight: 4
      }
    });

    directionsService.route({
      origin: warehouseCoords,
      destination: customerCoords,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (result, status) => {
      console.log('Directions result:', { status, result });
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        console.log('Route rendered successfully');
      } else {
        console.warn('Failed to get directions:', status);
      }
    });

    // Fit bounds to show both markers
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(warehouseCoords);
    bounds.extend(customerCoords);
    map.fitBounds(bounds);
    
    console.log('Map bounds set, map should be visible');

    return { map, warehouseMarker, customerMarker };
  } catch (error) {
    console.error('createDeliveryMap error:', error);
    throw new Error(`Failed to create map: ${error.message}`);
  }
}
