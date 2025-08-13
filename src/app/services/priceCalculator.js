import { getMelbournePricingRules } from './melbourneDeliveryService.js';

// Pricing configuration for ausbeds delivery
export const PRICING = {
  // Local delivery (Sydney, Brisbane, Melbourne)
  local: {
    freeKmLimit: 15,    // First 15km free
    pricePerKm: 2,      // $2 per km for total distance (after 15km)
    maxDistance: 110    // Maximum 110km
  },
  
  // Corridor delivery (fixed rates)
  corridor: {
    fixedRate: 190      // $190 for Sydney-Brisbane or Sydney-Melbourne corridors
  },
  
  // 2-Person delivery (Sydney and Melbourne)
  twoPerson: {
    baseFee: 50,        // Base fee for first 15km
    pricePerKm: 2.5,    // $2.50 per km beyond 15km
    maxDistance: 110,   // Maximum 110km (same as regular delivery)
    availableCities: ['sydney', 'melbourne']  // Available in Sydney and Melbourne
  }
};

/**
 * Calculate local delivery fee (Sydney, Brisbane, or Melbourne)
 * @param {number} distanceInKm - Distance from city origin to delivery address
 * @param {string} city - The city for delivery (sydney, brisbane, melbourne)
 * @returns {Object} Local delivery fee breakdown
 */
export function calculateLocalDeliveryFee(distanceInKm, city = null) {
  // Use Melbourne-specific rules if applicable
  if (city === 'melbourne') {
    const melbourneRules = getMelbournePricingRules();
    
    // Validate distance (110km max, same as Sydney)
    if (distanceInKm > melbourneRules.maxDistance) {
      throw new Error(`Delivery not available beyond ${melbourneRules.maxDistance}km. Please email sales@ausbeds.com.au for a custom quote.`);
    }
    
    // First 15km are free (same as Sydney)
    if (distanceInKm <= melbourneRules.freeKm) {
      return {
        distanceInKm: Math.round(distanceInKm * 10) / 10,
        deliveryFee: 0,
        isFreeDelivery: true,
        deliveryType: 'Free Local Delivery',
        city: 'melbourne'
      };
    }
    
    // After 15km, charge $2/km for total distance (same as Sydney)
    const deliveryFee = distanceInKm * melbourneRules.pricePerKm;
    
    return {
      distanceInKm: Math.round(distanceInKm * 10) / 10,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      isFreeDelivery: false,
      deliveryType: 'Local Delivery',
      city: 'melbourne'
    };
  }
  
  // Use standard rules for Sydney and Brisbane
  // Validate distance
  if (distanceInKm > PRICING.local.maxDistance) {
    throw new Error(`Delivery not available beyond ${PRICING.local.maxDistance}km. Please email sales@ausbeds.com.au for a custom quote.`);
  }
  
  // First 15km are free
  if (distanceInKm <= PRICING.local.freeKmLimit) {
    return {
      distanceInKm: Math.round(distanceInKm * 10) / 10,
      deliveryFee: 0,
      isFreeDelivery: true,
      deliveryType: 'Free Local Delivery'
    };
  }
  
  // After 15km, charge $2/km for total distance
  const deliveryFee = distanceInKm * PRICING.local.pricePerKm;
  
  return {
    distanceInKm: Math.round(distanceInKm * 10) / 10,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    isFreeDelivery: false,
    deliveryType: 'Local Delivery'
  };
}

/**
 * Calculate corridor delivery fee (fixed rate)
 * @param {string} corridor - 'brisbane' or 'melbourne'
 * @returns {Object} Corridor delivery fee breakdown
 */
export function calculateCorridorDeliveryFee(corridor) {
  return {
    distanceInKm: null, // Not applicable for corridor
    deliveryFee: PRICING.corridor.fixedRate,
    isFreeDelivery: false,
    deliveryType: corridor === 'brisbane' ? 'Sydney-Brisbane Corridor' : 'Sydney-Melbourne Corridor',
    isCorridorDelivery: true,
    corridor
  };
}

