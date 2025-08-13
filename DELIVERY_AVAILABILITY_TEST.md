# Delivery Availability Test Guide

## How the New Feature Works

Instead of a dropdown selector, there's now a **"Check Available Delivery Days"** button that:
1. Appears after customer enters an address
2. When clicked, checks if the postcode has any available delivery days
3. Shows either available days or "no delivery available" message

## Setup Test Zones

### 1. Go to Admin Panel
Navigate to: http://localhost:5173/admin

### 2. Configure Zone Delivery Days
In the "Zone Delivery Schedule" section, set up test scenarios:

#### Test Scenario A: Some zones have days
- **Eastern (2000-2050)**: Turn ON Monday, Thursday
- **Western (2140-2200)**: Turn ON Friday only
- **Northern (2060-2090)**: Turn OFF all days (no delivery)
- **Southern (2220-2234)**: Turn ON Saturday only

Click "Save Zone Settings"

## Test the Feature

### Test 1: Zone with Available Days
1. Go to main page: http://localhost:5173/
2. Enter address: "123 George Street, Sydney NSW 2000" (Eastern zone)
3. Click "Check Available Delivery Days"
4. **Expected**: Green message showing "Delivery available on: Monday, Thursday"

### Test 2: Zone with One Day
1. Enter address: "456 Parramatta Road, Parramatta NSW 2150" (Western zone)
2. Click "Check Available Delivery Days"
3. **Expected**: Green message showing "Delivery available on: Friday"

### Test 3: Zone with NO Days
1. Enter address: "789 Pacific Highway, Chatswood NSW 2067" (Northern zone - note: 2067 is actually in Eastern range)
2. For a true Northern test, use: "123 Main St, Chatswood NSW 2060"
3. Click "Check Available Delivery Days"
4. **Expected**: Red message "Sorry, no delivery days are currently scheduled for Northern suburbs"

### Test 4: Postcode Not in Any Zone
1. Enter address: "999 Test Street, Neutral Bay NSW 2089"
2. Click "Check Available Delivery Days"
3. **Expected**: Red message "Sorry, no delivery days are available for postcode 2089"

## How It Looks

### When Days Are Available (Green):
```
✓ Delivery Available!
Delivery available on: Monday, Thursday
Zone: Eastern suburbs (2000)
```

### When No Days Available (Red):
```
⚠ No Delivery Available
Sorry, no delivery days are available for postcode 2089
Please contact us at sales@ausbeds.com.au for alternative arrangements.
```

## Button States

1. **Disabled** (gray): When no address is entered
2. **Enabled** (brand color): When address is entered
3. **Loading**: Shows "Checking..." while processing

## Important Notes

- Button appears AFTER address is entered
- Resets when address changes
- Uses zones configured in admin panel
- Shows contact email for unavailable areas