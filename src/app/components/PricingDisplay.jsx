import React from 'react';
import { formatCurrency } from '../services/priceCalculator';

function PricingDisplay({ deliveryInfo, loading, includeTwoPerson, selectedDay }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!deliveryInfo) {
    return null;
  }

  const { 
    distanceInKm, 
    deliveryFee, 
    isFreeDelivery, 
    deliveryType, 
    isCorridorDelivery,
    corridor,
    city,
    origin,
    duration
  } = deliveryInfo;

  return (
    <div className="space-y-4">
      {/* Selected Delivery Day */}
      {selectedDay && (
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Delivery scheduled for: {selectedDay}
            </span>
          </div>
        </div>
      )}

      {/* Simple Pricing Display */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-lg text-gray-700">
            {isCorridorDelivery ? 'Corridor Delivery' : 'Delivery Fee'}
          </span>
          <span className="text-3xl font-bold text-brand-primary">
            {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
          </span>
        </div>

        {/* 2-Person Delivery Fee if applicable */}
        {includeTwoPerson && deliveryInfo.twoPersonFee !== undefined && deliveryInfo.twoPersonFee > 0 && (
          <>
            <div className="border-t mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">2-Person Service</span>
                <span className="text-xl font-bold text-purple-600">
                  +{formatCurrency(deliveryInfo.twoPersonFee)}
                </span>
              </div>
            </div>
            
            {/* Total */}
            <div className="border-t mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency((deliveryInfo.deliveryFee || 0) + (deliveryInfo.twoPersonFee || 0))}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PricingDisplay;