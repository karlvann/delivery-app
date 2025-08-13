import React, { useState, useEffect } from 'react';
import { getTwoPersonDeliveryDays } from './postcodeService';

function TwoPersonOption({ isSelected, onChange, disabled, stairsInfo, strengthInfo, deliveryInfo }) {
  // Recommend 2-person if: (1 flight or more stairs) AND (strength level C, D, or E)
  const hasStairs = stairsInfo?.value === 'one_flight' || stairsInfo?.value === 'multiple_flights';
  const needsHelp = strengthInfo?.value <= 2; // 2 or less means C, D, or E
  const isRecommended = hasStairs && needsHelp;
  const [availableDaysText, setAvailableDaysText] = useState('');
  
  useEffect(() => {
    // Set available days text on client side only
    const days = getTwoPersonDeliveryDays();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setAvailableDaysText(days.map(d => dayNames[d]).join(', '));
  }, []);
  
  // Calculate 2-person price
  const getTwoPersonPrice = () => {
    if (!deliveryInfo) return '$50';
    const distance = deliveryInfo.distanceInKm || 0;
    if (distance <= 15) return '$50';
    const extraKm = distance - 15;
    const extraCost = extraKm * 2.5;
    const total = 50 + extraCost;
    return `$${Math.round(total)}`;
  };

  return (
    <div className="space-y-4">
      {/* Recommendation based on stairs and strength */}
      {(stairsInfo || strengthInfo) && (
        <div className={`p-4 rounded-lg border ${
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
                {/* Message based on combination of stairs and strength */}
                {isRecommended && 
                  "With stairs to navigate and your strength level, two people will ensure safe delivery."}
                {!isRecommended && hasStairs && !needsHelp && 
                  "You have stairs but good strength - standard delivery could work, but 2-person is available if needed."}
                {!isRecommended && !hasStairs && needsHelp && 
                  "Ground level delivery - our standard driver should be able to handle this."}
                {!isRecommended && !hasStairs && !needsHelp && 
                  "Ground level delivery with good strength - our standard driver can handle this."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2-Person Service Option */}
      <div className="bg-white rounded-lg p-5 border-2 border-gray-200">
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900 text-lg">
                Don&apos;t feel like lifting?
              </span>
              {isRecommended && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                  RECOMMENDED
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mt-2">
              Add a second person for {getTwoPersonPrice()}
            </p>
            {availableDaysText && (
              <p className="text-xs text-gray-500 mt-1">
                Available: {availableDaysText}
              </p>
            )}
          </div>
        </label>
      </div>
    </div>
  );
}

export default TwoPersonOption;