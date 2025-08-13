'use client';

import { useState, useEffect } from 'react';
import { extractPostcode, isCorridorPostcode, getPostcodeZone, getTwoPersonDeliveryDays } from '../components/postcodeService';
import { getZoneForPostcode } from '../components/zoneService';
import { detectZoneIntelligently } from '../components/zoneDetectionService';

export default function ValidationPage() {
  const [testResults, setTestResults] = useState([]);
  const [zoneRecommendations, setZoneRecommendations] = useState(null);
  const [corridorStats, setCorridorStats] = useState({});
  
  useEffect(() => {
    runValidationTests();
  }, []);
  
  const runValidationTests = async () => {
    const results = [];
    
    // Check localStorage data
    const zoneRecs = localStorage.getItem('zoneRecommendations');
    setZoneRecommendations(zoneRecs ? JSON.parse(zoneRecs) : null);
    
    const sydBris = localStorage.getItem('syd-bris-corridor');
    const sydMelb = localStorage.getItem('syd-melb-corridor');
    setCorridorStats({
      sydBris: sydBris ? JSON.parse(sydBris).length : 0,
      sydMelb: sydMelb ? JSON.parse(sydMelb).length : 0
    });
    
    // Test addresses
    const testAddresses = [
      { name: 'Sydney CBD', address: '1 Macquarie Street, Sydney NSW 2000', expectedZone: 'eastern' },
      { name: 'Coffs Harbour', address: '123 Main St, Coffs Harbour NSW 2450', expectedCorridor: true },
      { name: 'Melbourne CBD', address: '1 Collins Street, Melbourne VIC 3000', expectedCity: 'melbourne' },
      { name: 'Inner West Sydney', address: '123 Main St, Marrickville NSW 2204', expectedZone: 'innerwest' },
      { name: 'Northern Beaches', address: '1 Beach Road, Manly NSW 2095', expectedZone: 'northern' },
    ];
    
    for (const test of testAddresses) {
      const postcode = extractPostcode(test.address);
      const corridor = postcode ? await isCorridorPostcode(postcode) : null;
      const basicZone = postcode ? await getPostcodeZone(postcode) : null;
      const zoneInfo = postcode ? getZoneForPostcode(postcode) : null;
      const intelligentZone = await detectZoneIntelligently(test.address, postcode, basicZone);
      
      const finalZone = intelligentZone.zone || basicZone || zoneInfo?.key;
      const deliveryDays = zoneRecommendations && finalZone ? zoneRecommendations[finalZone] : [];
      
      results.push({
        name: test.name,
        address: test.address,
        postcode,
        corridor,
        zone: finalZone,
        zoneSource: intelligentZone.source,
        deliveryDays,
        passed: test.expectedZone ? finalZone === test.expectedZone : 
                test.expectedCorridor ? !!corridor : true
      });
    }
    
    setTestResults(results);
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔥 Delivery Calculator Validation Report</h1>
      
      {/* Configuration Status */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-3">📊 Configuration Status</h2>
        
        <div className="space-y-2">
          <div>
            <strong>Corridor Postcodes:</strong>
            <ul className="ml-4">
              <li>Sydney-Brisbane: {corridorStats.sydBris || 0} postcodes</li>
              <li>Sydney-Melbourne: {corridorStats.sydMelb || 0} postcodes</li>
            </ul>
          </div>
          
          <div>
            <strong>Zone Delivery Days:</strong>
            {zoneRecommendations ? (
              <ul className="ml-4">
                {Object.entries(zoneRecommendations).map(([zone, days]) => (
                  <li key={zone}>
                    {zone}: {days.length > 0 ? days.map(d => dayNames[d]).join(', ') : 'No days configured'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-600 ml-4">❌ No zone recommendations configured!</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Test Results */}
      <div className="bg-white p-4 rounded border">
        <h2 className="text-xl font-semibold mb-3">🧪 Address Test Results</h2>
        
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Test</th>
              <th className="text-left p-2">Address</th>
              <th className="text-left p-2">Postcode</th>
              <th className="text-left p-2">Zone/Corridor</th>
              <th className="text-left p-2">Delivery Days</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {testResults.map((result, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{result.name}</td>
                <td className="p-2 text-sm">{result.address}</td>
                <td className="p-2">{result.postcode || 'N/A'}</td>
                <td className="p-2">
                  {result.corridor ? (
                    <span className="text-blue-600">{result.corridor}</span>
                  ) : (
                    <span>{result.zone || 'Not detected'}</span>
                  )}
                  {result.zoneSource && (
                    <span className="text-xs text-gray-500 ml-1">({result.zoneSource})</span>
                  )}
                </td>
                <td className="p-2">
                  {result.deliveryDays.length > 0 
                    ? result.deliveryDays.map(d => dayNames[d]).join(', ')
                    : 'None configured'}
                </td>
                <td className="p-2">
                  {result.passed ? 
                    <span className="text-green-600">✅ Pass</span> : 
                    <span className="text-red-600">❌ Fail</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded">
        <h3 className="font-semibold mb-2">🔍 How to Fix Issues:</h3>
        <ol className="list-decimal ml-6 space-y-1">
          <li>Go to <a href="/admin" className="text-blue-600 underline">/admin</a> to configure zone delivery days</li>
          <li>Make sure each zone has at least Mon, Tue, Wed configured</li>
          <li>For Inner West zone, ensure delivery days are set</li>
          <li>Save changes and refresh this page to re-validate</li>
        </ol>
      </div>
      
      <button 
        onClick={runValidationTests}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        🔄 Re-run Validation
      </button>
    </div>
  );
}