// Zone service with accurate Sydney postcode mappings
import sydneyZones from '../../data/sydney-zones.json';

// Get zone for a specific postcode
export function getZoneForPostcode(postcode) {
  if (!postcode) return null;
  
  // Clean the postcode (remove spaces, ensure 4 digits)
  const cleanPostcode = postcode.toString().trim();
  
  // Check each zone for the postcode
  for (const [zoneKey, zoneData] of Object.entries(sydneyZones)) {
    if (zoneData.postcodes.includes(cleanPostcode)) {
      return {
        key: zoneKey,
        name: zoneData.name,
        postcode: cleanPostcode
      };
    }
  }
  
  return null;
}

// Get all postcodes for a zone
export function getPostcodesForZone(zoneKey) {
  const zone = sydneyZones[zoneKey];
  return zone ? zone.postcodes : [];
}

// Get zone display name
export function getZoneDisplayName(zoneKey) {
  const zone = sydneyZones[zoneKey];
  return zone ? zone.name : zoneKey;
}

// Get all zones
export function getAllZones() {
  return Object.entries(sydneyZones).map(([key, data]) => ({
    key,
    name: data.name,
    postcodeCount: data.postcodes.length,
    suburbCount: data.suburbs.length
  }));
}

// Check if postcode is in delivery area
export function isInDeliveryArea(postcode) {
  return getZoneForPostcode(postcode) !== null;
}

// Get zone for a specific suburb
export function getZoneForSuburb(suburb) {
  console.log('🔥🔥🔥 ZONE SERVICE START: getZoneForSuburb called with:', suburb);
  
  if (!suburb) {
    console.log('🔥🔥🔥 ZONE SERVICE: NULL SUBURB - RETURNING NULL');
    return null;
  }
  
  // Clean the suburb name (remove state, trim, lowercase for comparison)
  const cleanSuburb = suburb.toString().trim().toLowerCase()
    .replace(/\s+nsw.*$/i, '')
    .replace(/\s+\d{4}$/, ''); // Remove postcode if present
  
  console.log('🔥🔥🔥 ZONE SERVICE: Cleaned suburb:', cleanSuburb);
  console.log('🔥🔥🔥 ZONE SERVICE: sydneyZones object exists?', !!sydneyZones);
  console.log('🔥🔥🔥 ZONE SERVICE: Zone keys:', Object.keys(sydneyZones));
  
  // Check each zone for the suburb
  for (const [zoneKey, zoneData] of Object.entries(sydneyZones)) {
    console.log(`🔥🔥🔥 CHECKING ZONE: ${zoneKey}`);
    
    // Skip if no suburbs array
    if (!zoneData.suburbs || !Array.isArray(zoneData.suburbs)) {
      console.log('🔥🔥🔥 WARNING: No suburbs array for zone:', zoneKey);
      continue;
    }
    
    console.log(`🔥🔥🔥 Zone ${zoneKey} has ${zoneData.suburbs.length} suburbs`);
    
    // Check if any suburb in the zone matches (case insensitive)
    const found = zoneData.suburbs.some(s => {
      const suburbLower = s.toLowerCase();
      
      // Check exact match first
      if (suburbLower === cleanSuburb) {
        console.log(`🔥🔥🔥 EXACT MATCH! "${s}" === "${cleanSuburb}"`);
        return true;
      }
      
      // Check contains
      if (suburbLower.includes(cleanSuburb) || cleanSuburb.includes(suburbLower)) {
        console.log(`🔥🔥🔥 PARTIAL MATCH! "${s}" contains "${cleanSuburb}"`);
        return true;
      }
      
      return false;
    });
    
    if (found) {
      console.log('🔥 ZONE SERVICE: Found suburb in zone:', zoneData.name);
      return {
        key: zoneKey,
        name: zoneData.name,
        suburb: cleanSuburb
      };
    }
  }
  
  console.log('🔥 ZONE SERVICE: Suburb not found in any zone');
  return null;
}

// Get suburbs for a zone
export function getSuburbsForZone(zoneKey) {
  const zone = sydneyZones[zoneKey];
  return zone ? zone.suburbs : [];
}

