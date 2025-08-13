import { getShepherdsDeliverySchedule, isShepherdsDeliveryAvailable, getNextShepherdsDelivery } from './shepherdsDeliveryService.js';

export const getMelbourneDeliveryRules = () => {
  if (typeof window === 'undefined') {
    return getDefaultRules();
  }
  
  const saved = localStorage.getItem('melbourneDeliveryRules');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse Melbourne delivery rules:', e);
    }
  }
  
  return getDefaultRules();
};

const getDefaultRules = () => ({
  enabled: true,
  zones: {
    inner: { name: 'Inner Melbourne', postcodes: ['3000', '3001', '3002', '3003', '3004', '3005', '3006', '3008'], days: [1, 3, 5] },
    eastern: { name: 'Eastern Suburbs', postcodes: ['3121', '3122', '3123', '3124', '3125', '3126', '3127', '3128'], days: [2, 4] },
    western: { name: 'Western Suburbs', postcodes: ['3011', '3012', '3013', '3014', '3015', '3016', '3018', '3019'], days: [1, 3, 5] },
    northern: { name: 'Northern Suburbs', postcodes: ['3070', '3071', '3072', '3073', '3074', '3075', '3076', '3078'], days: [2, 4] },
    southern: { name: 'Southern Suburbs', postcodes: ['3141', '3142', '3143', '3144', '3145', '3146', '3147', '3148'], days: [1, 3, 5] }
  },
  maxDistance: 110,  // Updated to match Sydney - 110km max
  basePrice: 0,      // Free for first 15km
  pricePerKm: 2,     // $2 per km after 15km (same as Sydney)
  freeKm: 15,        // First 15km free
  flatRate: 190      // $190 flat rate option for Melbourne
});

export const getMelbourneZoneForPostcode = (postcode) => {
  const rules = getMelbourneDeliveryRules();
  
  if (!rules.enabled) {
    return null;
  }
  
  for (const [zoneKey, zone] of Object.entries(rules.zones)) {
    if (zone.postcodes && zone.postcodes.includes(postcode)) {
      return {
        key: zoneKey,
        name: zone.name,
        days: zone.days || []
      };
    }
  }
  
  return null;
};

export const getMelbourneDeliveryDays = (postcode) => {
  const zone = getMelbourneZoneForPostcode(postcode);
  
  if (!zone) {
    // If no zone found, all weekdays are available
    return [1, 2, 3, 4, 5];
  }
  
  return zone.days || [];
};

export const isMelbourneDeliveryAvailable = (postcode, dayOfWeek) => {
  const availableDays = getMelbourneDeliveryDays(postcode);
  return availableDays.includes(dayOfWeek);
};

export const getMelbournePricingRules = () => {
  const rules = getMelbourneDeliveryRules();
  return {
    maxDistance: 110,  // Same as Sydney - 110km max
    basePrice: 0,      // Free for first 15km
    pricePerKm: 2,     // $2 per km after 15km
    freeKm: 15         // First 15km free
  };
};

/**
 * Get delivery information for Melbourne including Shepherds service
 * @param {string} postcode - Melbourne postcode
 * @returns {Object} Delivery information including Shepherds if available
 */
export const getMelbourneDeliveryInfo = (postcode) => {
  // Melbourne uses simple distance-based pricing without zones
  // All postcodes within 110km are eligible
  return {
    type: 'standard',
    provider: 'Melbourne Delivery',
    available: true,
    pricing: getMelbournePricingRules(),
    deliveryDays: [1, 2, 3, 4, 5], // All weekdays available
    message: 'Standard distance-based delivery available',
    zoneName: 'Melbourne Metro',
    zone: 'melbourne-metro'
  };
};