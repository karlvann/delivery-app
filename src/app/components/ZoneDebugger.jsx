import React, { useEffect, useState } from 'react';
import { extractPostcode, getPostcodeZone } from './postcodeService';

function ZoneDebugger({ address }) {
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    const checkZone = async () => {
      if (!address) {
        setDebugInfo({});
        return;
      }
      
      const postcode = extractPostcode(address);
      const zone = postcode ? await getPostcodeZone(postcode) : null;
      const savedRecs = localStorage.getItem('zoneRecommendations');
      const recommendations = savedRecs ? JSON.parse(savedRecs) : {};
      const days = zone ? recommendations[zone] || [] : [];
      
      setDebugInfo({
        address,
        postcode,
        zone,
        days,
        daysText: days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')
      });
    };
    
    checkZone();
  }, [address]);
  
  if (!debugInfo.address) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
      <div className="font-bold mb-1">🔍 Zone Debug Info:</div>
      <div>Address: {debugInfo.address}</div>
      <div>Postcode: {debugInfo.postcode || 'not found'}</div>
      <div>Zone: {debugInfo.zone || 'not detected'}</div>
      <div>Allowed Days: {debugInfo.daysText || 'all days'}</div>
    </div>
  );
}

export default ZoneDebugger;