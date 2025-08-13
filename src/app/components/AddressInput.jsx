import React, { useEffect, useRef } from 'react';
import { initializeAutocomplete } from '../services/googleMapsService';

function AddressInput({ onAddressChange, value, onChange, error, placeholder = "Enter your delivery address", autoFocus = false, minimal = false }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (inputRef.current && !autocompleteRef.current) {
      initializeAutocomplete(inputRef.current, (address) => {
        onChange(address);
        onAddressChange(address);
      }).then(autocomplete => {
        autocompleteRef.current = autocomplete;
      }).catch(err => {
        console.error('Failed to initialize autocomplete:', err);
      });
    }
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    onAddressChange('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && value) {
      onAddressChange(value);
    }
  };

  if (minimal) {
    return (
      <div className="relative flex items-center">
        <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-10 py-3 text-lg bg-transparent border-0 focus:outline-none placeholder-gray-400"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
        Delivery Address
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="address"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full px-4 py-3 rounded-lg border ${
            error 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-200 focus:ring-brand-primary focus:border-brand-primary'
          } focus:outline-none focus:ring-2 transition-all duration-200`}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      <p className="text-xs text-gray-500">
        Start typing to see address suggestions
      </p>
    </div>
  );
}

export default AddressInput;
