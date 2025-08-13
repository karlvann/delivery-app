'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import AddressInput from './AddressInput';
import StairsQuestion from './StairsQuestion';
import StrengthQuestion from './StrengthQuestion';
import TwoPersonOption from './TwoPersonOption';
import DeliveryAvailability from './DeliveryAvailability';
import PricingDisplay from './PricingDisplay';
import DeliveryMap from './DeliveryMap';
import { calculateDistanceFromCity, detectCity, CITY_ORIGINS } from './googleMapsService';
import { calculateDeliveryFee } from './priceCalculator';
import { loadCorridors, extractPostcode, isCorridorPostcode, getPostcodeZone } from './postcodeService';
import { detectZoneIntelligently } from './zoneDetectionService';

function DeliveryCalculator() {
  const [address, setAddress] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressForMap, setAddressForMap] = useState('');
  const [includeTwoPerson, setIncludeTwoPerson] = useState(false);
  const [selectedDeliveryDay, setSelectedDeliveryDay] = useState(null);
  const [postcodeInfo, setPostcodeInfo] = useState(null);
  const [stairsInfo, setStairsInfo] = useState(null); // null = not answered, or stairs option object
  const [strengthInfo, setStrengthInfo] = useState(null); // null = not answered, or strength option object
  const [showZoneInfo, setShowZoneInfo] = useState(false); // Toggle to show zone info

  // Load corridor data on mount
  useEffect(() => {
    loadCorridors();
  }, []);

  // Debug log when postcodeInfo changes
  useEffect(() => {
    if (postcodeInfo) {
      console.log('🔥 ZONE DETECTION - postcodeInfo state updated:', postcodeInfo);
      console.log('🔥 ZONE DETECTION - Zone display should show:', postcodeInfo.zone !== 'Not in any zone' ? postcodeInfo.zone : 'hidden');
    }
  }, [postcodeInfo]);

  const handleAddressChange = useCallback(async (newAddress, forceTwoPerson = undefined) => {
    if (!newAddress) {
      setDeliveryInfo(null);
      setError('');
      setAddressForMap('');
      setIncludeTwoPerson(false);
      setAddress(''); // Clear the address state
      setSelectedDeliveryDay(null); // Clear selected day
      setPostcodeInfo(null); // Clear postcode info
      setStairsInfo(null); // Reset stairs question
      setStrengthInfo(null); // Reset strength question
      setShowZoneInfo(false); // Reset zone info display
      return;
    }

    // Update the address state
    setAddress(newAddress);
    
    // Reset zone info display when address changes
    setShowZoneInfo(false);
    
    // Reset 2-person delivery when address changes (unless explicitly setting it)
    if (forceTwoPerson === undefined) {
      setIncludeTwoPerson(false);
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Extract postcode and check if it's in a corridor
      const postcode = extractPostcode(newAddress);
      console.log('🔥 ZONE DETECTION - Extracted postcode:', postcode);
      
      const corridor = postcode ? await isCorridorPostcode(postcode) : null;
      const basicZone = postcode ? await getPostcodeZone(postcode) : null;
      console.log('🔥 ZONE DETECTION - Basic zone lookup result:', basicZone);
      
      // Step 2: Use intelligent zone detection if no zone found
      const intelligentZone = await detectZoneIntelligently(newAddress, postcode, basicZone);
      console.log('🔥 ZONE DETECTION - Intelligent zone result:', intelligentZone);
      
      const zone = intelligentZone.zone || basicZone;
      console.log('🔥 ZONE DETECTION - Final zone:', zone);

      // Set postcode info for display
      const postcodeInfoData = {
        postcode,
        zone: zone || 'Not in any zone',
        zoneSource: intelligentZone.source,
        zoneConfidence: intelligentZone.confidence,
        suburb: intelligentZone.suburb,
        displayName: intelligentZone.displayName,
        corridor: corridor || 'Not in corridor',
        inCorridor: !!corridor
      };
      console.log('🔥 ZONE DETECTION - Setting postcodeInfo state:', postcodeInfoData);
      setPostcodeInfo(postcodeInfoData);

      if (corridor) {
        // Corridor delivery - fixed $190 rate
        console.log(`Postcode ${postcode} is in ${corridor} corridor`);
        const useTwoPerson = forceTwoPerson !== undefined ? forceTwoPerson : false;
        const fees = calculateDeliveryFee({ 
          corridor,
          includeTwoPerson: useTwoPerson
        });
        
        setDeliveryInfo({
          ...fees,
          duration: 'Multiple day delivery',
          formattedAddress: newAddress,
          postcode,
          zone,
          corridor
        });
        setAddressForMap(newAddress);
      } else {
        // Step 2: Local delivery - detect city and calculate distance
        const city = selectedCity || detectCity(newAddress);
        console.log(`Calculating local delivery from ${city}`);

        const distanceData = await calculateDistanceFromCity(city, newAddress);
        const useTwoPerson = forceTwoPerson !== undefined ? forceTwoPerson : false;
        const fees = calculateDeliveryFee({ 
          distanceInKm: distanceData.distanceInKm, 
          city,
          includeTwoPerson: useTwoPerson
        });

        console.log('Calculated fees:', fees);
        console.log('Include 2-person:', useTwoPerson);
        console.log('City:', city);
        
        setDeliveryInfo({
          ...fees,
          distanceInKm: distanceData.distanceInKm,
          duration: distanceData.durationText,
          formattedAddress: distanceData.formattedAddress,
          origin: CITY_ORIGINS[city],
          city,
          postcode,
          zone
        });
        console.log('Setting deliveryInfo with city:', city);
        setAddressForMap(newAddress);
        setSelectedCity(city);
      }
    } catch (err) {
      console.error('Error calculating delivery:', err);
      if (err.message.includes('beyond 110km') || err.message.includes('not available beyond')) {
        setError('This address is beyond our delivery area. Please email sales@ausbeds.com.au for a custom quote.');
      } else if (err.message.includes('No route found')) {
        setError('We couldn\'t find a route to this address. Please check the address and try again.');
      } else {
        setError('Unable to calculate delivery. Please email sales@ausbeds.com.au for a quote.');
      }
      setDeliveryInfo(null);
      setAddressForMap('');
    } finally {
      setLoading(false);
    }
  }, [selectedCity, includeTwoPerson]);

  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    if (address) {
      handleAddressChange(address);
    }
  };

  const clearSearch = () => {
    setDeliveryInfo(null);
    setError('');
    setAddressForMap('');
    setAddress('');
    setPostcodeInfo(null);
    setSelectedDeliveryDay(null);
    setIncludeTwoPerson(false);
    setStairsInfo(null);
    setStrengthInfo(null);
    setShowZoneInfo(false);
  };

  const handleStairsAnswer = (stairsOption) => {
    setStairsInfo(stairsOption);
    // Don't auto-add 2-person, just store the stairs info
  };

  const handleStrengthAnswer = (strengthOption) => {
    setStrengthInfo(strengthOption);
    // Don't auto-add 2-person, just store the strength info
  };

  const checkZone = async () => {
    if (!address) {
      setError('Please enter an address first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const postcode = extractPostcode(address);
      const corridor = postcode ? await isCorridorPostcode(postcode) : null;
      const basicZone = postcode ? await getPostcodeZone(postcode) : null;
      const intelligentZone = await detectZoneIntelligently(address, postcode, basicZone);
      const zone = intelligentZone.zone || basicZone;

      setPostcodeInfo({
        postcode,
        zone: zone || 'Not in any zone',
        zoneSource: intelligentZone.source,
        zoneConfidence: intelligentZone.confidence,
        suburb: intelligentZone.suburb,
        displayName: intelligentZone.displayName,
        corridor: corridor || 'Not in corridor',
        inCorridor: !!corridor
      });
      
      setShowZoneInfo(true);
    } catch (err) {
      console.error('Error checking zone:', err);
      setError('Unable to check zone for this address');
    } finally {
      setLoading(false);
    }
  };

  const hasSearched = deliveryInfo || error;

  // Get simple address (first line only)
  const getSimpleAddress = (fullAddress) => {
    if (!fullAddress) return '';
    // Take everything before the first comma or "NSW"/"QLD"/"VIC"
    const parts = fullAddress.split(/,|NSW|QLD|VIC/);
    return parts[0].trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Minimal header with admin link */}
      <header className="absolute top-0 right-0 p-6 z-10">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Admin
        </Link>
      </header>

      {/* Main content area */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {!hasSearched ? (
          // Clean welcome screen - Google style
          <div className="w-full max-w-2xl -mt-20">
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold mb-4">
                <span className="text-brand-primary">ausbeds</span>
              </h1>
              <p className="text-xl text-gray-600">
                Delivery Calculator
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <AddressInput
                value={address}
                onChange={setAddress}
                onAddressChange={handleAddressChange}
                error={error}
                placeholder="Enter your delivery address..."
                autoFocus={true}
              />
              
              {/* Debug: Show address state */}
              {address && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Current address: "{address}"
                </div>
              )}
              
              {/* Check Zone Button - Always visible */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={checkZone}
                  disabled={loading || !address}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {loading ? 'Checking...' : 'Check Which Zone'}
                </button>
              </div>
              
              {/* Zone Information Display */}
              {showZoneInfo && postcodeInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-2">
                    {postcodeInfo.zone !== 'Not in any zone' ? (
                      <>
                        <div className="text-center">
                          <p className="text-gray-600">This address is in:</p>
                          <p className="text-2xl font-bold text-brand-primary mt-1">
                            {postcodeInfo.displayName || postcodeInfo.zone}
                          </p>
                        </div>
                        {postcodeInfo.suburb && (
                          <p className="text-center text-gray-500">
                            Suburb: {postcodeInfo.suburb}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-center text-gray-500">
                        This address is not in a specific Sydney delivery zone
                      </p>
                    )}
                    {postcodeInfo.inCorridor && (
                      <p className="text-center text-green-600 font-medium mt-2">
                        ✓ Corridor delivery available ({postcodeInfo.corridor})
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                Sydney • Brisbane • Melbourne
              </p>
            </div>
          </div>
        ) : (
          // Results view - simplified
          <div className="w-full max-w-7xl py-8">
            {/* Simplified header with delivery info */}
            <div className="mb-8">
              {/* Address change bar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <AddressInput
                  value={address}
                  onChange={setAddress}
                  onAddressChange={handleAddressChange}
                  error={error}
                />
                
                {/* Zone and Distance Info */}
                {postcodeInfo && deliveryInfo && deliveryInfo.city?.toLowerCase() === 'sydney' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                    {console.log('🔥 ZONE DETECTION - Rendering zone info. Zone:', postcodeInfo.zone, 'City:', deliveryInfo.city)}
                    {postcodeInfo.zone && postcodeInfo.zone !== 'Not in any zone' && (
                      <span>Zone: <strong>{postcodeInfo.zone}</strong></span>
                    )}
                    {postcodeInfo.zone && postcodeInfo.zone !== 'Not in any zone' && deliveryInfo.distanceInKm && (
                      <span> • </span>
                    )}
                    {deliveryInfo.distanceInKm && (
                      <span><strong>{deliveryInfo.distanceInKm.toFixed(1)}km</strong> from Sydney Warehouse</span>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery information - clean and simple */}
              {deliveryInfo && (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Delivering to</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {getSimpleAddress(address)}
                  </h2>
                  <p className="text-gray-700 mb-4">
                    via ausbeds {deliveryInfo.city} {deliveryInfo.corridor ? 'Corridor' : 'Local'} Delivery
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm">
                    {deliveryInfo.distanceInKm && (
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span className="font-medium">{deliveryInfo.distanceInKm.toFixed(1)} km</span>
                      </div>
                    )}
                    {deliveryInfo.duration && (
                      <div className="flex items-center gap-2">
                        <span>⏱</span>
                        <span className="font-medium">{deliveryInfo.duration}</span>
                      </div>
                    )}
                    {deliveryInfo.corridor && (
                      <div className="flex items-center gap-2">
                        <span>🚚</span>
                        <span className="font-medium">Corridor Route</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
                <p className="font-medium">Unable to calculate delivery</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : deliveryInfo && (
              <>
                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Primary: Stairs first, then Day Selection */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Step 1: Stairs Question (shows immediately for Sydney and Melbourne) */}
                    {(deliveryInfo.city?.toLowerCase() === 'sydney' || 
                      deliveryInfo.city?.toLowerCase() === 'melbourne') && stairsInfo === null && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-bold">1</span>
                          Delivery Access
                        </h2>
                        <StairsQuestion onAnswer={handleStairsAnswer} />
                      </div>
                    )}

                    {/* Summary of Step 1 selections */}
                    {(deliveryInfo.city?.toLowerCase() === 'sydney' || 
                      deliveryInfo.city?.toLowerCase() === 'melbourne') && stairsInfo && !strengthInfo && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <span className="text-green-600">✓</span>
                          <span className="font-medium">Stairs:</span>
                          <span>{stairsInfo.icon} {stairsInfo.label}</span>
                        </div>
                      </div>
                    )}

                    {/* Step 1 Continued: Strength Question (shows after stairs is answered) */}
                    {(deliveryInfo.city?.toLowerCase() === 'sydney' || 
                      deliveryInfo.city?.toLowerCase() === 'melbourne') && stairsInfo && strengthInfo === null && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-bold">1</span>
                          Your Strength Level
                        </h2>
                        <StrengthQuestion onAnswer={handleStrengthAnswer} />
                      </div>
                    )}

                    {/* Summary of Step 1 selections */}
                    {(deliveryInfo.city?.toLowerCase() === 'sydney' || 
                      deliveryInfo.city?.toLowerCase() === 'melbourne') && stairsInfo && strengthInfo && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                        <div className="text-sm text-green-800">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <span className="text-green-600">✓</span>
                            Step 1 Complete
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-start gap-1">
                              <span className="text-green-600">•</span>
                              <span><strong>Stairs:</strong> {stairsInfo.label}</span>
                            </div>
                            <div className="flex items-start gap-1">
                              <span className="text-green-600">•</span>
                              <span><strong>Strength:</strong> Level {strengthInfo.value}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Optional 2-Person Service (shows after strength is answered for Sydney and Melbourne) */}
                    {(deliveryInfo.city?.toLowerCase() === 'sydney' || 
                      deliveryInfo.city?.toLowerCase() === 'melbourne') && strengthInfo && !deliveryInfo.corridor && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-bold">2</span>
                          Optional Services
                        </h2>
                        <TwoPersonOption 
                          isSelected={includeTwoPerson}
                          onChange={(checked) => {
                            setIncludeTwoPerson(checked);
                            handleAddressChange(address, checked);
                          }}
                          stairsInfo={stairsInfo}
                          strengthInfo={strengthInfo}
                          deliveryInfo={deliveryInfo}
                        />
                      </div>
                    )}

                    {/* Step 3: Day Selection - Show for all cities */}
                    {/* Sydney/Melbourne: after strength question. Brisbane: immediately */}
                    {(((deliveryInfo.city?.toLowerCase() === 'sydney' || 
                        deliveryInfo.city?.toLowerCase() === 'melbourne') && strengthInfo) ||
                      (deliveryInfo.city?.toLowerCase() === 'brisbane')) && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-bold">
                            {deliveryInfo.city?.toLowerCase() === 'brisbane' ? '1' : '3'}
                          </span>
                          Choose Your Delivery Day
                        </h2>
                        <DeliveryAvailability 
                          customerAddress={address}
                          onDaySelected={setSelectedDeliveryDay}
                          requiresTwoPerson={includeTwoPerson}
                          isSydney={deliveryInfo.city?.toLowerCase() === 'sydney'}
                          isMelbourne={deliveryInfo.city?.toLowerCase() === 'melbourne'}
                        />
                      </div>
                    )}

                    {/* Step 4: Pricing Summary - Show after day is selected */}
                    {selectedDeliveryDay && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-bold">
                            {deliveryInfo.city?.toLowerCase() === 'sydney' ? '4' : '1'}
                          </span>
                          Delivery Cost
                        </h2>
                        <PricingDisplay 
                          deliveryInfo={deliveryInfo}
                          loading={loading}
                          includeTwoPerson={includeTwoPerson}
                          selectedDay={selectedDeliveryDay}
                        />
                      </div>
                    )}

                    {/* Confirmation Messages */}
                    {deliveryInfo.city?.toLowerCase() === 'sydney' && stairsInfo === null && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-800 text-sm font-medium">
                          ⚠️ Please answer the stairs question above to proceed
                        </p>
                      </div>
                    )}

                    {deliveryInfo.city?.toLowerCase() === 'sydney' && stairsInfo && strengthInfo === null && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-800 text-sm font-medium">
                          ⚠️ Please select your strength level above to continue
                        </p>
                      </div>
                    )}

                    {deliveryInfo.city?.toLowerCase() === 'sydney' && strengthInfo && !selectedDeliveryDay && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-800 text-sm font-medium">
                          ⚠️ Please select a delivery day above to continue
                        </p>
                      </div>
                    )}

                    {/* Continue to Checkout Button - Only show when day is selected */}
                    {selectedDeliveryDay && (
                      <div className="mt-6">
                        <button className="w-full px-6 py-4 bg-green-600 text-white font-medium text-lg rounded-lg hover:bg-green-700 transition-colors shadow-lg">
                          Continue to Checkout
                          {deliveryInfo.city?.toLowerCase() === 'sydney' && selectedDeliveryDay && 
                            ` • ${selectedDeliveryDay}`}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Map */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-8">
                      {addressForMap && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                          <DeliveryMap customerAddress={addressForMap} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryCalculator;