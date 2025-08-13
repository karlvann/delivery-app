# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ausbeds delivery calculator - a Next.js application that calculates delivery fees for furniture deliveries from warehouses in Sydney, Brisbane, and Melbourne. The app uses Google Maps API for distance calculations and address autocomplete.

## Key Commands

```bash
npm run dev     # Start development server on port 5173
npm run build   # Build for production
npm run start   # Start production server on port 5173
npm run lint    # Run ESLint
```

## Architecture

### Core Pricing Logic (`src/app/components/priceCalculator.js`)

Three delivery types with distinct pricing models:

1. **Local Delivery** (within city boundaries)
   - First 15km free from warehouse
   - $2/km for total distance after 15km
   - Maximum 110km range
   - Available from all three cities (Sydney, Brisbane, Melbourne)

2. **Corridor Delivery** (fixed rate)
   - Sydney-Brisbane corridor: $190 fixed
   - Sydney-Melbourne corridor: $190 fixed
   - Determined by postcode lookup

3. **Two-Person Delivery** (Sydney only)
   - $50 base fee for first 15km
   - Additional $2.50/km beyond 15km
   - Only available for Sydney deliveries
   - Available Tuesday, Wednesday, Thursday only

### Service Layer

**`googleMapsService.js`**
- Google Maps API key hardcoded: `AIzaSyCAn-JvV4sTaGP5P4zFb0PlzFYOinzH1A8`
- City origins defined in `CITY_ORIGINS` object
- Handles distance calculations, geocoding, autocomplete
- Auto-detects city based on state in address

**`postcodeService.js`**
- Manages corridor postcodes with localStorage persistence
- Falls back to CSV files in `/public` directory
- Handles zone detection for delivery scheduling
- Keys: `syd-bris-corridor`, `syd-melb-corridor` in localStorage

**`zoneService.js`**
- Sydney-specific zone mapping from `src/data/sydney-zones.json`
- Maps postcodes to delivery zones (eastern, western, northern, southern)
- Used for delivery day recommendations

### Data Persistence

**localStorage (Primary)**
- Corridor postcodes: `syd-bris-corridor`, `syd-melb-corridor`
- Zone configurations: `zonePostcodes`
- Admin settings persist across page refreshes

**PostgreSQL (Optional via Vercel)**
- Tables: `delivery_zones`, `corridor_postcodes`, `zone_recommendations`, `delivery_quotes`
- Falls back gracefully to localStorage if database unavailable
- Database operations in `src/lib/db.ts`

### API Routes

- `/api/corridors` - Get/manage corridor postcodes
- `/api/zones` - Get zone for postcode
- `/api/zone-recommendations` - Delivery day recommendations
- `/api/quotes` - Save delivery quotes
- `/api/init-db` - Initialize database tables
- `/api/auth/login` - Admin authentication

### Component Structure

**Main Components:**
- `DeliveryCalculator.jsx` - Main container orchestrating state
- `AddressInput.jsx` - Google Places autocomplete
- `PricingDisplay.jsx` - Displays calculated fees
- `DeliveryMap.jsx` - Visual route display
- `TwoPersonOption.jsx` - Sydney-only service selector
- `DeliveryAvailability.jsx` - Day selection interface
- `AdminPanel.jsx` - Corridor postcode management

## Critical Business Rules

1. **Distance Calculation Flow:**
   - Extract postcode from address
   - Check if postcode is in corridor (→ $190 fixed rate)
   - If not corridor, calculate distance from nearest city warehouse
   - Apply local delivery pricing rules

2. **Corridor Priority:**
   - Corridor delivery always takes precedence over local delivery
   - Two-person delivery not available for corridor routes

3. **Admin Settings:**
   - Changes to corridor postcodes save immediately to localStorage
   - Database updates are attempted but not required

## Development Workflow

1. **Adding/Modifying Postcodes:**
   - Use `/admin` panel for corridor management
   - Changes persist in localStorage immediately
   - Database sync attempted but optional

2. **Testing Delivery Calculations:**
   - Use `/test` page for debugging
   - Check console for detailed pricing logs
   - Verify corridor detection with postcode extraction

3. **Deployment:**
   - Vercel auto-deploys from git push
   - Environment variables not required (API key hardcoded)
   - Database connection optional
- port 5180 for the delivery app only
- http://localhost:5180/ only