'use client';

import React, { useState } from 'react';
import { getPostcodeZone } from '../services/postcodeService';
import { detectZoneIntelligently } from '../services/zoneDetectionService';

function ZoneChecker() {
  const [postcode, setPostcode] = useState('');
  const [zoneInfo, setZoneInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkZone = async () => {
    if (!postcode) {
      setError('Please enter a postcode');
      return;
    }

    setLoading(true);
    setError('');
    setZoneInfo(null);

    try {
      // Basic zone lookup
      const basicZone = await getPostcodeZone(postcode);
      
      // Intelligent zone detection (without full address)
      const intelligentResult = await detectZoneIntelligently('', postcode, basicZone);
      
      setZoneInfo({
        postcode,
        basicZone: basicZone || 'Not in any zone',
        intelligentZone: intelligentResult.zone || 'Not detected',
        source: intelligentResult.source,
        confidence: intelligentResult.confidence,
        suburb: intelligentResult.suburb,
        displayName: intelligentResult.displayName
      });
    } catch (err) {
      console.error('Error checking zone:', err);
      setError('Failed to check zone');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkZone();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Zone Checker</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyPress={handleKeyPress}
          placeholder="Enter postcode (e.g., 2000)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          maxLength="4"
        />
        <button
          onClick={checkZone}
          disabled={loading}
          className="px-6 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Checking...' : 'Check Zone'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {zoneInfo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Postcode:</span>
              <span className="font-semibold">{zoneInfo.postcode}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Basic Zone:</span>
              <span className={`font-semibold ${zoneInfo.basicZone === 'Not in any zone' ? 'text-gray-400' : 'text-green-600'}`}>
                {zoneInfo.basicZone}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Intelligent Zone:</span>
              <span className={`font-semibold ${zoneInfo.intelligentZone === 'Not detected' ? 'text-gray-400' : 'text-blue-600'}`}>
                {zoneInfo.intelligentZone}
              </span>
            </div>

            {zoneInfo.suburb && (
              <div className="flex justify-between">
                <span className="text-gray-600">Suburb:</span>
                <span className="font-medium">{zoneInfo.suburb}</span>
              </div>
            )}

            {zoneInfo.source && (
              <div className="flex justify-between">
                <span className="text-gray-600">Detection Source:</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">{zoneInfo.source}</span>
              </div>
            )}

            {zoneInfo.confidence && (
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className={`font-medium ${
                  zoneInfo.confidence === 'high' ? 'text-green-600' : 
                  zoneInfo.confidence === 'medium' ? 'text-yellow-600' : 
                  'text-orange-600'
                }`}>
                  {zoneInfo.confidence}
                </span>
              </div>
            )}

            {zoneInfo.displayName && (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Display Name:</span>
                  <span className="font-medium text-brand-primary">{zoneInfo.displayName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ZoneChecker;