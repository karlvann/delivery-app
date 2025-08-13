import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getCorridorPostcodes, 
  addPostcode, 
  removePostcode,
  loadCorridors
} from '../services/postcodeService';
import { shouldUseIntelligentDetection, setIntelligentDetection, getSuburbsForZone } from '../services/zoneDetectionService';
import { getZoneForSuburb } from '../services/zoneService';
import SydneyZoneMap from './SydneyZoneMap';
import ZoneChecker from './ZoneChecker';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('zones');
  
  // Shepherds delivery schedule state
  const [shepherdsSchedule, setShepherdsSchedule] = useState({
    pickupDay: 2, // Tuesday
    deliveryDay: 3 // Wednesday
  });
  
  // Zone recommendations state
  const [zoneRecommendations, setZoneRecommendations] = useState({
    eastern: [1, 2, 3], // Monday, Tuesday, Wednesday
    western: [3, 4, 5], // Wednesday, Thursday, Friday
    northern: [2, 3, 4], // Tuesday, Wednesday, Thursday
    southern: [1, 3, 5], // Monday, Wednesday, Friday
    innerwest: [2, 3, 4] // Tuesday, Wednesday, Thursday (was missing!)
  });
  
  // 2-person delivery days state
  const [twoPersonDays, setTwoPersonDays] = useState([2, 3, 4]); // Tuesday, Wednesday, Thursday (default)
  

  
  // Corridor postcodes state
  const [brisbanePostcodes, setBrisbanePostcodes] = useState([]);
  const [melbournePostcodes, setMelbournePostcodes] = useState([]);
  const [newPostcode, setNewPostcode] = useState({ brisbane: '', melbourne: '' });
  
  // Intelligent detection state
  const [useIntelligentDetection, setUseIntelligentDetection] = useState(true);
  const [expandedZone, setExpandedZone] = useState(null);
  const [highlightedMapZone, setHighlightedMapZone] = useState(null);
  
  // Suburb search state
  const [searchedSuburb, setSearchedSuburb] = useState('');
  const [suburbSearchResult, setSuburbSearchResult] = useState(null);

  useEffect(() => {
    // Load from localStorage after component mounts (client-side only)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedRecommendations = localStorage.getItem('zoneRecommendations');
      if (savedRecommendations) {
        try {
          setZoneRecommendations(JSON.parse(savedRecommendations));
          console.log('Loaded zone recommendations from localStorage:', JSON.parse(savedRecommendations));
        } catch (e) {
          console.error('Failed to parse zone recommendations:', e);
        }
      }
      
      // Load 2-person delivery days
      const savedTwoPersonDays = localStorage.getItem('twoPersonDeliveryDays');
      if (savedTwoPersonDays) {
        try {
          setTwoPersonDays(JSON.parse(savedTwoPersonDays));
        } catch (e) {
          console.error('Failed to parse 2-person delivery days:', e);
        }
      }
      
      // Load intelligent detection setting
      setUseIntelligentDetection(shouldUseIntelligentDetection());
      
      // Load Shepherds schedule
      const savedShepherds = localStorage.getItem('shepherdsSchedule');
      if (savedShepherds) {
        try {
          setShepherdsSchedule(JSON.parse(savedShepherds));
        } catch (e) {
          console.error('Failed to parse Shepherds schedule:', e);
        }
      }
      

    }
    
    loadCorridorPostcodes();
  }, []);
  
  // Helper function to compress individual postcodes to ranges
  const compressPostcodesToRanges = (postcodes) => {
    if (!postcodes || postcodes.length === 0) return [];
    
    const sorted = postcodes.map(p => parseInt(p)).sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? start.toString().padStart(4, '0') : `${start.toString().padStart(4, '0')}-${end.toString().padStart(4, '0')}`);
        start = sorted[i];
        end = sorted[i];
      }
    }
    ranges.push(start === end ? start.toString().padStart(4, '0') : `${start.toString().padStart(4, '0')}-${end.toString().padStart(4, '0')}`);
    
    return ranges;
  };

  const loadCorridorPostcodes = async () => {
    // Load from localStorage/CSV
    await loadCorridors();
    setBrisbanePostcodes(getCorridorPostcodes('brisbane').sort());
    setMelbournePostcodes(getCorridorPostcodes('melbourne').sort());
  };


  const saveTwoPersonDays = () => {
    // Save to localStorage
    localStorage.setItem('twoPersonDeliveryDays', JSON.stringify(twoPersonDays));
    alert('2-Person delivery days saved successfully!');
  };

  const saveZoneRecommendations = async () => {
    try {
      // Save to localStorage (database connection not configured)
      localStorage.setItem('zoneRecommendations', JSON.stringify(zoneRecommendations));
      setIntelligentDetection(useIntelligentDetection);
      
      // Try to save to database if available (optional)
      try {
        // Try to save delivery days
        for (const [zone, days] of Object.entries(zoneRecommendations)) {
          await fetch('/api/zone-recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zone, days })
          });
        }
        console.log('Zone settings saved to database');
      } catch (dbError) {
        console.log('Database not available, using localStorage only');
      }
      
      alert('Zone settings saved successfully!');
    } catch (error) {
      console.error('Error saving zones:', error);
      alert('Failed to save zones. Please try again.');
    }
  };

  const handleAddPostcode = async (corridor) => {
    const postcode = newPostcode[corridor].trim();
    if (postcode && /^\d{4}$/.test(postcode)) {
      // Update localStorage
      addPostcode(corridor, postcode);
      loadCorridorPostcodes();
      setNewPostcode({ ...newPostcode, [corridor]: '' });
      
      // Try to save to database if available (optional)
      try {
        await fetch('/api/corridors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postcode, corridor })
        });
      } catch (error) {
        console.log('Database not available, saved to localStorage only');
      }
    } else {
      alert('Please enter a valid 4-digit postcode');
    }
  };

  const handleRemovePostcode = async (corridor, postcode) => {
    if (confirm(`Remove ${postcode} from ${corridor} corridor?`)) {
      // Update localStorage
      removePostcode(corridor, postcode);
      loadCorridorPostcodes();
      
      // Try to remove from database if available (optional)
      try {
        await fetch(`/api/corridors?postcode=${postcode}&corridor=${corridor}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.log('Database not available, removed from localStorage only');
      }
    }
  };

  const toggleDayForZone = (zone, day) => {
    const current = zoneRecommendations[zone] || [];
    const updated = current.includes(day) 
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    
    setZoneRecommendations({
      ...zoneRecommendations,
      [zone]: updated
    });
  };


  const dayNames = {
    0: 'Sun',
    1: 'Mon', 
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat'
  };
  
  const toggleZoneExpand = (zone) => {
    setExpandedZone(expandedZone === zone ? null : zone);
    setHighlightedMapZone(expandedZone === zone ? null : zone);
  };
  
  const formatZoneName = (zone) => {
    const names = {
      eastern: 'Eastern Suburbs',
      innerWest: 'Inner West',
      western: 'Western Sydney',
      northern: 'Northern Suburbs',
      southern: 'Southern Sydney',
      northWest: 'North West Sydney',
      southWest: 'South West Sydney'
    };
    return names[zone] || zone;
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-brand-primary">ausbeds</span> Admin Panel
            </h1>
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/init-db');
                    if (response.ok) {
                      alert('Database initialized successfully!');
                      window.location.reload();
                    }
                  } catch (error) {
                    alert('Failed to initialize database');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Initialize DB
              </button>
              <Link
                href="/zone-workflow"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Zone Workflow
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Back to Calculator
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('zones')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'zones' 
                    ? 'border-b-2 border-brand-primary text-brand-primary' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Zone Recommendations
              </button>
              <button
                onClick={() => setActiveTab('corridors')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'corridors' 
                    ? 'border-b-2 border-brand-primary text-brand-primary' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Corridor Postcodes
              </button>
              <button
                onClick={() => setActiveTab('checker')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'checker' 
                    ? 'border-b-2 border-brand-primary text-brand-primary' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Zone Checker
              </button>
              <button
                onClick={() => setActiveTab('twoperson')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'twoperson' 
                    ? 'border-b-2 border-brand-primary text-brand-primary' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                2-Person Delivery
              </button>
              <button
                onClick={() => setActiveTab('melbourne')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'melbourne' 
                    ? 'border-b-2 border-brand-primary text-brand-primary' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Melbourne Rules
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'zones' && (
              <div className="space-y-6">
                {/* Suburb Search Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Zone Coverage Search</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter suburb name (e.g., Bondi, Parramatta)"
                      value={searchedSuburb}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const suburb = e.target.value;
                        setSearchedSuburb(suburb);
                        
                        if (suburb.trim()) {
                          const zoneData = getZoneForSuburb(suburb);
                          setSuburbSearchResult(zoneData);
                        } else {
                          setSuburbSearchResult(null);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        setSearchedSuburb('');
                        setSuburbSearchResult(null);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {/* Search Result */}
                  {searchedSuburb && suburbSearchResult && (
                    <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                      <strong>{searchedSuburb}</strong> is in <strong>{suburbSearchResult.name}</strong>
                    </div>
                  )}
                  
                  {searchedSuburb && !suburbSearchResult && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <strong>{searchedSuburb}</strong> is not in any delivery zone
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Zone Delivery Schedule</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Enable or disable zones for each day of the week. Click the zone buttons to toggle delivery availability.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-3 border-b-2 border-gray-300 font-semibold">Day</th>
                        <th className="text-center p-3 border-b-2 border-gray-300">Eastern</th>
                        <th className="text-center p-3 border-b-2 border-gray-300">Northern</th>
                        <th className="text-center p-3 border-b-2 border-gray-300">Western</th>
                        <th className="text-center p-3 border-b-2 border-gray-300">Southern</th>
                        <th className="text-center p-3 border-b-2 border-gray-300">Inner West</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                        <tr key={day} className="border-b border-gray-200">
                          <td className="p-3 font-medium">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day === 0 ? 0 : day]}
                          </td>
                          {['eastern', 'northern', 'western', 'southern', 'innerwest'].map((zone) => (
                            <td key={zone} className="p-3 text-center">
                              <button
                                onClick={() => toggleDayForZone(zone, day)}
                                className={`px-6 py-2 rounded-lg border transition-all ${
                                  (zoneRecommendations[zone] || []).includes(day)
                                    ? 'bg-green-500 text-white border-green-500 shadow-sm'
                                    : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {(zoneRecommendations[zone] || []).includes(day) ? 'ON' : 'OFF'}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-green-900">Zone Detection System</h4>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useIntelligentDetection}
                          onChange={(e) => setUseIntelligentDetection(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-green-800">
                          {useIntelligentDetection ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-green-700">
                      System has comprehensive postcode-to-zone mappings for all Sydney areas.
                      The system has {Object.keys({
                        eastern: getSuburbsForZone('eastern'),
                        innerWest: getSuburbsForZone('innerWest'),
                        western: getSuburbsForZone('western'),
                        northern: getSuburbsForZone('northern'),
                        southern: getSuburbsForZone('southern'),
                        northWest: getSuburbsForZone('northWest'),
                        southWest: getSuburbsForZone('southWest')
                      }).reduce((total, zone) => total + getSuburbsForZone(zone).length, 0)} suburbs mapped across 7 zones.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">Zone Coverage Details</h4>
                    <div className="space-y-2">
                      {['eastern', 'innerWest', 'western', 'northern', 'southern', 'northWest', 'southWest'].map(zone => {
                        const suburbs = getSuburbsForZone(zone);
                        const isExpanded = expandedZone === zone;
                        
                        return (
                          <div key={zone} className="border border-blue-200 rounded-lg bg-white">
                            <button 
                              onClick={() => toggleZoneExpand(zone)}
                              className="w-full px-3 py-2 text-left flex justify-between items-center hover:bg-blue-50 transition-colors"
                            >
                              <span className="font-medium text-sm text-blue-900">
                                {formatZoneName(zone)}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-600">
                                  {suburbs.length} suburbs
                                </span>
                                <svg 
                                  className={`w-4 h-4 text-blue-600 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="px-3 py-3 bg-gray-50 border-t border-blue-200">
                                <div className="text-xs text-gray-700 leading-relaxed">
                                  {suburbs.length > 0 ? (
                                    suburbs.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
                                  ) : (
                                    <span className="text-gray-500 italic">No suburbs mapped</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Sydney Zone Map */}
                    <div className="mt-4">
                      <SydneyZoneMap highlightedZone={highlightedMapZone} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveZoneRecommendations}
                    className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90"
                  >
                    Save Zone Settings
                  </button>
                </div>

              </div>
            )}

            {activeTab === 'corridors' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Corridor Postcode Management</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Manage postcodes for Sydney-Brisbane and Sydney-Melbourne corridors. These postcodes get fixed $190 delivery.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brisbane Corridor */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Sydney-Brisbane Corridor</h4>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Add postcode"
                        value={newPostcode.brisbane}
                        onChange={(e) => setNewPostcode({ ...newPostcode, brisbane: e.target.value })}
                        maxLength="4"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={() => handleAddPostcode('brisbane')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Add
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {brisbanePostcodes.map((postcode) => (
                        <div key={postcode} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
                          <span className="text-sm">{postcode}</span>
                          <button
                            onClick={() => handleRemovePostcode('brisbane', postcode)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {brisbanePostcodes.length === 0 && (
                        <p className="text-sm text-gray-500">No postcodes added</p>
                      )}
                    </div>
                  </div>

                  {/* Melbourne Corridor */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Sydney-Melbourne Corridor</h4>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Add postcode"
                        value={newPostcode.melbourne}
                        onChange={(e) => setNewPostcode({ ...newPostcode, melbourne: e.target.value })}
                        maxLength="4"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={() => handleAddPostcode('melbourne')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Add
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {melbournePostcodes.map((postcode) => (
                        <div key={postcode} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
                          <span className="text-sm">{postcode}</span>
                          <button
                            onClick={() => handleRemovePostcode('melbourne', postcode)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {melbournePostcodes.length === 0 && (
                        <p className="text-sm text-gray-500">No postcodes added</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'melbourne' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Melbourne Delivery - Shepherds Transport</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Melbourne deliveries are handled by Shepherds Transport with weekly pickup/delivery service.
                  </p>
                </div>

                {/* Shepherds Schedule Configuration */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h4 className="font-medium text-green-900 mb-4">Configure Shepherds Schedule</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sydney Pickup Day
                      </label>
                      <select
                        value={shepherdsSchedule.pickupDay}
                        onChange={(e) => setShepherdsSchedule({...shepherdsSchedule, pickupDay: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {[1,2,3,4,5].map(day => (
                          <option key={day} value={day}>
                            {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][day]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Melbourne Delivery Day
                      </label>
                      <select
                        value={shepherdsSchedule.deliveryDay}
                        onChange={(e) => setShepherdsSchedule({...shepherdsSchedule, deliveryDay: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {[1,2,3,4,5].map(day => (
                          <option key={day} value={day}>
                            {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][day]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem('shepherdsSchedule', JSON.stringify(shepherdsSchedule));
                      alert('Shepherds schedule saved successfully!');
                    }}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Schedule
                  </button>
                </div>

                {/* Shepherds Service Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-medium text-blue-900 mb-4">Shepherds Transport Service</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <span className="text-blue-600">📅</span>
                      <div>
                        <p className="font-medium text-gray-800">Current Schedule:</p>
                        <p className="text-gray-600">
                          {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][shepherdsSchedule.pickupDay]} pickup from Marrickville → {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][shepherdsSchedule.deliveryDay]} delivery to Melbourne
                        </p>
                      </div>
                </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-blue-600">💰</span>
                      <div>
                        <p className="font-medium text-gray-800">Fixed Price:</p>
                        <p className="text-gray-600">$190 per delivery (includes pickup and transport)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-blue-600">⏰</span>
                      <div>
                        <p className="font-medium text-gray-800">Order Cutoff:</p>
                        <p className="text-gray-600">Monday 5 PM for current week&apos;s delivery</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-blue-600">📍</span>
                      <div>
                        <p className="font-medium text-gray-800">Coverage:</p>
                        <p className="text-gray-600">Most Melbourne metro postcodes (3000-3199)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-blue-600">ℹ️</span>
                      <div>
                        <p className="font-medium text-gray-800">Flexibility:</p>
                        <p className="text-gray-600">Schedule may vary by 1-2 days based on load and route optimization</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-medium text-yellow-900 mb-3">Important Notes</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Pickup occurs from Ausbeds Marrickville warehouse</li>
                    <li>• Delivery direct to customer&apos;s Melbourne address</li>
                    <li>• Schedule automatically updates weekly</li>
                    <li>• Bulk orders may qualify for priority scheduling</li>
                    <li>• Customer will see next available delivery date when checking availability</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'checker' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Zone Checker Tool</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Test which zone any postcode belongs to. This tool helps you verify zone detection for Sydney postcodes.
                  </p>
                </div>
                <ZoneChecker />
              </div>
            )}

            {activeTab === 'twoperson' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">2-Person Delivery Configuration</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure which days of the week 2-person delivery service is available in Sydney.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium mb-4">Available Days for 2-Person Delivery</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { value: 1, label: 'Monday' },
                      { value: 2, label: 'Tuesday' },
                      { value: 3, label: 'Wednesday' },
                      { value: 4, label: 'Thursday' },
                      { value: 5, label: 'Friday' },
                      { value: 6, label: 'Saturday' },
                      { value: 0, label: 'Sunday' }
                    ].map((day) => (
                      <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={twoPersonDays.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTwoPersonDays([...twoPersonDays, day.value].sort());
                            } else {
                              setTwoPersonDays(twoPersonDays.filter(d => d !== day.value));
                            }
                          }}
                          className="w-5 h-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Currently selected:</strong> {
                          twoPersonDays.length === 0 ? 'No days selected' :
                          twoPersonDays.map(day => {
                            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            return dayNames[day];
                          }).join(', ')
                        }
                      </p>
                    </div>
                    
                    <button
                      onClick={saveTwoPersonDays}
                      className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                    >
                      Save 2-Person Delivery Days
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;