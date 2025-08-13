/**
 * Shepherds Delivery Service for Melbourne
 * Handles weekly pickup/delivery cycles and scheduling
 */

/**
 * Get the next Shepherds delivery dates based on current date
 * @returns {Object} Next pickup and delivery dates
 */
export const getNextShepherdsDelivery = () => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  
  // Load schedule from localStorage or use defaults
  let schedule = { pickupDay: 2, deliveryDay: 3 }; // Default: Tuesday pickup, Wednesday delivery
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('shepherdsSchedule');
    if (saved) {
      try {
        schedule = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse Shepherds schedule:', e);
      }
    }
  }
  
  const defaultPickupDay = schedule.pickupDay;
  const defaultDeliveryDay = schedule.deliveryDay;
  
  // Calculate next pickup date
  let nextPickup = new Date(now);
  let daysUntilPickup = (defaultPickupDay - currentDay + 7) % 7;
  
  // If it's already past Tuesday, or it's Tuesday after business hours, go to next week
  if (daysUntilPickup === 0 && currentHour >= 17) {
    daysUntilPickup = 7;
  } else if (daysUntilPickup === 0) {
    daysUntilPickup = 0; // It's Tuesday during business hours
  }
  
  // If we've already passed this week's pickup, go to next week
  if (currentDay > defaultPickupDay || (currentDay === defaultPickupDay && currentHour >= 17)) {
    daysUntilPickup = (defaultPickupDay - currentDay + 7) % 7;
    if (daysUntilPickup === 0) daysUntilPickup = 7;
  }
  
  nextPickup.setDate(nextPickup.getDate() + daysUntilPickup);
  nextPickup.setHours(10, 0, 0, 0); // Set to 10 AM
  
  // Calculate delivery date based on configured schedule
  let nextDelivery = new Date(nextPickup);
  const daysDiff = (defaultDeliveryDay - defaultPickupDay + 7) % 7 || 7;
  nextDelivery.setDate(nextDelivery.getDate() + daysDiff);
  
  return {
    pickup: {
      date: nextPickup,
      dayName: getDayName(nextPickup.getDay()),
      dateString: formatDate(nextPickup),
      location: 'Ausbeds Marrickville'
    },
    delivery: {
      date: nextDelivery,
      dayName: getDayName(nextDelivery.getDay()),
      dateString: formatDate(nextDelivery),
      location: 'Customer address in Melbourne'
    },
    cutoffTime: getCutoffTime(nextPickup),
    isFlexible: true,
    flexibilityNote: 'Dates may vary by 1-2 days depending on load and route optimization'
  };
};

/**
 * Check if Shepherds delivery is available for a specific Melbourne postcode
 * @param {string} postcode - Melbourne postcode
 * @returns {boolean} Whether Shepherds delivers to this postcode
 */
export const isShepherdsDeliveryAvailable = (postcode) => {
  // Shepherds covers most Melbourne metro areas
  // You can expand this list based on actual coverage
  const coveredPostcodes = [
    // Inner Melbourne
    '3000', '3001', '3002', '3003', '3004', '3005', '3006', '3008',
    // Eastern Suburbs
    '3121', '3122', '3123', '3124', '3125', '3126', '3127', '3128',
    '3129', '3130', '3131', '3132', '3133', '3134', '3135', '3136',
    // Western Suburbs
    '3011', '3012', '3013', '3014', '3015', '3016', '3018', '3019',
    '3020', '3021', '3022', '3023', '3024', '3025', '3026', '3027',
    // Northern Suburbs
    '3070', '3071', '3072', '3073', '3074', '3075', '3076', '3078',
    '3079', '3081', '3082', '3083', '3084', '3085', '3086', '3087',
    // Southern Suburbs
    '3141', '3142', '3143', '3144', '3145', '3146', '3147', '3148',
    '3149', '3150', '3151', '3152', '3153', '3154', '3155', '3156',
    // South Eastern
    '3161', '3162', '3163', '3165', '3166', '3167', '3168', '3169',
    '3170', '3171', '3172', '3173', '3174', '3175', '3176', '3177'
  ];
  
  return coveredPostcodes.includes(postcode);
};

/**
 * Get Shepherds delivery schedule for display
 * @param {string} postcode - Melbourne postcode
 * @returns {Object} Delivery schedule information
 */
