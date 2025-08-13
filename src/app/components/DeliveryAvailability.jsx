'use client';

import React, { useState, useEffect } from 'react';
import { extractPostcode, getTwoPersonDeliveryDays } from '../services/postcodeService';
import { getZoneForPostcode } from '../services/zoneService';
import { getMelbourneZoneForPostcode, getMelbourneDeliveryDays, getMelbourneDeliveryInfo } from '../services/melbourneDeliveryService.js';
import { getShepherdsDeliverySchedule, getNextShepherdsDelivery } from '../services/shepherdsDeliveryService.js';

function DeliveryAvailability({ customerAddress, onDaySelected, requiresTwoPerson, isSydney, isMelbourne }) {
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAlternativeRequest, setShowAlternativeRequest] = useState(false);
  const [alternativeExplanation, setAlternativeExplanation] = useState('');
  const [twoPersonDaysDisplay, setTwoPersonDaysDisplay] = useState('');
  
  useEffect(() => {
    // Set 2-person days display on client side only
    const days = getTwoPersonDeliveryDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setTwoPersonDaysDisplay(days.map(d => dayNames[d]).join(', '));
  }, []);
  
  const checkDeliveryAvailability = async () => {
    setLoading(true);
    
    try {
      // Extract postcode from address
      const postcode = customerAddress ? extractPostcode(customerAddress) : null;
      
      if (!postcode) {
        setAvailabilityInfo({
          available: false,
          message: 'Please enter a valid address first'
        });
        setLoading(false);
        return;
      }
      
      // Get zone for the postcode using new accurate mapping
      let zoneInfo = null;
      let availableDays = [];
      let zoneName = '';
      
      if (isMelbourne) {
        // Melbourne uses Shepherds Transport with specific delivery day
        const melbourneInfo = getMelbourneDeliveryInfo(postcode);
        
        // Get Shepherds delivery day from localStorage
        let shepherdsDeliveryDay = 3; // Default Wednesday
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem('shepherdsSchedule');
          if (saved) {
            try {
              const schedule = JSON.parse(saved);
              shepherdsDeliveryDay = schedule.deliveryDay;
            } catch (e) {
              console.error('Failed to parse Shepherds schedule:', e);
            }
          }
        }
        
        // Set up delivery for Melbourne - only Shepherds delivery day
        zoneInfo = { zone: 'melbourne-metro', name: 'Melbourne Metro' };
        zoneName = 'Melbourne Metro';
        availableDays = [shepherdsDeliveryDay]; // Only the configured Shepherds delivery day
      } else if (isSydney) {
        // Use Sydney zone detection
        zoneInfo = getZoneForPostcode(postcode);
        if (zoneInfo) {
          zoneName = zoneInfo.zone;
          // Sydney zone days are handled below
        }
      } else {
        // Brisbane or other cities - all weekdays available
        zoneInfo = { zone: 'brisbane-metro', name: 'Brisbane Metro' };
        zoneName = 'Brisbane Metro';
        availableDays = [1, 2, 3, 4, 5]; // Monday to Friday
      }
      
      if (!zoneInfo && isSydney) {
        // No zone detected - no delivery available
        setAvailabilityInfo({
          available: false,
          postcode,
          message: `Sorry, postcode ${postcode} is outside our delivery area`
        });
        setLoading(false);
        return;
      }
      
      const zone = zoneInfo.zone || zoneInfo.key;
      
      // For Sydney, get delivery days from localStorage with defaults
      if (isSydney && !availableDays.length) {
        let zoneRecommendations = {};
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem('zoneRecommendations');
          if (saved) {
            zoneRecommendations = JSON.parse(saved);
          } else {
            // Default zone recommendations if not configured
            zoneRecommendations = {
              eastern: [1, 2, 3], // Mon, Tue, Wed
              western: [3, 4, 5], // Wed, Thu, Fri
              northern: [2, 3, 4], // Tue, Wed, Thu
              southern: [1, 3, 5], // Mon, Wed, Fri
              innerwest: [2, 3, 4] // Tue, Wed, Thu
            };
            // Save defaults to localStorage
            localStorage.setItem('zoneRecommendations', JSON.stringify(zoneRecommendations));
          }
        }
        availableDays = zoneRecommendations[zone] || [];
      }
      
      if (availableDays.length === 0) {
        // Zone exists but no days configured
        setAvailabilityInfo({
          available: false,
          zone,
          zoneName: zoneName || zoneInfo.name || zone,
          postcode,
          message: `Sorry, no delivery days are currently scheduled for ${zoneName || zoneInfo.name || zone}`
        });
      } else {
        // Days are available!
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let availableDayNames = availableDays.map(d => dayNames[d]);
        
        // If 2-person delivery is selected by the user, filter to configured days
        if (requiresTwoPerson) {
          const twoPersonDayNumbers = getTwoPersonDeliveryDays();
          const twoPersonDayNames = twoPersonDayNumbers.map(d => dayNames[d]);
          availableDayNames = availableDayNames.filter(day => twoPersonDayNames.includes(day));
          
          // Check if it's Sydney or Melbourne (2-person only available in Sydney and Melbourne)
          if (!isSydney && !isMelbourne) {
            setAvailabilityInfo({
              available: false,
              zone,
              zoneName: zoneInfo.name,
              postcode,
              message: `Sorry, 2-person delivery is only available in Sydney and Melbourne`
            });
            setLoading(false);
            return;
          }
          
          if (availableDayNames.length === 0) {
            setAvailabilityInfo({
              available: false,
              zone,
              zoneName: zoneInfo.name,
              postcode,
              message: `Sorry, 2-person delivery is only available on ${twoPersonDayNames.join(', ')}. ${zoneInfo.name} doesn't have delivery on those days.`,
              showCallBackOption: true
            });
            setLoading(false);
            return;
          }
        }
        
        setAvailabilityInfo({
          available: true,
          zone,
          zoneName: zoneInfo.name,
          postcode,
          days: availableDayNames,
          message: requiresTwoPerson 
            ? `2-person delivery available to ${zoneInfo.name}`
            : `Delivery available to ${zoneInfo.name}`,
          is2Person: requiresTwoPerson
        });
        
        // If only one day available, auto-select it
        if (availableDayNames.length === 1) {
          setSelectedDay(availableDayNames[0]);
          if (onDaySelected) {
            onDaySelected(availableDayNames[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error checking delivery availability:', error);
      setAvailabilityInfo({
        available: false,
        message: 'Error checking delivery availability. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDaySelection = (day) => {
    setSelectedDay(day);
    setShowAlternativeRequest(false);
    setAlternativeExplanation('');
    if (onDaySelected) {
      onDaySelected(day);
    }
  };
  
  const handleAlternativeRequest = () => {
    setSelectedDay(null);
    setShowAlternativeRequest(true);
    if (onDaySelected) {
      onDaySelected(null);
    }
  };
  
  const submitAlternativeRequest = () => {
    // Here you would normally send this to a server
    console.log('Alternative delivery request:', {
      address: customerAddress,
      availableDays: availabilityInfo?.days,
      explanation: alternativeExplanation,
      postcode: availabilityInfo?.postcode,
      zone: availabilityInfo?.zoneName
    });
    
    // Show confirmation
    alert('Thank you! We\'ll contact you within 24 hours to arrange alternative delivery options.');
    
    // You could also send this via email API
    // await fetch('/api/alternative-delivery', { ... })
  };
  
  
  const resetAvailability = () => {
    setAvailabilityInfo(null);
    setSelectedDay(null);
    setShowAlternativeRequest(false);
    setAlternativeExplanation('');
  };
  
  // Auto-check availability when address changes
  React.useEffect(() => {
    if (customerAddress) {
      checkDeliveryAvailability();
    } else {
      resetAvailability();
    }
  }, [customerAddress, requiresTwoPerson]);
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">Select Your Delivery Day</h3>
          {requiresTwoPerson && (
            <p className="text-xs text-purple-600 mt-1">
              {requiresTwoPerson && twoPersonDaysDisplay && `Filtering for 2-person delivery (${twoPersonDaysDisplay} only in Sydney)`}
            </p>
          )}
        </div>
        
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Checking available days...</p>
          </div>
        )}
        
        {availabilityInfo && !loading && (
          <div className={`p-4 rounded-lg ${
            availabilityInfo.available 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {availabilityInfo.available ? (
              <div>
                {/* Special display for Shepherds delivery */}
                {availabilityInfo.isShepherds ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-green-800">Shepherds Transport Available!</span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="bg-white p-3 rounded border border-green-300">
                        <p className="text-sm font-medium text-gray-700 mb-2">Weekly Service Schedule:</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start space-x-2">
                            <span className="text-green-600">📦</span>
                            <div>
                              <span className="font-medium">Pickup:</span> {availabilityInfo.nextDelivery.pickup.dayName}
                              <span className="text-gray-600 block text-xs">{availabilityInfo.nextDelivery.pickup.dateString}</span>
                              <span className="text-gray-500 block text-xs">From: {availabilityInfo.nextDelivery.pickup.location}</span>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-green-600">🚚</span>
                            <div>
                              <span className="font-medium">Delivery:</span> {availabilityInfo.nextDelivery.delivery.dayName}
                              <span className="text-gray-600 block text-xs">{availabilityInfo.nextDelivery.delivery.dateString}</span>
                              <span className="text-gray-500 block text-xs">To: Your Melbourne address</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {!availabilityInfo.nextDelivery.cutoffTime.hasPassedCutoff && (
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-300">
                          <p className="text-xs text-yellow-800">
                            ⏰ {availabilityInfo.nextDelivery.cutoffTime.message}
                          </p>
                        </div>
                      )}
                      
                      {availabilityInfo.nextDelivery.isFlexible && (
                        <div className="bg-blue-50 p-2 rounded border border-blue-300">
                          <p className="text-xs text-blue-800">
                            ℹ️ {availabilityInfo.nextDelivery.flexibilityNote}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const deliveryDate = `${availabilityInfo.nextDelivery.delivery.dayName} (${availabilityInfo.nextDelivery.delivery.dateString})`;
                            handleDaySelection(deliveryDate);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedDay
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                          }`}
                        >
                          Accept This Delivery Schedule
                        </button>
                        
                        <button
                          onClick={handleAlternativeRequest}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            showAlternativeRequest
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50'
                          }`}
                        >
                          Request Different Schedule
                        </button>
                      </div>
                    </div>
                    
                    {selectedDay && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-green-700 text-sm font-medium">
                          ✓ Confirmed: {selectedDay}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-green-800">Delivery Available!</span>
                </div>
                <p className="text-green-700 text-sm mb-3">
                  {availabilityInfo.message}
                </p>
                
                {/* Show day selector - even for single day to allow alternative request */}
                {availabilityInfo.days && availabilityInfo.days.length >= 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-800">
                      {availabilityInfo.is2Person 
                        ? 'We can provide 2-person delivery to this area on these days:'
                        : 'We deliver to this area on these days:'}
                    </label>
                    <div className={availabilityInfo.days.length === 1 ? "space-y-2" : "grid grid-cols-2 gap-2"}>
                      {availabilityInfo.days.map((day) => (
                        <button
                          key={day}
                          onClick={() => handleDaySelection(day)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedDay === day
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                      
                      {/* "These days don't work" option */}
                      <button
                        onClick={handleAlternativeRequest}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          availabilityInfo.days.length > 1 ? 'col-span-2' : 'w-full'
                        } ${
                          showAlternativeRequest
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        These days don&apos;t work for me
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Show alternative request form */}
                {showAlternativeRequest && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <label className="text-sm font-medium text-orange-800 block mb-2">
                      Really need it on a different day? Tell us here and we&apos;ll do our best:
                    </label>
                    <textarea
                      value={alternativeExplanation}
                      onChange={(e) => setAlternativeExplanation(e.target.value)}
                      placeholder="E.g., I need delivery on a weekend, or after 5pm on weekdays..."
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={3}
                    />
                    <button
                      onClick={submitAlternativeRequest}
                      disabled={!alternativeExplanation.trim()}
                      className={`mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        alternativeExplanation.trim()
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Submit Request
                    </button>
                  </div>
                )}
                
                {/* Show selected day */}
                {selectedDay && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-green-700 text-sm font-medium">
                      ✓ Selected delivery day: {selectedDay}
                    </p>
                  </div>
                )}
                
                {availabilityInfo.zoneName && (
                  <p className="text-green-600 text-xs mt-2">
                    Zone: {availabilityInfo.zoneName} ({availabilityInfo.postcode})
                  </p>
                )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-red-800">No Delivery Available</span>
                </div>
                <p className="text-red-700 text-sm">
                  {availabilityInfo.message}
                </p>
                
                {/* Show call back option when no days available due to 2-person constraints */}
                {availabilityInfo.showCallBackOption && (
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() => {
                        setSelectedDay('Will call back');
                        if (onDaySelected) {
                          onDaySelected('Will call back');
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        selectedDay === 'Will call back'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      Order anyway - I&apos;ll call to arrange delivery
                    </button>
                    
                    <button
                      onClick={handleAlternativeRequest}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        showAlternativeRequest
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      Request a specific day/time
                    </button>
                    
                    {/* Show alternative request form */}
                    {showAlternativeRequest && (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <label className="text-sm font-medium text-orange-800 block mb-2">
                          Tell us when you need delivery:
                        </label>
                        <textarea
                          value={alternativeExplanation}
                          onChange={(e) => setAlternativeExplanation(e.target.value)}
                          placeholder="E.g., I need Tuesday delivery, or after 5pm on weekdays..."
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                          rows={3}
                        />
                        <button
                          onClick={submitAlternativeRequest}
                          disabled={!alternativeExplanation.trim()}
                          className={`mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            alternativeExplanation.trim()
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Submit Request
                        </button>
                      </div>
                    )}
                    
                    {/* Show selected option */}
                    {selectedDay === 'Will call back' && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-blue-700 text-sm font-medium">
                          ✓ You will call to arrange delivery after ordering
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {availabilityInfo.postcode && !availabilityInfo.showCallBackOption && (
                  <p className="text-red-600 text-xs mt-2">
                    Please contact us at sales@ausbeds.com.au for alternative arrangements.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryAvailability;