#!/bin/bash

echo "🔥 TESTING DELIVERY CALCULATOR API ENDPOINTS 🔥"
echo "=============================================="

echo -e "\n1. Testing Zone Detection (Sydney postcode 2000):"
curl -s "http://localhost:5180/api/zones?postcode=2000" | python3 -m json.tool

echo -e "\n2. Testing Brisbane Corridor:"
curl -s "http://localhost:5180/api/corridors?corridor=brisbane" | python3 -m json.tool | head -10

echo -e "\n3. Testing Melbourne Corridor:"
curl -s "http://localhost:5180/api/corridors?corridor=melbourne" | python3 -m json.tool | head -10

echo -e "\n4. Testing Main Page Load:"
curl -s http://localhost:5180 | grep -o "<title>.*</title>" | head -1

echo -e "\n5. Checking for JavaScript errors:"
curl -s http://localhost:5180 | grep -i "error" | head -5

echo -e "\nDone!"