export const getShepherdsDeliverySchedule = (postcode) => {
  if (!isShepherdsDeliveryAvailable(postcode)) {
    return {
      available: false,
      message: 'Shepherds delivery not available to this postcode'
    };
  }
  
  const nextDelivery = getNextShepherdsDelivery();
  
  // Get configured days
  let schedule = { pickupDay: 2, deliveryDay: 3 };
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('shepherdsSchedule');
    if (saved) {
      try {
        schedule = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse Shepherds schedule:', e);
      }
    }
  }
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    available: true,
    provider: 'Shepherds Transport',
    schedule: {
      regular: {
        pickup: dayNames[schedule.pickupDay],
        delivery: dayNames[schedule.deliveryDay],
        frequency: 'Weekly'
      },
      next: nextDelivery,
      alternativeOptions: [
        {
          pickup: 'Monday',
          delivery: 'Wednesday',
          note: 'Available occasionally based on route'
        },
        {
          pickup: 'Wednesday',
          delivery: 'Friday',
          note: 'Available occasionally based on load'
        }
      ]
    },
    pricing: {
      base: 190,
      type: 'Fixed rate Melbourne delivery',
      includes: 'Pickup from Marrickville, delivery to Melbourne address'
    },
    notes: [
      'Pickup from Ausbeds Marrickville warehouse',
      'Delivery direct to customer in Melbourne',
      'Schedule may vary by 1-2 days - we\'ll confirm exact dates',
      'Bulk orders may qualify for priority scheduling'
    ]
  };
};

/**
 * Calculate cutoff time for orders to make next Shepherds run
 * @param {Date} pickupDate - The pickup date
 * @returns {Object} Cutoff time information
 */
const getCutoffTime = (pickupDate) => {
  const cutoff = new Date(pickupDate);
  cutoff.setDate(cutoff.getDate() - 1); // Day before pickup
  cutoff.setHours(17, 0, 0, 0); // 5 PM the day before
  
  const now = new Date();
  const hoursRemaining = Math.max(0, (cutoff - now) / (1000 * 60 * 60));
  
  return {
    date: cutoff,
    dateString: formatDate(cutoff),
    timeString: '5:00 PM',
    hasPassedCutoff: now > cutoff,
    hoursRemaining: Math.floor(hoursRemaining),
    message: now > cutoff 
      ? 'Order will be scheduled for next week\'s delivery'
      : `Order within ${Math.floor(hoursRemaining)} hours for this week's delivery`
  };
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-AU', options);
};

/**
 * Get day name from day number
 * @param {number} dayNumber - Day number (0-6)
 * @returns {string} Day name
 */
const getDayName = (dayNumber) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
};

/**
 * Check if date falls within Shepherds operating days
 * @param {Date} date - Date to check
 * @returns {boolean} Whether Shepherds operates on this date
 */
export const isShepherdsOperatingDay = (date) => {
  const day = date.getDay();
  // Shepherds typically operates Monday-Friday
  return day >= 1 && day <= 5;
};

/**
 * Get estimated delivery time based on current schedule
 * @param {string} postcode - Melbourne postcode
 * @returns {Object} Estimated delivery information
 */
export const getEstimatedDeliveryTime = (postcode) => {
  if (!isShepherdsDeliveryAvailable(postcode)) {
    return {
      available: false,
      message: 'Delivery not available to this area'
    };
  }
  
  const schedule = getNextShepherdsDelivery();
  const now = new Date();
  const deliveryDate = schedule.delivery.date;
  const daysUntilDelivery = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24));
  
  return {
    available: true,
    estimatedDate: deliveryDate,
    estimatedDateString: formatDate(deliveryDate),
    businessDays: countBusinessDays(now, deliveryDate),
    calendarDays: daysUntilDelivery,
    message: `Estimated delivery: ${schedule.delivery.dayName}, ${schedule.delivery.dateString}`
  };
};

/**
 * Count business days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of business days
 */
const countBusinessDays = (startDate, endDate) => {
  let count = 0;
  let current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday or Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Save Shepherds settings to localStorage
 * @param {Object} settings - Settings to save
 */
export const saveShepherdsSettings = (settings) => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('shepherdsDeliverySettings', JSON.stringify(settings));
  }
};

/**
 * Load Shepherds settings from localStorage
 * @returns {Object} Saved settings or defaults
 */
export const loadShepherdsSettings = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return getDefaultShepherdsSettings();
  }
  
  const saved = localStorage.getItem('shepherdsDeliverySettings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse Shepherds settings:', e);
    }
  }
  
  return getDefaultShepherdsSettings();
};

/**
 * Get default Shepherds settings
 * @returns {Object} Default settings
 */
const getDefaultShepherdsSettings = () => ({
  enabled: true,
  defaultPickupDay: 2, // Tuesday
  defaultDeliveryDay: 3, // Wednesday
  pickupLocation: 'Ausbeds Marrickville',
  cutoffHours: 24, // 24 hours before pickup
  flexibilityDays: 2, // Can vary by up to 2 days
  pricing: {
    base: 190,
    currency: 'AUD'
  }
});