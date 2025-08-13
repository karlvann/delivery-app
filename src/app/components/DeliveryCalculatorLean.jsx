'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import AddressInput from './AddressInput';
import DeliveryMap from './DeliveryMap';
import PricingDisplay from './PricingDisplay';
import TwoPersonOption from './TwoPersonOption';
import DeliveryAvailability from './DeliveryAvailability';
import StairsQuestion from './StairsQuestion';
import StrengthQuestion from './StrengthQuestion';
import ZoneInfoSection from './ZoneInfoSection';
import { useDeliveryState } from '../hooks/useDeliveryState';
import { useAddressCalculation } from '../hooks/useAddressCalculation';

// Lean and mean delivery calculator - like a perfectly organized kitchen station
function DeliveryCalculatorLean() {
  const { delivery, ui, options, updateDelivery, updateUI, updateOptions, reset } = useDeliveryState();
  const { processAddress } = useAddressCalculation();

  // Handle address change - the main dish preparation
  const handleAddressChange = useCallback(async (selectedAddress) => {
    if (!selectedAddress) {
      reset();
      return;
    }

    updateUI({ loading: true, error: '' });
    updateDelivery({ address: selectedAddress });

    try {
      const result = await processAddress(selectedAddress, options.twoPerson);
      
      updateDelivery({
        city: result.city,
        postcode: result.postcode,
        zone: result.zone,
        distance: result.distance,
        corridor: result.corridor,
        fee: result.fee,
        type: result.type
      });
      
      updateUI({ loading: false, showMap: true });
    } catch (error) {
      console.error('Address processing error:', error);
      updateUI({ 
        loading: false, 
        error: error.message || 'Failed to calculate delivery' 
      });
    }
  }, [options.twoPerson, processAddress, reset, updateDelivery, updateUI]);

  // Handle two-person option change
  const handleTwoPersonChange = useCallback((value) => {
    updateOptions({ twoPerson: value });
    if (delivery.address) {
      handleAddressChange(delivery.address);
    }
  }, [delivery.address, handleAddressChange, updateOptions]);

  // Handle delivery day selection
  const handleDaySelected = useCallback((day) => {
    updateOptions({ deliveryDay: day });
  }, [updateOptions]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - clean and simple */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              <span className="text-brand-primary">ausbeds</span> Delivery Calculator
            </h1>
            <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Main content - organized like prep stations */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left column - Input section */}
          <div className="space-y-6">
            {/* Address input */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Delivery Address</h2>
              <AddressInput
                value={delivery.address}
                onChange={handleAddressChange}
                placeholder="Enter delivery address..."
              />
            </div>

            {/* Delivery info display */}
            {delivery.fee !== null && (
              <PricingDisplay 
                deliveryInfo={{
                  distanceInKm: delivery.distance,
                  deliveryFee: delivery.fee,
                  deliveryType: delivery.type,
                  isCorridorDelivery: !!delivery.corridor,
                  corridor: delivery.corridor,
                  city: delivery.city,
                  twoPersonFee: options.twoPerson ? 50 : 0
                }}
                loading={ui.loading}
                includeTwoPerson={options.twoPerson}
                selectedDay={options.deliveryDay}
              />
            )}

            {/* Options section */}
            {delivery.city === 'sydney' && (
              <div className="space-y-4">
                <StairsQuestion 
                  onAnswer={(value) => updateOptions({ stairs: value })} 
                />
                
                <StrengthQuestion 
                  onAnswer={(value) => updateOptions({ strength: value })} 
                />
                
                <TwoPersonOption
                  isSelected={options.twoPerson}
                  onChange={handleTwoPersonChange}
                  stairsInfo={options.stairs}
                  strengthInfo={options.strength}
                  deliveryInfo={{ distanceInKm: delivery.distance }}
                />

                <DeliveryAvailability
                  customerAddress={delivery.address}
                  onDaySelected={handleDaySelected}
                  requiresTwoPerson={options.twoPerson}
                  isSydney={true}
                />
              </div>
            )}

            {/* Zone info toggle */}
            {delivery.zone && (
              <button
                onClick={() => updateUI({ showZoneInfo: !ui.showZoneInfo })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {ui.showZoneInfo ? 'Hide' : 'Show'} Zone Information
              </button>
            )}

            {ui.showZoneInfo && delivery.zone && (
              <ZoneInfoSection currentZone={delivery.zone} />
            )}

            {/* Error display */}
            {ui.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{ui.error}</p>
              </div>
            )}
          </div>

          {/* Right column - Map */}
          <div>
            {ui.showMap && delivery.address && (
              <DeliveryMap 
                destination={delivery.address}
                origin={delivery.city}
                showRoute={true}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DeliveryCalculatorLean;