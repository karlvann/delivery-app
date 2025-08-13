'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { calculateDeliveryFee as calculateFee } from './priceCalculator';
import { calculateDistanceFromCity, detectCity, loadGoogleMaps, CITY_ORIGINS } from './googleMapsService';
import { extractPostcode, isCorridorPostcode } from './postcodeService';
import { getZoneForPostcode, getZoneForSuburb } from './zoneService';
// import { getRecommendedDays } from './shepherdsDeliveryService';
// import { calculateMelbourneDelivery } from './melbourneDeliveryService';
import { MapPin, Truck, Calendar, Users, Package, DollarSign, AlertCircle, ChevronRight, Home, Navigation, Settings } from 'lucide-react';
import Link from 'next/link';

export default function SinglePageDeliveryForm() {
  // Core state
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [detectedCity, setDetectedCity] = useState(null);
  const [postcode, setPostcode] = useState('');
  const [suburb, setSuburb] = useState('');
  const [zone, setZone] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Delivery options
  const [stairs, setStairs] = useState('');
  const [strength, setStrength] = useState('');
  const [isTwoPerson, setIsTwoPerson] = useState(null); // null = not selected, true/false = selected
  const [selectedDay, setSelectedDay] = useState('');
  const [availableDays, setAvailableDays] = useState([]);
  
  // Pricing
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [deliveryType, setDeliveryType] = useState(null);
  const [corridorType, setCorridorType] = useState(null);
  
  // Autocomplete
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);

  // Initialize Google Maps and autocomplete
  useEffect(() => {
    loadGoogleMaps().then(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.AutocompleteService();
        setAutocompleteService(service);
      }
    }).catch(err => {
      console.error('Failed to load Google Maps:', err);
    });
  }, []);

  // Calculate pricing whenever relevant state changes
  useEffect(() => {
    if (distance !== null && detectedCity && postcode) {
      calculateDeliveryFee();
    }
  }, [distance, detectedCity, postcode, isTwoPerson]);

  // Update available days when zone or two-person changes
  useEffect(() => {
    if (detectedCity && zone) {
      updateAvailableDays();
    }
  }, [detectedCity, zone, isTwoPerson]);

  // Calculate two-person recommendation based on stairs and strength
  const getRecommendation = () => {
    const hasSignificantStairs = stairs === 'flight' || stairs === 'multiple';
    const needsHelp = strength !== null && parseInt(strength) <= 2; // 0, 1, or 2 = needs help
    return hasSignificantStairs && needsHelp;
  };
  
  const isRecommended = getRecommendation();

  const handleAddressInput = async (e) => {
    const value = e.target.value;
    setAddress(value);
    setAddressError('');
    
    // Clear suburb and zone if address is cleared
    if (!value || value.length === 0) {
      setSuburb('');
      setZone(null);
      setPostcode('');
      setDistance(null);
      setDuration(null);
    }

    if (value.length > 2 && autocompleteService) {
      const request = {
        input: value,
        componentRestrictions: { country: 'au' },
        types: ['geocode', 'establishment']
      };

      autocompleteService.getPlacePredictions(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      });
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePredictionSelect = async (prediction) => {
    setAddress(prediction.description);
    setPredictions([]);
    setShowPredictions(false);
    setIsLoading(true);

    try {
      // Create a temporary div for PlacesService
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      const placesService = new window.google.maps.places.PlacesService(map);
      
      placesService.getDetails(
        { 
          placeId: prediction.place_id,
          fields: ['formatted_address', 'geometry', 'address_components', 'name']
        },
        async (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            console.log('🔥 GOOGLE PLACE DATA:', place);
            console.log('🔥 ADDRESS COMPONENTS:', place.address_components);
            await processAddress(place);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error processing address:', error);
      setAddressError('Error processing address. Please try again.');
      setIsLoading(false);
    }
  };

  const processAddress = async (place) => {
    try {
      // USE GOOGLE'S STRUCTURED ADDRESS COMPONENTS
      let extractedPostcode = '';
      let extractedSuburb = '';
      let extractedState = '';
      
      if (place.address_components) {
        console.log('🔥🔥🔥 GOOGLE ADDRESS COMPONENTS:', place.address_components);
        
        // Extract each component properly
        place.address_components.forEach((component, index) => {
          const types = component.types;
          console.log(`🔥🔥🔥 Component ${index}:`, component.long_name, 'Types:', types);
          
          // Get postcode
          if (types.includes('postal_code')) {
            extractedPostcode = component.long_name;
            console.log('🔥🔥🔥 POSTCODE FOUND:', extractedPostcode);
          }
          
          // Get suburb (locality or sublocality)
          if (types.includes('locality')) {
            extractedSuburb = component.long_name;
            console.log('🔥🔥🔥 LOCALITY (SUBURB) FOUND:', extractedSuburb);
          } else if (types.includes('sublocality_level_1') && !extractedSuburb) {
            extractedSuburb = component.long_name;
            console.log('🔥🔥🔥 SUBLOCALITY_1 (SUBURB) FOUND:', extractedSuburb);
          } else if (types.includes('sublocality') && !extractedSuburb) {
            extractedSuburb = component.long_name;
            console.log('🔥🔥🔥 SUBLOCALITY (SUBURB) FOUND:', extractedSuburb);
          }
          
          // Get state
          if (types.includes('administrative_area_level_1')) {
            extractedState = component.short_name;
            console.log('🔥 GOOGLE: Found state:', extractedState);
          }
        });
      }
      
      // Fallback to old method if components not available
      if (!extractedPostcode) {
        extractedPostcode = extractPostcode(place.formatted_address || place.name);
      }
      
      if (!extractedPostcode) {
        setAddressError('Please include a postcode in your address');
        return;
      }
      
      console.log('🔥 FINAL EXTRACTED DATA:');
      console.log('  Suburb:', extractedSuburb);
      console.log('  Postcode:', extractedPostcode);
      console.log('  State:', extractedState);
      
      setPostcode(extractedPostcode);
      setSuburb(extractedSuburb);

      // Detect city and calculate distance
      const detectedCityName = detectCity(place.formatted_address || place.name);
      setDetectedCity(detectedCityName);
      
      if (detectedCityName) {
        const distanceData = await calculateDistanceFromCity(detectedCityName, place.formatted_address || place.name);
        if (distanceData) {
          setDistance(distanceData.distance);
          setDuration(distanceData.duration);

          // Detect zone for Sydney - try suburb first, then postcode
          if (detectedCityName === 'Sydney') {
            let zoneData = null;
            
            // First try to find zone by suburb (using clean Google data)
            if (extractedSuburb) {
              console.log('🔥 ZONE DETECTION: Checking zone for Google suburb:', extractedSuburb);
              zoneData = getZoneForSuburb(extractedSuburb);
              console.log('🔥 ZONE DETECTION: Result from suburb lookup:', zoneData);
            }
            
            // If no zone found by suburb, try postcode
            if (!zoneData && extractedPostcode) {
              console.log('🔥 ZONE DETECTION: No zone found by suburb, trying postcode:', extractedPostcode);
              zoneData = getZoneForPostcode(extractedPostcode);
              console.log('🔥 ZONE DETECTION: Result from postcode lookup:', zoneData);
            }
            
            // Set the zone and update available delivery days
            if (zoneData) {
              console.log('🔥 ZONE DETECTION: SUCCESS! Setting zone to:', zoneData.name);
              setZone(zoneData.name);
              
              // Immediately update available days based on zone
              const zoneKey = zoneData.key || zoneData.name.toLowerCase();
              const dayMap = {
                'eastern': ['Tuesday', 'Thursday'],
                'western': ['Monday', 'Wednesday', 'Friday'],
                'northern': ['Monday', 'Wednesday', 'Friday'],
                'southern': ['Tuesday', 'Thursday'],
                'innerwest': ['Monday', 'Wednesday', 'Friday']
              };
              
              const availableDays = dayMap[zoneKey] || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
              console.log('🔥 ZONE DETECTION: Setting available days for', zoneKey, ':', availableDays);
              setAvailableDays(availableDays);
            } else {
              console.log('🔥 ZONE DETECTION: WARNING - No zone found for suburb or postcode');
              setZone(null);
              setAvailableDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing address:', error);
      setAddressError('Error calculating delivery. Please try again.');
    }
  };

  const calculateDeliveryFee = async () => {
    try {
      const corridorCheck = await isCorridorPostcode(postcode, detectedCity);
      let fee = 0;
      let type = null;
      let corridor = null;

      if (corridorCheck && corridorCheck.isCorridor) {
        fee = 190;
        type = 'corridor';
        corridor = corridorCheck.corridorType;
      } else if (detectedCity === 'Melbourne' && zone) {
        // const melbResult = await calculateMelbourneDelivery(postcode, zone, distance);
        // fee = melbResult.price;
        // type = melbResult.type;
        fee = 0; // Temporarily disabled
      } else if (distance !== null && distance !== undefined) {
        const result = calculateFee({
          distanceInKm: distance,
          city: detectedCity,
          includeTwoPerson: isTwoPerson
        });
        fee = result.deliveryFee;
        type = result.deliveryType;
      } else {
        // No distance calculated yet, can't determine fee
        console.warn('Cannot calculate delivery fee: distance is null');
        return;
      }

      setDeliveryFee(fee);
      setDeliveryType(type);
      setCorridorType(corridor);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const updateAvailableDays = async () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    console.log('🔥 UPDATING DAYS: City:', detectedCity, 'Zone:', zone, 'Two-person:', isTwoPerson);
    
    if (detectedCity === 'Sydney') {
      if (isTwoPerson) {
        console.log('🔥 DAYS: Two-person delivery - Tue/Wed/Thu only');
        setAvailableDays(['Tuesday', 'Wednesday', 'Thursday']);
      } else if (zone) {
        // Map zone names to days - handles both short and full zone names
        const zoneKey = zone.toLowerCase().includes('eastern') ? 'eastern' :
                       zone.toLowerCase().includes('western') ? 'western' :
                       zone.toLowerCase().includes('northern') ? 'northern' :
                       zone.toLowerCase().includes('southern') ? 'southern' : null;
        
        const zoneMap = {
          'eastern': ['Tuesday', 'Thursday'],
          'western': ['Monday', 'Wednesday', 'Friday'],
          'northern': ['Monday', 'Wednesday', 'Friday'],
          'southern': ['Tuesday', 'Thursday']
        };
        
        const availableDays = zoneKey ? zoneMap[zoneKey] : days;
        console.log('🔥 DAYS: Zone', zone, '(', zoneKey, ') - Days:', availableDays);
        setAvailableDays(availableDays);
      } else {
        console.log('🔥 DAYS: No zone detected - All days available');
        setAvailableDays(days);
      }
    } else if (detectedCity === 'Melbourne' && zone) {
      // Melbourne delivery temporarily disabled
      setAvailableDays([]);
    } else {
      console.log('🔥 DAYS: Non-Sydney city - All days available');
      setAvailableDays(days);
    }
  };

  const getDeliveryTypeLabel = () => {
    if (corridorType === 'syd-bris') return 'Sydney-Brisbane Corridor';
    if (corridorType === 'syd-melb') return 'Sydney-Melbourne Corridor';
    if (deliveryType === 'melbourne-metro') return 'Melbourne Metro';
    if (deliveryType === 'melbourne-outer') return 'Melbourne Outer';
    if (deliveryType === 'local') return `${detectedCity} Local Delivery`;
    return 'Delivery';
  };

  const getTotalPrice = () => {
    if (!deliveryFee) return 0;
    const twoPersonFee = isTwoPerson && detectedCity === 'Sydney' ? 
      (distance > 15 ? 50 + (distance - 15) * 2.5 : 50) : 0;
    return deliveryFee + twoPersonFee;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Delivery Calculator</h1>
          <p className="text-gray-600">Sydney • Brisbane • Melbourne</p>
          
          {/* Admin Link */}
          <Link 
            href="/admin" 
            className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Admin
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Address Input Section */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              Delivery Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={handleAddressInput}
                placeholder="Enter your delivery address..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              />
              {addressError && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {addressError}
                </p>
              )}
              {showPredictions && predictions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border-2 border-gray-200 rounded-lg mt-1 shadow-lg">
                  {predictions.map((prediction, index) => (
                    <button
                      key={prediction.place_id}
                      onClick={() => handlePredictionSelect(prediction)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-800">{prediction.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Suburb and Zone Fields - Auto-populated */}
            {suburb && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
                  <input
                    type="text"
                    value={suburb}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <input
                    type="text"
                    value={zone || 'Not in delivery area'}
                    readOnly
                    className={`w-full px-3 py-2 border rounded-lg font-medium ${
                      zone ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  />
                </div>
              </div>
            )}
            
            {/* Address Info Display */}
            {detectedCity && distance !== null && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{detectedCity} Warehouse</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {zone && detectedCity === 'Sydney' && (
                      <span className="font-medium">{zone}</span>
                    )}
                    <span className="font-medium">{distance} km</span>
                    <span>{duration}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stairs & Strength Section - Always visible */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Stairs Question */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                    <Home className="w-5 h-5 text-blue-600" />
                    Stairs at Delivery
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setStairs('none')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        stairs === 'none' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      None
                    </button>
                    <button
                      onClick={() => setStairs('few')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        stairs === 'few' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Few Steps
                    </button>
                    <button
                      onClick={() => setStairs('flight')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        stairs === 'flight' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      1 Flight
                    </button>
                    <button
                      onClick={() => setStairs('multiple')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        stairs === 'multiple' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Multiple
                    </button>
                  </div>
                </div>

                {/* Strength Question */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    Help Available
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['0', '1', '2', '3', '4', '5'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setStrength(level)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          strength === level 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {level === '0' ? 'None' : 
                         level === '5' ? 'Strong' : 
                         `Level ${level}`}
                      </button>
                    ))}
                  </div>
                </div>
          </div>

          {/* Two-Person Service Section */}
          {stairs && strength && (
            <div className="mb-8">
              {/* Recommendation Card */}
              <div className={`p-4 rounded-lg border mb-4 ${
                isRecommended 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    {isRecommended ? '👥' : '👤'}
                  </span>
                  <div>
                    <p className={`font-medium ${
                      isRecommended ? 'text-amber-900' : 'text-green-900'
                    }`}>
                      {isRecommended 
                        ? `2-Person Delivery Recommended`
                        : `Standard Delivery Should Be Fine`}
                    </p>
                    <p className={`text-sm mt-1 ${
                      isRecommended ? 'text-amber-700' : 'text-green-700'
                    }`}>
                      {(() => {
                        const hasStairs = stairs === 'flight' || stairs === 'multiple';
                        const needsHelp = parseInt(strength) <= 2;
                        
                        if (isRecommended) {
                          return "With stairs to navigate and your strength level, two people will ensure safe delivery.";
                        }
                        if (hasStairs && !needsHelp) {
                          return "You have stairs but good strength - standard delivery could work, but 2-person is available if needed.";
                        }
                        if (!hasStairs && needsHelp) {
                          return "Ground level delivery - our standard driver should be able to handle this.";
                        }
                        return "Ground level delivery with good strength - our standard driver can handle this.";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2-Person Service Option - MANDATORY */}
              <div className="bg-white rounded-lg p-5 border-2 border-red-200">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900 text-lg">
                      Do you need 2-person delivery?
                    </span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                      REQUIRED
                    </span>
                    {isRecommended && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                        RECOMMENDED FOR YOU
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    Two delivery staff to carry your mattress inside for an additional ${distance && distance > 15 ? Math.round(50 + (distance - 15) * 2.5) : 50}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTwoPerson(true);
                        // Check zone and update available days
                        if (postcode && zone) {
                          console.log('🔥 TWO-PERSON: Checking zone', zone, 'for postcode', postcode);
                          // Two-person only available Tue/Wed/Thu in Sydney
                          if (detectedCity === 'Sydney') {
                            setAvailableDays(['Tuesday', 'Wednesday', 'Thursday']);
                          }
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isTwoPerson === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-lg">YES</div>
                      <div className="text-sm mt-1">I need help carrying</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsTwoPerson(false);
                        // Check zone and update available days for standard delivery
                        if (postcode && zone) {
                          console.log('🔥 STANDARD: Checking zone', zone, 'for postcode', postcode);
                          // Standard delivery available based on zone
                          updateAvailableDays();
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isTwoPerson === false
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-lg">NO</div>
                      <div className="text-sm mt-1">Standard kerbside delivery</div>
                    </button>
                  </div>
                  
                  {isTwoPerson === true && (
                    <p className="text-xs text-green-700 mt-3 bg-green-50 p-2 rounded">
                      ✓ Two-person delivery selected • Available Tuesday, Wednesday, Thursday only
                    </p>
                  )}
                  
                  {isTwoPerson === false && (
                    <p className="text-xs text-blue-700 mt-3 bg-blue-50 p-2 rounded">
                      ✓ Standard kerbside delivery selected • Driver will deliver to your kerb
                    </p>
                  )}
                  
                  {isTwoPerson === null && (
                    <p className="text-xs text-red-600 mt-3">
                      ⚠️ Please select yes or no to continue
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Day Selection - Shows after 2-person choice */}
          {isTwoPerson !== null && (
          <div className="mb-8">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Select Delivery Day
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                    const isAvailable = availableDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => isAvailable && setSelectedDay(day)}
                        disabled={!isAvailable}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedDay === day 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : isAvailable
                            ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-medium">{day}</div>
                        {!isAvailable && (
                          <div className="text-xs mt-1">Not Available</div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {zone && detectedCity && (
                  <p className="text-sm text-gray-600 mt-3">
                    {detectedCity === 'Sydney' ? `Sydney ${zone} zone` : `Melbourne ${zone} zone`}
                  </p>
                )}
          </div>
          )}

          {/* Pricing Summary - Shows when address is entered */}
          {deliveryFee !== null && (
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Delivery Quote
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{getDeliveryTypeLabel()}</span>
                      <span className="font-semibold">${deliveryFee}</span>
                    </div>
                    
                    {isTwoPerson && detectedCity === 'Sydney' && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Two-Person Service</span>
                        <span className="font-semibold">
                          +${distance > 15 ? (50 + (distance - 15) * 2.5).toFixed(0) : 50}
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-800">Total Delivery</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${getTotalPrice()}
                        </span>
                      </div>
                    </div>

                    {selectedDay && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <p className="text-green-800 font-medium">
                          ✓ Delivery scheduled for {selectedDay}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}