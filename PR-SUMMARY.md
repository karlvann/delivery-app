# Pull Request: Fix Delivery Calculator Pricing & Day Selection

## Summary
- Fixed delivery fee calculation error where wrong property names were being accessed
- Fixed delivery day selection buttons to prevent accidental form submission
- Ensured two-person delivery option buttons work correctly

## Changes Made

### 1. Fixed Pricing Calculation Error (`src/app/components/SinglePageDeliveryForm.jsx`)
**Problem:** The app was throwing `Invalid delivery calculation parameters` error because it was trying to access `result.fee` and `result.type` when the function actually returns `result.deliveryFee` and `result.deliveryType`.

**Solution:** Updated property access to use correct field names:
```javascript
// Before
fee = result.fee;
type = result.type;

// After
fee = result.deliveryFee;
type = result.deliveryType;
```

### 2. Fixed Button Types for Delivery Day Selection
**Problem:** Clicking delivery day buttons could accidentally submit forms because they were missing `type="button"` attribute.

**Solution:** Added `type="button"` to all interactive buttons:
- Delivery day selection buttons
- Two-person delivery Yes/No buttons

## Business Impact
- Customers can now successfully calculate delivery fees without errors
- Delivery day selection persists properly when clicked
- Improved user experience with stable form interactions

## Testing Checklist
- [ ] Enter Sydney address and verify local delivery pricing works
- [ ] Enter corridor postcode and verify $190 fixed rate applies
- [ ] Select two-person delivery and verify $50 base fee + $2.50/km calculation
- [ ] Test delivery day selection for different zones:
  - Sydney Eastern/Southern zones → Tuesday/Thursday only
  - Sydney Western/Northern zones → Monday/Wednesday/Friday only
  - Two-person delivery → Tuesday/Wednesday/Thursday only
- [ ] Verify buttons don't cause page reload or form submission

## Delivery Day Logic Reference

### Sydney Delivery Days
| Zone | Standard Delivery | Two-Person Delivery |
|------|------------------|-------------------|
| Eastern | Tue, Thu | Tue, Wed, Thu |
| Western | Mon, Wed, Fri | Tue, Wed, Thu |
| Northern | Mon, Wed, Fri | Tue, Wed, Thu |
| Southern | Tue, Thu | Tue, Wed, Thu |

### Other Cities
- **Brisbane:** All weekdays available
- **Melbourne:** Currently disabled
- **Corridors:** All weekdays available

## Files Modified
- `src/app/components/SinglePageDeliveryForm.jsx`

## Notes
- App runs on port 5180: http://localhost:5180/
- No database changes required
- Changes take effect immediately after restart