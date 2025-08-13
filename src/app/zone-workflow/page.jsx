'use client';

export default function ZoneWorkflowPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Zone Detection Workflow</h1>
        
        {/* Main Workflow */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="space-y-8">
            
            {/* Step 1: Address Input */}
            <div className="relative">
              <div className="flex items-center">
                <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">1</div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold">User Enters Address</h3>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Google Places API</p>
                      <p className="text-xs text-blue-700 mt-1">Autocomplete suggestions</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Parse Components</p>
                      <p className="text-xs text-blue-700 mt-1">Street, suburb, state, postcode</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Extract Postcode</p>
                      <p className="text-xs text-blue-700 mt-1">Required for zone detection</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-5 border-l-2 border-gray-300 h-8"></div>
            </div>

            {/* Step 2: Corridor Check */}
            <div className="relative">
              <div className="flex items-center">
                <div className="bg-yellow-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">2</div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold">Check Corridor Status</h3>
                  <p className="text-sm text-gray-600 mb-3">Priority check - overrides local delivery</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 border-2 border-yellow-300 p-3 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900">Sydney-Brisbane</p>
                      <p className="text-lg font-bold text-yellow-600 mt-1">$190 Fixed</p>
                    </div>
                    <div className="bg-yellow-50 border-2 border-yellow-300 p-3 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900">Sydney-Melbourne</p>
                      <p className="text-lg font-bold text-yellow-600 mt-1">$190 Fixed</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Not Corridor</p>
                      <p className="text-xs text-gray-600 mt-1">Continue to city detection</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-5 border-l-2 border-gray-300 h-8"></div>
            </div>

            {/* Step 3: City Detection */}
            <div className="relative">
              <div className="flex items-center">
                <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">3</div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold">Detect City from State</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-300 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-900">NSW → Sydney</p>
                      <p className="text-xs text-green-700 mt-2">Warehouse: Marrickville</p>
                      <p className="text-xs text-green-600 mt-1">• Zone detection available</p>
                      <p className="text-xs text-green-600">• Two-person service</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-300 p-4 rounded-lg">
                      <p className="text-sm font-medium text-orange-900">QLD → Brisbane</p>
                      <p className="text-xs text-orange-700 mt-2">Warehouse: Brisbane</p>
                      <p className="text-xs text-orange-600 mt-1">• Local delivery only</p>
                      <p className="text-xs text-orange-600">• No zone system</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-300 p-4 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">VIC → Melbourne</p>
                      <p className="text-xs text-purple-700 mt-2">Warehouse: Melbourne</p>
                      <p className="text-xs text-purple-600 mt-1">• Local delivery only</p>
                      <p className="text-xs text-purple-600">• Shepherds Transport</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-5 border-l-2 border-gray-300 h-8"></div>
            </div>

            {/* Step 4: Sydney Zone Mapping */}
            <div className="relative">
              <div className="flex items-center">
                <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">4</div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold">Sydney Zone Detection</h3>
                  <p className="text-sm text-gray-600 mb-3">Map postcode to delivery zone</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                      <p className="text-sm font-medium text-indigo-900">Eastern</p>
                      <p className="text-xs text-indigo-600 mt-1">Mon, Tue, Wed</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                      <p className="text-sm font-medium text-indigo-900">Western</p>
                      <p className="text-xs text-indigo-600 mt-1">Wed, Thu, Fri</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                      <p className="text-sm font-medium text-indigo-900">Northern</p>
                      <p className="text-xs text-indigo-600 mt-1">Tue, Wed, Thu</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                      <p className="text-sm font-medium text-indigo-900">Southern</p>
                      <p className="text-xs text-indigo-600 mt-1">Mon, Wed, Fri</p>
                    </div>
                  </div>
                  
                  {/* Day Availability Logic */}
                  <div className="mt-4 bg-amber-50 border border-amber-300 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-amber-900 mb-2">Day Availability Check Logic</h4>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-amber-600 mr-2">1.</span>
                        <p className="text-xs text-amber-800">Get zone from postcode (e.g., 2000 → Eastern)</p>
                      </div>
                      <div className="flex items-start">
                        <span className="text-amber-600 mr-2">2.</span>
                        <p className="text-xs text-amber-800">Load zone days from localStorage/admin settings</p>
                      </div>
                      <div className="flex items-start">
                        <span className="text-amber-600 mr-2">3.</span>
                        <p className="text-xs text-amber-800">Check if selected day is in zone's available days array</p>
                      </div>
                      <div className="flex items-start">
                        <span className="text-amber-600 mr-2">4.</span>
                        <p className="text-xs text-amber-800">If no zone match → Default to Tue/Wed/Thu</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 bg-blue-100 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Two-Person Service Check</p>
                    <p className="text-xs text-blue-700 mt-1">Available Tue/Wed/Thu only • $50 base + $2.50/km after 15km</p>
                    <p className="text-xs text-blue-600 mt-1">Must overlap with zone days to be offered</p>
                  </div>
                </div>
              </div>
              <div className="ml-5 border-l-2 border-gray-300 h-8"></div>
            </div>

            {/* Step 5: Distance & Pricing */}
            <div className="relative">
              <div className="flex items-center">
                <div className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">5</div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold">Calculate Distance & Apply Pricing</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                      <p className="text-sm font-medium text-green-900">0-15km</p>
                      <p className="text-lg font-bold text-green-600">FREE</p>
                      <p className="text-xs text-green-700 mt-1">Standard delivery</p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
                      <p className="text-sm font-medium text-yellow-900">15-110km</p>
                      <p className="text-lg font-bold text-yellow-600">$2/km</p>
                      <p className="text-xs text-yellow-700 mt-1">Standard: $2/km</p>
                      <p className="text-xs text-yellow-700">Two-person: $2.50/km</p>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg border border-red-300">
                      <p className="text-sm font-medium text-red-900">Over 110km</p>
                      <p className="text-lg font-bold text-red-600">N/A</p>
                      <p className="text-xs text-red-700 mt-1">Not available</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-5 border-l-2 border-gray-300 h-8"></div>
            </div>

            {/* Step 6: Final Quote */}
            <div className="relative">
              <div className="flex items-center">
                <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">✓</div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold">Display Final Quote</h3>
                  <div className="mt-3 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Delivery Fee</p>
                        <p className="text-xs text-gray-600">Calculated price</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Available Days</p>
                        <p className="text-xs text-gray-600">Based on zone/service</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Service Type</p>
                        <p className="text-xs text-gray-600">Standard/Two-person/Corridor</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Zone Day Matrix */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Zone Delivery Day Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Zone</th>
                  <th className="border border-gray-300 p-2 text-center">Mon</th>
                  <th className="border border-gray-300 p-2 text-center">Tue</th>
                  <th className="border border-gray-300 p-2 text-center">Wed</th>
                  <th className="border border-gray-300 p-2 text-center">Thu</th>
                  <th className="border border-gray-300 p-2 text-center">Fri</th>
                  <th className="border border-gray-300 p-2 text-center">Sat</th>
                  <th className="border border-gray-300 p-2 text-center">Sun</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Eastern</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Western</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Northern</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium">Southern</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center bg-green-100">✓</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 p-2 font-medium">Two-Person</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center bg-blue-200">✓</td>
                  <td className="border border-gray-300 p-2 text-center bg-blue-200">✓</td>
                  <td className="border border-gray-300 p-2 text-center bg-blue-200">✓</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 bg-yellow-50 border border-yellow-300 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">Day Checking Process</h4>
            <code className="text-xs bg-white p-2 rounded block overflow-x-auto">
              {`// 1. Get zone from postcode
const zone = getZoneForPostcode(postcode); // e.g., "eastern"

// 2. Load zone settings from localStorage
const zoneRecommendations = JSON.parse(
  localStorage.getItem('zoneRecommendations')
);

// 3. Get available days for zone
const availableDays = zoneRecommendations[zone] || [2,3,4]; // Default Tue/Wed/Thu

// 4. Check if user's selected day is available
const isDayAvailable = availableDays.includes(selectedDay);

// 5. For two-person service, check overlap
const twoPersonDays = [2,3,4]; // Tue/Wed/Thu
const canOfferTwoP erson = availableDays.some(day => 
  twoPersonDays.includes(day)
);`}
            </code>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Decision Priority</h2>
            <ol className="space-y-2">
              <li className="flex items-start">
                <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                <div>
                  <p className="font-medium">Corridor Check</p>
                  <p className="text-sm text-gray-600">Always takes precedence - $190 fixed</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                <div>
                  <p className="font-medium">Zone Detection</p>
                  <p className="text-sm text-gray-600">Sydney only - determines delivery days</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                <div>
                  <p className="font-medium">Distance Calculation</p>
                  <p className="text-sm text-gray-600">Google Maps API from nearest warehouse</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Data Sources</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <div>
                  <p className="font-medium">sydney-zones.json</p>
                  <p className="text-sm text-gray-600">Postcode to zone mapping</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <div>
                  <p className="font-medium">localStorage</p>
                  <p className="text-sm text-gray-600">Corridor postcodes, zone settings</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <div>
                  <p className="font-medium">Google Maps API</p>
                  <p className="text-sm text-gray-600">Distance calculations, geocoding</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}