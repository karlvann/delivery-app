# Zone Detection Test Instructions

## TEST SETUP

1. Open Chrome/Firefox browser
2. Navigate to: http://localhost:5180
3. Open Developer Console (F12 or Cmd+Option+I)
4. Go to Console tab
5. Clear console (Cmd+K or click clear button)

## TEST PROCEDURE

### Test 1: Sydney CBD (Postcode 2000)
1. In the address field, type: `123 George Street, Sydney NSW 2000`
2. Select the first autocomplete suggestion
3. **Expected Console Logs:**
   ```
   🔥 ZONE DETECTION - Extracted postcode: 2000
   🔥 ZONE DETECTION - Basic zone lookup result: eastern
   🔥 ZONE DETECTION - Final zone: eastern
   🔥 ZONE DETECTION - Setting postcodeInfo state: {zone: "eastern", ...}
   ```
4. **Expected UI Display:**
   - Blue info box should show: `Zone: Eastern Suburbs & City • X.X km from Sydney Warehouse`
   - Zone text should be visible below the address input

### Test 2: Western Sydney (Postcode 2150)
1. Clear the address field
2. Type: `456 Parramatta Road, Parramatta NSW 2150`
3. Select from autocomplete
4. **Expected Console Logs:**
   ```
   🔥 ZONE DETECTION - Extracted postcode: 2150
   🔥 ZONE DETECTION - Basic zone lookup result: western
   🔥 ZONE DETECTION - Final zone: western
   ```
5. **Expected UI Display:**
   - Zone: `Western Sydney`

### Test 3: Northern Beaches (Postcode 2100)
1. Clear and type: `789 Pittwater Road, Brookvale NSW 2100`
2. **Expected:** Zone: `North Shore & Northern Beaches`

### Test 4: Southern Sydney (Postcode 2232)
1. Clear and type: `321 Princes Highway, Sylvania NSW 2232`
2. **Expected:** Zone: `Sutherland Shire & South`

## CONSOLE DEBUGGING COMMANDS

Run these commands in the browser console to check state:

### Check if zones are loaded:
```javascript
// Check localStorage for zone data
const zones = localStorage.getItem('zonePostcodes');
if (zones) {
  const parsed = JSON.parse(zones);
  console.log('Eastern zone postcodes:', parsed.eastern?.slice(0, 10));
  console.log('Is 2000 in eastern?', parsed.eastern?.includes('2000'));
} else {
  console.log('No zones in localStorage');
}
```

### Check sydney-zones.json loading:
```javascript
fetch('/sydney-zones.json')
  .then(r => r.json())
  .then(data => {
    console.log('Eastern postcodes:', data.eastern.postcodes.slice(0, 10));
    console.log('Contains 2000?', data.eastern.postcodes.includes('2000'));
  });
```

### Force zone detection:
```javascript
// Import and test zone detection directly
import('/src/app/components/zoneService.js').then(module => {
  const result = module.getZoneForPostcode('2000');
  console.log('Zone for 2000:', result);
});
```

## COMMON ISSUES & FIXES

### Issue: No zone showing
- **Check:** Console for any errors
- **Fix:** Restart server: `lsof -ti:5180 | xargs kill -9 && npm run dev`

### Issue: Zone shows "Not in any zone"
- **Check:** Is postcode in sydney-zones.json?
- **Fix:** Check file `/src/data/sydney-zones.json`

### Issue: Console logs not appearing
- **Check:** Is console filter set to "All" or "Verbose"?
- **Fix:** Click filter dropdown, select "All"

### Issue: API errors in console
- **Note:** Database errors are expected - app uses localStorage fallback
- **Check:** Zone still works despite errors

## SUCCESS CRITERIA

✅ Zone appears in blue info box below address input
✅ Console shows all 🔥 ZONE DETECTION logs
✅ Correct zone name displays for each test address
✅ Zone updates when address changes
✅ No JavaScript errors in console

## SCREENSHOT REQUIREMENTS

Take screenshots of:
1. Console showing 🔥 ZONE DETECTION logs
2. UI showing zone in blue info box
3. Both together in one screenshot if possible