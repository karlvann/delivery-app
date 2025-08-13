// Check for missing Sydney metropolitan postcodes
const sydneyZones = require('./src/data/sydney-zones.json');

// Get all mapped postcodes
const mappedPostcodes = new Set();
Object.values(sydneyZones).forEach(zone => {
  zone.postcodes.forEach(pc => mappedPostcodes.add(pc));
});

console.log(`Total mapped postcodes: ${mappedPostcodes.size}\n`);

// Common Sydney metropolitan postcodes that might be missing
// Based on Sydney's typical postcode range (2000-2234, 2555-2574, 2745-2770)
const checkRanges = [
  { start: 2000, end: 2234, name: 'Sydney Metro' },
  { start: 2555, end: 2574, name: 'South West Sydney' },
  { start: 2745, end: 2770, name: 'Western Sydney' }
];

const missingPostcodes = [];
const mappedList = [];

checkRanges.forEach(range => {
  for (let i = range.start; i <= range.end; i++) {
    const postcode = i.toString().padStart(4, '0');
    if (mappedPostcodes.has(postcode)) {
      mappedList.push(postcode);
    } else {
      missingPostcodes.push({ postcode, area: range.name });
    }
  }
});

console.log('=== Missing Postcodes from Sydney Metro Area ===\n');

// Group missing by area
const missingByArea = {};
missingPostcodes.forEach(item => {
  if (!missingByArea[item.area]) {
    missingByArea[item.area] = [];
  }
  missingByArea[item.area].push(item.postcode);
});

Object.entries(missingByArea).forEach(([area, postcodes]) => {
  console.log(`${area}: ${postcodes.length} missing`);
  
  // Show first 20 missing postcodes
  const sample = postcodes.slice(0, 20);
  console.log(`  Missing: ${sample.join(', ')}${postcodes.length > 20 ? '...' : ''}`);
  console.log('');
});

// Check some specific important postcodes
console.log('=== Checking Specific Important Postcodes ===\n');
const importantPostcodes = [
  { pc: '2000', name: 'Sydney CBD' },
  { pc: '2037', name: 'Glebe' },
  { pc: '2060', name: 'North Sydney' },
  { pc: '2067', name: 'Chatswood' },
  { pc: '2089', name: 'Neutral Bay' },
  { pc: '2150', name: 'Parramatta' },
  { pc: '2200', name: 'Bankstown' },
  { pc: '2217', name: 'Kogarah' },
  { pc: '2230', name: 'Cronulla' },
  { pc: '2250', name: 'Gosford (Central Coast)' },
  { pc: '2560', name: 'Campbelltown' },
  { pc: '2570', name: 'Camden' },
  { pc: '2750', name: 'Penrith' },
  { pc: '2760', name: 'St Marys' },
  { pc: '2145', name: 'Westmead' },
  { pc: '2114', name: 'West Ryde' },
  { pc: '2120', name: 'Thornleigh' },
  { pc: '2122', name: 'Eastwood' }
];

importantPostcodes.forEach(item => {
  const found = mappedPostcodes.has(item.pc);
  console.log(`${item.pc} (${item.name}): ${found ? '✅ Mapped' : '❌ Missing'}`);
});

// Suggest which missing postcodes should be added
console.log('\n=== Recommended Postcodes to Add ===\n');

const recommendedMissing = [
  { postcodes: ['2114', '2115', '2116', '2117', '2118', '2119', '2120', '2121', '2122', '2123', '2124', '2125', '2126'], zone: 'northern', area: 'Ryde/Eastwood area' },
  { postcodes: ['2127', '2128', '2129'], zone: 'innerwest', area: 'Wentworth Point/Olympic Park' },
  { postcodes: ['2137', '2138', '2139'], zone: 'innerwest', area: 'Concord/Mortlake' },
  { postcodes: ['2180', '2181', '2182', '2183', '2184', '2185', '2186', '2187', '2188', '2189'], zone: 'western', area: 'Moorebank/Lurnea' },
  { postcodes: ['2555', '2556', '2557', '2558', '2559', '2560', '2563', '2564', '2565', '2566', '2567', '2568', '2569', '2570', '2571', '2572', '2573', '2574'], zone: 'southern', area: 'Campbelltown/Camden' }
];

recommendedMissing.forEach(rec => {
  console.log(`${rec.area}:`);
  console.log(`  Postcodes: ${rec.postcodes.join(', ')}`);
  console.log(`  Suggested zone: ${rec.zone}`);
  console.log('');
});