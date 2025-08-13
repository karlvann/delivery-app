'use client';

import React, { useState } from 'react';
import { getSuburbsForZone } from './zoneDetectionService';

const ZONE_INFO = {
  eastern: {
    name: 'Eastern Suburbs',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🏖️',
    description: 'Beaches and eastern areas',
    examples: ['Bondi', 'Coogee', 'Randwick', 'Maroubra', 'Double Bay']
  },
  innerWest: {
    name: 'Inner West',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '🏘️',
    description: 'Inner western suburbs',
    examples: ['Marrickville', 'Newtown', 'Balmain', 'Leichhardt', 'Annandale']
  },
  western: {
    name: 'Western Sydney',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🏭',
    description: 'Greater western region',
    examples: ['Parramatta', 'Blacktown', 'Auburn', 'Fairfield', 'Liverpool']
  },
  northern: {
    name: 'Northern Suburbs',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🌊',
    description: 'North Shore & Northern Beaches',
    examples: ['Chatswood', 'Manly', 'Mosman', 'North Sydney', 'Dee Why']
  },
  southern: {
    name: 'Southern Sydney',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🏖️',
    description: 'Sutherland Shire & St George',
    examples: ['Sutherland', 'Cronulla', 'Hurstville', 'Kogarah', 'Miranda']
  },
  northWest: {
    name: 'North West Sydney',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '🏡',
    description: 'Hills District & surrounds',
    examples: ['Castle Hill', 'Baulkham Hills', 'Rouse Hill', 'Kellyville']
  },
  southWest: {
    name: 'South West Sydney',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '🏘️',
    description: 'Macarthur & Liverpool region',
    examples: ['Campbelltown', 'Camden', 'Oran Park', 'Penrith']
  }
};

function ZoneInfoSection({ currentZone }) {
  const [expandedZone, setExpandedZone] = useState(null);
  const [showAllSuburbs, setShowAllSuburbs] = useState({});

  const toggleZone = (zone) => {
    setExpandedZone(expandedZone === zone ? null : zone);
  };

  const toggleShowAll = (zone) => {
    setShowAllSuburbs(prev => ({ ...prev, [zone]: !prev[zone] }));
  };

  return (
    <div className="mt-12">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sydney Delivery Zones
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          Our system automatically identifies your delivery zone based on your postcode. 
          Zones help us optimize delivery routes and scheduling across Sydney metropolitan area.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Object.entries(ZONE_INFO).map(([zoneKey, zone]) => {
            const isCurrentZone = currentZone === zoneKey;
            const isExpanded = expandedZone === zoneKey;
            const suburbs = getSuburbsForZone(zoneKey);
            const showAll = showAllSuburbs[zoneKey];
            const displaySuburbs = showAll ? suburbs : suburbs.slice(0, 8);
            
            return (
              <div key={zoneKey} className="relative">
                <button
                  onClick={() => toggleZone(zoneKey)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isCurrentZone 
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{zone.icon}</span>
                        <h4 className="font-medium text-sm text-gray-900">
                          {zone.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {zone.description}
                      </p>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          Examples: {zone.examples.slice(0, 3).join(', ')}...
                        </p>
                      </div>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isCurrentZone && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Your Zone
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h5 className="font-medium text-xs text-gray-700 mb-2">
                      All suburbs in {zone.name} ({suburbs.length} suburbs):
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {displaySuburbs.map((suburb, idx) => (
                        <span 
                          key={idx}
                          className={`inline-block px-2 py-1 text-xs rounded-md ${zone.color} border`}
                        >
                          {suburb.charAt(0).toUpperCase() + suburb.slice(1)}
                        </span>
                      ))}
                    </div>
                    {suburbs.length > 8 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleShowAll(zoneKey);
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showAll ? 'Show less' : `Show all ${suburbs.length} suburbs`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">Comprehensive Zone Coverage</h4>
              <p className="text-xs text-blue-700 mt-1">
                Our delivery system covers all Sydney postcodes, automatically identifying your 
                zone for accurate pricing and scheduling. Each zone has specific delivery days 
                to ensure efficient service across the Sydney metropolitan area.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Corridor Deliveries</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Sydney-Brisbane Corridor</span>
                <span className="font-bold text-blue-600">$190 fixed</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Sydney-Melbourne Corridor</span>
                <span className="font-bold text-blue-600">$190 fixed</span>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Local Delivery Rates</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">First 15km</span>
                <span className="font-bold text-green-600">FREE</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">After 15km</span>
                <span className="font-bold text-gray-700">$2/km total distance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZoneInfoSection;