#!/usr/bin/env node

// Test program to check if suburbs are in the zones
const sydneyZones = require('./src/data/sydney-zones.json');

// Test suburbs we know should be in zones
const testSuburbs = [
  'Bankstown',
  'Bondi',
  'Parramatta',
  'Chatswood',
  'Manly',
  'Cronulla',
  'Liverpool',
  'Penrith',
  'Randwick',
  'Newtown'
];

console.log('🔥 TESTING SUBURB LOOKUP IN ZONES\n');
console.log('='.repeat(50));

function findSuburbInZones(suburbName) {
  const cleanSuburb = suburbName.toLowerCase().trim();
  
  for (const [zoneKey, zoneData] of Object.entries(sydneyZones)) {
    if (!zoneData.suburbs) {
      console.log(`⚠️  Zone ${zoneKey} has NO suburbs array!`);
      continue;
    }
    
    const found = zoneData.suburbs.find(s => 
      s.toLowerCase() === cleanSuburb
    );
    
    if (found) {
      return {
        zone: zoneData.name,
        zoneKey: zoneKey,
        exactMatch: found
      };
    }
  }
  
  return null;
}

// Test each suburb
testSuburbs.forEach(suburb => {
  const result = findSuburbInZones(suburb);
  
  if (result) {
    console.log(`✅ ${suburb.padEnd(15)} → ${result.zone}`);
  } else {
    console.log(`❌ ${suburb.padEnd(15)} → NOT FOUND IN ANY ZONE!`);
  }
});

// Also check what zones exist and how many suburbs each has
console.log('\n' + '='.repeat(50));
console.log('ZONE SUMMARY:\n');

Object.entries(sydneyZones).forEach(([key, data]) => {
  const suburbCount = data.suburbs ? data.suburbs.length : 0;
  const postcodeCount = data.postcodes ? data.postcodes.length : 0;
  
  console.log(`${key.padEnd(12)} - ${data.name}`);
  console.log(`              Suburbs: ${suburbCount}, Postcodes: ${postcodeCount}`);
  
  if (suburbCount === 0) {
    console.log(`              ⚠️  WARNING: No suburbs in this zone!`);
  }
});

// Let's also test the actual function from zoneService
console.log('\n' + '='.repeat(50));
console.log('TESTING ACTUAL getZoneForSuburb FUNCTION:\n');

const { getZoneForSuburb } = require('./src/app/components/zoneService');

testSuburbs.forEach(suburb => {
  const result = getZoneForSuburb(suburb);
  
  if (result) {
    console.log(`✅ ${suburb.padEnd(15)} → ${result.name}`);
  } else {
    console.log(`❌ ${suburb.padEnd(15)} → NOT FOUND!`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('TEST COMPLETE!');