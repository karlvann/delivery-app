# Zone-Based Delivery Day Workflow Test

## How to Test the Complete Workflow

### 1. Setup Admin Settings
Go to: http://localhost:5173/admin

Configure zones and delivery days:
- **Eastern suburbs (2000-2050)**: Monday, Thursday only
- **Western suburbs (2140-2200)**: Friday only  
- **Northern suburbs (2060-2090)**: Tuesday, Wednesday only
- **Southern suburbs (2220-2234)**: Monday, Friday only

Click "Save Zone Settings"

### 2. Test Customer Experience
Go to: http://localhost:5173/

#### Test Case 1: Eastern Suburbs
- Enter address: "123 George Street, Sydney NSW 2000"
- Expected: Dropdown shows ONLY Monday and Thursday
- Debug info should show: Zone = eastern

#### Test Case 2: Western Suburbs  
- Enter address: "456 Parramatta Road, Parramatta NSW 2150"
- Expected: Dropdown shows ONLY Friday
- Debug info should show: Zone = western

#### Test Case 3: Northern Suburbs
- Enter address: "789 Pacific Highway, Chatswood NSW 2067"  
- Expected: Dropdown shows ONLY Tuesday and Wednesday
- Debug info should show: Zone = eastern (2067 is in eastern range)

#### Test Case 4: Southern Suburbs
- Enter address: "555 Main Street, Kogarah NSW 2217"
- Expected: Dropdown shows ALL days (2217 not in any zone)
- Debug info should show: Zone = not detected

#### Test Case 5: Actual Southern Zone
- Enter address: "123 Princess Highway, Miranda NSW 2228"
- Expected: Dropdown shows ONLY Monday and Friday
- Debug info should show: Zone = southern

### 3. Check Console Logs
Open browser console (F12) and look for:
- 🔍 DeliveryDaySelector - Full address
- 🔍 DeliveryDaySelector - Extracted postcode
- 🎯 DeliveryDaySelector - Detected zone
- ✅ DeliveryDaySelector - Available days for zone
- 🎯 Zone restrictions applied

### 4. Verify Persistence
1. Refresh the page (Cmd+R or F5)
2. Enter same addresses
3. Verify zones still work correctly

### 5. What Should Happen

✅ **Working Correctly:**
- Address entered → Postcode extracted → Zone detected → Days filtered
- Only zone-specific days appear in dropdown
- Debug info shows correct zone

❌ **Not Working:**
- All days appear regardless of zone
- Console shows "No zone detected" 
- Debug info shows "Zone = not detected"

### Troubleshooting

If all days are showing:

1. **Check localStorage has zones:**
```javascript
// In browser console
localStorage.getItem('zonePostcodes')
localStorage.getItem('zoneRecommendations')
```

2. **Verify postcode extraction:**
- Check debug info shows correct postcode
- Console should show extracted postcode

3. **Verify zone detection:**
- Console should show detected zone
- Debug info should show zone name

4. **Clear and reset:**
```javascript
localStorage.clear()
// Then go back to admin and reconfigure
```