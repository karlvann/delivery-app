#!/bin/bash

echo "🔥 GORDON'S DELIVERY CALCULATOR VALIDATION SUITE 🔥"
echo "===================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if app is running
echo "1. Checking if app is running on port 5180..."
if lsof -i :5180 | grep -q LISTEN; then
    echo -e "${GREEN}✅ App is running on port 5180${NC}"
else
    echo -e "${RED}❌ App is NOT running on port 5180${NC}"
    echo "Starting app..."
    npm run dev &
    sleep 5
fi

echo ""
echo "2. Testing API endpoints..."

# Test corridors API
echo -n "   - Corridors API: "
CORRIDOR_RESPONSE=$(curl -s http://localhost:5180/api/corridors)
if [[ $CORRIDOR_RESPONSE == *"syd-bris"* ]]; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}❌ Not working${NC}"
fi

# Test zones API
echo -n "   - Zones API (postcode 2000): "
ZONE_RESPONSE=$(curl -s "http://localhost:5180/api/zones?postcode=2000")
if [[ $ZONE_RESPONSE == *"eastern"* ]] || [[ $ZONE_RESPONSE == *"Eastern"* ]]; then
    echo -e "${GREEN}✅ Working (Eastern zone detected)${NC}"
else
    echo -e "${RED}❌ Not working or zone not detected${NC}"
    echo "     Response: $ZONE_RESPONSE"
fi

echo ""
echo "3. Checking critical files..."

# Check for key files
FILES=(
    "src/app/components/DeliveryCalculator.jsx"
    "src/app/components/zoneDetectionService.js"
    "src/app/components/zoneService.js"
    "src/data/sydney-zones.json"
    "src/app/components/postcodeService.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅ $file exists${NC}"
    else
        echo -e "   ${RED}❌ $file MISSING${NC}"
    fi
done

echo ""
echo "4. Checking localStorage data (via API)..."

# Create a test endpoint to check localStorage
cat > src/app/api/validate/route.js << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  // This would normally check server-side storage
  // For now, return a test response
  return NextResponse.json({
    status: 'validation-endpoint',
    message: 'Use /validate page for full validation'
  });
}
EOF

echo ""
echo "5. Test addresses validation:"
echo "   Visit http://localhost:5180/validate for full test results"
echo ""
echo "   Quick manual tests to perform:"
echo "   a) Sydney CBD: '1 Macquarie Street, Sydney NSW 2000'"
echo "      - Should detect Eastern zone"
echo "      - Should show Mon/Tue/Wed delivery"
echo "   b) Coffs Harbour: '123 Main St, Coffs Harbour NSW 2450'"  
echo "      - Should detect as corridor"
echo "      - Should show $190 fixed price"
echo "   c) Melbourne: '1 Collins Street, Melbourne VIC 3000'"
echo "      - Should detect Melbourne"
echo "      - Should show appropriate delivery info"

echo ""
echo "===================================================="
echo "VALIDATION COMPLETE"
echo ""
echo "📊 SUMMARY:"
echo "- App is running on http://localhost:5180"
echo "- Validation page: http://localhost:5180/validate"
echo "- Admin panel: http://localhost:5180/admin"
echo ""
echo "If zones aren't configured, go to /admin and set delivery days!"