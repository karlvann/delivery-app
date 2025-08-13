#!/usr/bin/env node

// Test runner for delivery calculator
// This runs server-side tests

const { extractPostcode } = require('./src/app/components/postcodeService.js');

console.log('🔥 DELIVERY CALCULATOR TEST RUNNER 🔥\n');

// Test postcode extraction
const testAddresses = [
  { address: '1 Macquarie Street, Sydney NSW 2000', expected: '2000' },
  { address: '123 Main St, Coffs Harbour NSW 2450', expected: '2450' },
  { address: '1 Collins Street, Melbourne VIC 3000', expected: '3000' },
  { address: '123 Main St, Marrickville NSW 2204', expected: '2204' },
];

console.log('Testing postcode extraction:');
testAddresses.forEach(test => {
  const result = extractPostcode(test.address);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`  ${status} "${test.address}" -> ${result} (expected: ${test.expected})`);
});

console.log('\nNote: For full testing, visit:');
console.log('  - Main app: http://localhost:5180');
console.log('  - Validation: http://localhost:5180/validate');
console.log('  - Admin: http://localhost:5180/admin');