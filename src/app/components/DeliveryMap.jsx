import React, { useEffect, useRef } from 'react';
import { createDeliveryMap } from '../services/googleMapsService';

function DeliveryMap({ customerAddress }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    console.log('DeliveryMap useEffect - customerAddress:', customerAddress);
    console.log('DeliveryMap useEffect - mapRef.current:', mapRef.current);
    
    if (customerAddress && mapRef.current) {
      console.log('Creating delivery map for:', customerAddress);
      createDeliveryMap(mapRef.current, customerAddress)
        .then(result => {
          console.log('Map created successfully:', result);
          mapInstanceRef.current = result;
        })
        .catch(err => {
          console.error('Failed to create map:', err);
          // Show a fallback message in the map container
          if (mapRef.current) {
            mapRef.current.innerHTML = `
              <div class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <div class="text-center p-6">
                  <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <p class="font-medium text-gray-900 mb-1">Map temporarily unavailable</p>
                  <p class="text-sm text-gray-600">Google Geocoding API needs to be enabled</p>
                  <p class="text-xs text-gray-500 mt-2">Delivery calculation is working correctly</p>
                </div>
              </div>
            `;
          }
        });
    }
  }, [customerAddress]);

  if (!customerAddress) {
    return (
      <div className="bg-gradient-to-br from-pastel-blue to-pastel-green rounded-lg p-8 border border-gray-200">
        <div className="text-center">
          <svg className="w-12 h-12 text-brand-primary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-600 font-medium">Delivery route will appear here</p>
          <p className="text-sm text-gray-500 mt-1">Enter an address to see the route from our warehouse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Delivery Route</h3>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-brand-primary rounded-full"></div>
            <span className="text-gray-600">Warehouse</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-brand-accent rounded-full"></div>
            <span className="text-gray-600">Delivery</span>
          </div>
        </div>
      </div>
      <div 
        ref={mapRef}
        className="w-full h-96 rounded-lg border border-gray-200 shadow-sm"
      />
      <p className="text-xs text-gray-500 text-center">
        Route from 136 Victoria Road, Marrickville NSW to your delivery address
      </p>
    </div>
  );
}

export default DeliveryMap;
