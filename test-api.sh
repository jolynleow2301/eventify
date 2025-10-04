#!/bin/bash

echo "🧪 Testing Eventify AI Backend..."
echo "=================================="

# Check if server is running
echo "📡 Checking if server is running..."
curl -s http://localhost:3000/api/places/search-locations?query=test > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is not running. Start with: npm run dev"
    exit 1
fi

# Test debug endpoint
echo ""
echo "🤖 Testing AI Debug Endpoint..."
curl -X POST http://localhost:3000/api/debug \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "📍 Testing Location Search..."
curl "http://localhost:3000/api/places/search-locations?query=Singapore" \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "🍽️ Testing Regular Recommendations..."
curl -X POST http://localhost:3000/api/places/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": 1.3521, "lng": 103.8198},
    "type": "food",
    "radius": 5000
  }' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "🤖 Testing AI Recommendations..."
curl -X POST http://localhost:3000/api/places/ai-recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": 1.3521, "lng": 103.8198},
    "type": "food",
    "preferences": {
      "budget": "mid-range",
      "vibes": ["casual", "cozy"],
      "atmosphere": ["relaxed"]
    },
    "radius": 5000
  }' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "✅ Testing complete! Check the responses above."