/**
 * Calculate 2-person delivery fee (Sydney and Melbourne)
 * @param {number} distanceInKm - Distance from warehouse
 * @returns {Object} 2-person delivery fee breakdown
 */
export function calculate2PersonDeliveryFee(distanceInKm) {
  // Validate distance
  if (distanceInKm > PRICING.twoPerson.maxDistance) {
    throw new Error(`2-Person delivery not available beyond ${PRICING.twoPerson.maxDistance}km.`);
  }
  
  let twoPersonFee = PRICING.twoPerson.baseFee;
  
  // Add extra cost for distance beyond 15km
  if (distanceInKm > 15) {
    const extraDistance = distanceInKm - 15;
    twoPersonFee += extraDistance * PRICING.twoPerson.pricePerKm;
  }
  
  return {
    twoPersonFee: Math.round(twoPersonFee * 100) / 100,
    twoPersonAvailable: true
  };
}

/**
 * Calculate delivery fee based on type (local or corridor)
 * @param {Object} options - Delivery options
 * @param {number} options.distanceInKm - Distance for local delivery
 * @param {string} options.corridor - Corridor type ('brisbane' or 'melbourne')
 * @param {string} options.city - City for local delivery ('sydney', 'brisbane', 'melbourne')
 * @param {boolean} options.includeTwoPerson - Include 2-person delivery service
 * @returns {Object} Complete fee breakdown
 */
export function calculateDeliveryFee({ distanceInKm, corridor, city, includeTwoPerson = false }) {
  // Corridor delivery takes priority
  if (corridor) {
    const result = calculateCorridorDeliveryFee(corridor);
    // 2-person not available for corridor deliveries
    result.twoPersonAvailable = false;
    return result;
  }
  
  // Local delivery
  if (distanceInKm !== null && distanceInKm !== undefined) {
    const result = calculateLocalDeliveryFee(distanceInKm, city);
    result.city = city || 'sydney';
    
    // Add 2-person delivery if requested and available in Sydney or Melbourne
    const normalizedCity = city ? city.toLowerCase() : '';
    console.log('Checking 2-person: includeTwoPerson=', includeTwoPerson, 'city=', normalizedCity);
    if (includeTwoPerson && (normalizedCity === 'sydney' || normalizedCity === 'melbourne')) {
      const twoPersonInfo = calculate2PersonDeliveryFee(distanceInKm);
      console.log('2-person info calculated:', twoPersonInfo);
      result.twoPersonFee = twoPersonInfo.twoPersonFee;
      result.twoPersonAvailable = true;
      result.totalWithTwoPerson = result.deliveryFee + twoPersonInfo.twoPersonFee;
    } else {
      result.twoPersonAvailable = (normalizedCity === 'sydney' || normalizedCity === 'melbourne');
    }
    
    return result;
  }
  
  throw new Error('Invalid delivery calculation parameters');
}

/**
 * Format currency for display
 * @param {number} amount - Amount in dollars
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Get delivery time estimate
 * @param {Object} deliveryInfo - Delivery information
 * @returns {string} Delivery time estimate
 */
export function getDeliveryTimeEstimate(deliveryInfo) {
  if (deliveryInfo.isCorridorDelivery) {
    return 'Multiple day delivery';
  }
  
  if (deliveryInfo.distanceInKm <= 30) {
    return 'Same day delivery available';
  } else if (deliveryInfo.distanceInKm <= 60) {
    return 'Next day delivery';
  } else {
    return '2-3 business days';
  }
}

// Temporary functions for 2-person delivery (to be implemented later)
export function is2PersonAvailableToday() {
  const today = new Date().getDay();
  return [2, 3, 4].includes(today); // Tuesday, Wednesday, Thursday
}

export function getNext2PersonDay() {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();
  
  // Find next available day (Tue, Wed, or Thu)
  for (let i = 1; i <= 7; i++) {
    const nextDay = (today + i) % 7;
    if ([2, 3, 4].includes(nextDay)) {
      return dayNames[nextDay];
    }
  }
  
  return 'Tuesday'; // Fallback
}
