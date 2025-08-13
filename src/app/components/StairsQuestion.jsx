'use client';

import React, { useState } from 'react';

function StairsQuestion({ onAnswer }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelection = (option) => {
    setSelectedOption(option);
    onAnswer(option);
  };

  const stairsOptions = [
    {
      value: 'none',
      label: 'No stairs',
      icon: '🏠'
    },
    {
      value: 'few',
      label: 'A few steps',
      icon: '📦'
    },
    {
      value: 'one_flight',
      label: '1 flight of stairs',
      icon: '🏢'
    },
    {
      value: 'multiple_flights',
      label: 'More than 1 flight of stairs',
      icon: '🏗️'
    }
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Do we need to bring the mattress up stairs?
          <span className="text-red-500 ml-1">*</span>
        </h3>
        <p className="text-sm text-gray-600">
          (or down stairs) - This helps us determine if you need additional delivery assistance.
        </p>
      </div>

      <div className="space-y-3">
        {stairsOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelection(option)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedOption?.value === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}

export default StairsQuestion;