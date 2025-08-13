import { useState } from 'react';

// Custom hook to manage delivery state - like a prep station for all your ingredients
export function useDeliveryState() {
  // Core delivery data - the main course
  const [delivery, setDelivery] = useState({
    address: '',
    city: null,
    postcode: null,
    zone: null,
    distance: null,
    corridor: null,
    fee: null,
    type: null
  });

  // UI state - the garnish
  const [ui, setUi] = useState({
    loading: false,
    error: '',
    showMap: false,
    showZoneInfo: false
  });

  // Customer options - the order modifications
  const [options, setOptions] = useState({
    twoPerson: false,
    deliveryDay: null,
    stairs: null,
    strength: null
  });

  // Update functions - the cooking methods
  const updateDelivery = (updates) => {
    setDelivery(prev => ({ ...prev, ...updates }));
  };

  const updateUI = (updates) => {
    setUi(prev => ({ ...prev, ...updates }));
  };

  const updateOptions = (updates) => {
    setOptions(prev => ({ ...prev, ...updates }));
  };

  const reset = () => {
    setDelivery({
      address: '',
      city: null,
      postcode: null,
      zone: null,
      distance: null,
      corridor: null,
      fee: null,
      type: null
    });
    setUi({
      loading: false,
      error: '',
      showMap: false,
      showZoneInfo: false
    });
    setOptions({
      twoPerson: false,
      deliveryDay: null,
      stairs: null,
      strength: null
    });
  };

  return {
    delivery,
    ui,
    options,
    updateDelivery,
    updateUI,
    updateOptions,
    reset
  };
}