// Test validation script for delivery calculator
// Run this in the browser console at http://localhost:5180

console.log('🔥 GORDON\'S DELIVERY CALCULATOR VALIDATION REPORT 🔥\n');
console.log('=' .repeat(60));

// Check zone recommendations in localStorage
console.log('\n📍 ZONE RECOMMENDATIONS CHECK:');
const zoneRecs = localStorage.getItem('zoneRecommendations');
if (zoneRecs) {
  const recommendations = JSON.parse(zoneRecs);
  console.log('Zone delivery days configured:');
  Object.entries(recommendations).forEach(([zone, days]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStrings = days.map(d => dayNames[d]).join(', ');
    console.log(`  ${zone}: [${dayStrings}]`);
  });
} else {
  console.log('❌ NO zone recommendations found in localStorage!');
}

// Check corridor postcodes
console.log('\n🚚 CORRIDOR POSTCODES CHECK:');
const sydBris = localStorage.getItem('syd-bris-corridor');
const sydMelb = localStorage.getItem('syd-melb-corridor');
console.log('Sydney-Brisbane corridor postcodes:', sydBris ? JSON.parse(sydBris).length + ' postcodes' : 'NOT FOUND');
console.log('Sydney-Melbourne corridor postcodes:', sydMelb ? JSON.parse(sydMelb).length + ' postcodes' : 'NOT FOUND');

// Check two-person delivery days
console.log('\n👥 TWO-PERSON DELIVERY DAYS:');
const twoPersonDays = localStorage.getItem('twoPersonDeliveryDays');
if (twoPersonDays) {
  const days = JSON.parse(twoPersonDays);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  console.log('Days:', days.map(d => dayNames[d]).join(', '));
} else {
  console.log('Using default: Tue, Wed, Thu');
}

// Test addresses
console.log('\n🏠 TEST ADDRESS RESULTS:');
console.log('To test, enter these addresses in the calculator:');
console.log('1. Sydney CBD: "1 Macquarie Street, Sydney NSW 2000"');
console.log('2. Coffs Harbour (corridor): "123 Main St, Coffs Harbour NSW 2450"');
console.log('3. Melbourne: "1 Collins Street, Melbourne VIC 3000"');
console.log('4. Inner West Sydney: "123 Main St, Marrickville NSW 2204"');

console.log('\n=' .repeat(60));
console.log('Run this script in browser console at http://localhost:5180');