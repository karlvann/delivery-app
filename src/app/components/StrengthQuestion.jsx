'use client';

import React, { useState } from 'react';

function StrengthQuestion({ onAnswer }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelection = (option) => {
    setSelectedOption(option);
    onAnswer(option);
  };

  const strengthOptions = [
    {
      value: 5,
      label: '5 - I can lift a human over my head',
      letter: 'A'
    },
    {
      value: 3,
      label: '3 - I have a physical job that requires frequent lifting',
      letter: 'B'
    },
    {
      value: 2,
      label: '2 - I sometimes lift things when I\'m working',
      letter: 'C'
    },
    {
      value: 1,
      label: '1 - I don\'t go to the gym, and my job requires no lifting',
      letter: 'D'
    },
    {
      value: 0,
      label: '0 - I can lift my cup of tea',
      letter: 'E'
    }
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Which of these best describes your strength level?
          <span className="text-red-500 ml-1">*</span>
        </h3>
      </div>

      <div className="space-y-3">
        {strengthOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelection(option)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedOption?.value === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center w-8 h-8 rounded font-semibold text-sm ${
                selectedOption?.value === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {option.letter}
              </span>
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

export default StrengthQuestion;