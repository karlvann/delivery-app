import React, { useState, useEffect } from 'react';
import { extractPostcode, getPostcodeZone } from '../services/postcodeService';

function DeliveryDaySelector({ selectedDay, onDayChange, includeTwoPerson, customerAddress }) {
  const [zone, setZone] = useState(null);
  const [recommendedDays, setRecommendedDays] = useState([]);
  const [zoneRecommendations, setZoneRecommendations] = useState({});
  
  // Load zone and recommendations when address changes
  useEffect(() => {
    const loadZoneData = async () => {
      const postcode = customerAddress ? extractPostcode(customerAddress) : null;
      console.log('🔍 DeliveryDaySelector - Full address:', customerAddress);
      console.log('🔍 DeliveryDaySelector - Extracted postcode:', postcode);
      
      if (postcode) {
        // Get zone for the postcode
        const detectedZone = await getPostcodeZone(postcode);
        console.log('🎯 DeliveryDaySelector - Detected zone:', detectedZone);
        setZone(detectedZone);
        
        // Always use localStorage for now since database might not be configured
        const saved = localStorage.getItem('zoneRecommendations');
        const localRecommendations = saved ? JSON.parse(saved) : {
          eastern: [1, 4], // Monday, Thursday
          western: [5], // Friday
          northern: [2, 3], // Tuesday, Wednesday
          southern: [1, 5] // Monday, Friday
        };
        console.log('📅 DeliveryDaySelector - Zone recommendations from localStorage:', localRecommendations);
        setZoneRecommendations(localRecommendations);
        const zoneDays = detectedZone ? (localRecommendations[detectedZone] || []) : [];
        console.log('✅ DeliveryDaySelector - Available days for zone', detectedZone, ':', zoneDays);
        setRecommendedDays(zoneDays);
      } else {
        console.log('❌ DeliveryDaySelector - No postcode found, showing all days');
        setZone(null);
        setRecommendedDays([]);
      }
    };
    
    loadZoneData();
  }, [customerAddress]);
  
  // Get zone display name
  const getZoneDisplayName = () => {
    if (!zone) return '';
    const zoneNames = {
      eastern: 'Eastern suburbs',
      western: 'Western suburbs',
      northern: 'Northern suburbs',
      southern: 'Southern suburbs'
    };
    return zoneNames[zone] || zone;
  };
  
  // Get available days for the next 2-3 weeks
  const getAvailableDays = () => {
    console.log('🔵 getAvailableDays called:');
    console.log('  - Zone:', zone);
    console.log('  - RecommendedDays:', recommendedDays);
    console.log('  - IncludeTwoPerson:', includeTwoPerson);
    
    const days = [];
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let restrictionApplied = false;
    
    // Check next 21 days
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      let isAvailable = false;
      
      // If 2-person delivery is selected, only show Tue/Wed/Thu
      if (includeTwoPerson) {
        isAvailable = [2, 3, 4].includes(dayOfWeek); // Tue, Wed, Thu only for 2-person
        if (i === 0) console.log('🚚 2-person delivery mode - only Tue/Wed/Thu available');
      } 
      // If zone has specific delivery days configured, only show those days
      else if (zone && recommendedDays.length > 0) {
        isAvailable = recommendedDays.includes(dayOfWeek);
        if (!restrictionApplied) {
          console.log(`🎯 Zone "${zone}" restrictions applied - only days [${recommendedDays.join(',')}] available`);
          restrictionApplied = true;
        }
      }
      // If no zone detected or no restrictions, show all days
      else {
        isAvailable = true; // All days available
        if (i === 0) console.log('⚠️ No zone detected or no restrictions - showing ALL days');
      }
      
      if (isAvailable) {
        const dayName = dayNames[dayOfWeek];
        const monthName = monthNames[date.getMonth()];
        const dayNumber = date.getDate();
        
        days.push({
          value: `${dayName}_${date.toISOString().split('T')[0]}`,
          label: `${dayName}, ${monthName} ${dayNumber}`,
          isToday: i === 0,
          isTomorrow: i === 1,
          date: date,
          isRecommended: recommendedDays.includes(dayOfWeek),
          dayOfWeek: dayOfWeek
        });
      }
    }
    
    return days;
  };

  const availableDays = getAvailableDays();

  // Auto-select first available day if none selected
  React.useEffect(() => {
    if (!selectedDay && availableDays.length > 0) {
      onDayChange(availableDays[0].value);
    }
  }, [includeTwoPerson]); // Re-calculate when 2-person option changes

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Select Delivery Day
            {recommendedDays.length > 0 && zone && (
              <span className="ml-2 text-xs font-normal text-blue-600">
                (Available days for {getZoneDisplayName()})
              </span>
            )}
          </h3>
          {availableDays.length > 0 ? (
            <select
              value={selectedDay || ''}
              onChange={(e) => onDayChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              {availableDays.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label} 
                  {day.isToday && ' (Today)'}
                  {day.isTomorrow && ' (Tomorrow)'}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              No delivery days available for your area. Please contact us for special arrangements.
            </div>
          )}
        </div>
        
        {recommendedDays.length > 0 && zone && (
          <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
            📅 <strong>Delivery Schedule:</strong> We deliver to {getZoneDisplayName()} on 
            {recommendedDays.map(d => ' ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]).join(' and')} only. 
            These are the available delivery days for your area.
          </div>
        )}
        
        {includeTwoPerson && (
          <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
            ℹ️ 2-person delivery is only available Tuesday-Thursday
          </div>
        )}
        
        {selectedDay && (
          <div className="text-sm text-gray-600 border-t pt-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Delivery scheduled for <strong>{availableDays.find(d => d.value === selectedDay)?.label}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryDaySelector;