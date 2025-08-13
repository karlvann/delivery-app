# Persistence Guide - Ausbeds Delivery Calculator

## Overview
All admin settings in the Ausbeds Delivery Calculator persist automatically using browser localStorage. No database setup is required.

## How Persistence Works

### For Administrators

1. **Access Admin Panel**: Navigate to `/admin`
2. **Configure Settings**:
   - Set delivery zones and their postcode ranges
   - Configure which days each zone can receive deliveries
   - Add/remove corridor postcodes for fixed-rate deliveries
3. **Save Changes**: Click "Save Zone Settings" button
4. **Persistence**: Settings are immediately saved to browser localStorage and persist across:
   - Page refreshes
   - Browser restarts
   - Server restarts
   - Application updates

### For Customers

1. **Enter Delivery Address**: Customer enters their address
2. **Automatic Zone Detection**: System detects zone based on postcode
3. **Restricted Day Selection**: Delivery day dropdown only shows days configured for their zone
4. **Example**:
   - Eastern suburbs (2000-2050): Only see Monday & Thursday
   - Western suburbs (2140-2200): Only see Friday
   - Northern suburbs (2060-2090): Only see Tuesday & Wednesday

## Data Storage Details

### localStorage Keys

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `zonePostcodes` | Zone postcode ranges | `{"eastern":["2000-2050"],"western":["2140-2200"]}` |
| `zoneRecommendations` | Delivery days per zone | `{"eastern":[1,4],"western":[5]}` |
| `syd-bris-corridor` | Brisbane corridor postcodes | `["4000","4001","4002"]` |
| `syd-melb-corridor` | Melbourne corridor postcodes | `["3000","3001","3002"]` |

### Day Number Reference
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

## Testing Persistence

1. **Set Configuration**:
   ```bash
   # Go to admin panel
   http://localhost:5173/admin
   
   # Configure zones and days
   # Click "Save Zone Settings"
   ```

2. **Test Customer View**:
   ```bash
   # Go to main calculator
   http://localhost:5173/
   
   # Enter address in configured zone
   # Verify only allowed days appear
   ```

3. **Verify Persistence**:
   ```bash
   # Refresh page (Cmd+R or F5)
   # Settings should remain
   
   # Close and reopen browser
   # Settings should remain
   ```

## Troubleshooting

### Settings Not Persisting?

1. **Check Browser Console**:
   ```javascript
   // Open browser console (F12)
   localStorage.getItem('zonePostcodes')
   localStorage.getItem('zoneRecommendations')
   ```

2. **Clear and Reset**:
   ```javascript
   // Clear all settings
   localStorage.clear()
   
   // Reload page
   location.reload()
   ```

3. **Browser Compatibility**:
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari: Full support (may need to allow localStorage)
   - Private/Incognito mode: Settings only persist during session

### Zone Detection Not Working?

1. **Verify Zone Configuration**:
   - Check admin panel zone postcode ranges
   - Ensure postcode is within configured range

2. **Check Console Logs**:
   - Browser console shows zone detection logs
   - Look for "Detected zone:" messages

## Database (Optional)

The system is designed to work with a PostgreSQL database via Vercel Postgres, but it's optional:
- If database is configured: Settings sync to database
- If database is not available: System falls back to localStorage only
- localStorage is always the primary source

## Best Practices

1. **Regular Backups**: Export localStorage settings periodically
2. **Test Changes**: Always test zone changes with sample addresses
3. **Document Changes**: Keep a log of zone configuration changes
4. **Browser Support**: Use modern browsers for best compatibility

## Support

For issues or questions about persistence:
1. Check browser console for errors
2. Verify localStorage is enabled in browser
3. Test in different browser to isolate issues
4. Contact technical support with console logs