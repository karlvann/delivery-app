// Check why postcode 2037 is not detected

// Mock localStorage
const localStorage = {
  storage: {},
  setItem(key, value) {
    this.storage[key] = value;
  },
  getItem(key) {
    return this.storage[key] || null;
  }
};

// Set default zone configurations
const zonePostcodes = {
  eastern: ['2000-2050', '2060-2108'],
  western: ['2140-2200', '2745-2770'],
  northern: ['2060-2090', '2099-2107'],
  southern: ['2220-2234', '2500-2540']
};

localStorage.setItem('zonePostcodes', JSON.stringify(zonePostcodes));

// Zone detection function
function getPostcodeZone(postcode) {
  if (!postcode) return null;
  
  const saved = localStorage.getItem('zonePostcodes');
  const zones = saved ? JSON.parse(saved) : {};
  const postcodeNum = parseInt(postcode);
  
  console.log(`Checking postcode ${postcode} (numeric: ${postcodeNum})`);
  console.log('Zone configurations:', zones);
  
  for (const [zone, ranges] of Object.entries(zones)) {
    console.log(`\nChecking zone "${zone}" with ranges:`, ranges);
    
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        console.log(`  Range ${start}-${end}: is ${postcodeNum} between? ${postcodeNum >= start && postcodeNum <= end}`);
        
        if (postcodeNum >= start && postcodeNum <= end) {
          console.log(`  ✅ FOUND! ${postcode} is in zone "${zone}"`);
          return zone;
        }
      } else if (range === postcode) {
        console.log(`  Exact match check: ${range} === ${postcode}? ${range === postcode}`);
        if (range === postcode) {
          console.log(`  ✅ FOUND! ${postcode} is in zone "${zone}" (exact match)`);
          return zone;
        }
      }
    }
  }
  
  console.log(`\n❌ Postcode ${postcode} not found in any zone`);
  return null;
}

// Test postcode 2037
console.log('=== Testing Postcode 2037 ===\n');
const zone = getPostcodeZone('2037');
console.log(`\nResult: Zone = ${zone || 'not detected'}`);

// Also test boundary cases
console.log('\n=== Testing Boundary Cases ===');
const testCases = ['2000', '2037', '2050', '2051', '2059', '2060'];
testCases.forEach(pc => {
  const z = getPostcodeZone(pc);
  console.log(`Postcode ${pc}: ${z || 'not detected'}`);
});