#!/bin/bash
# ScoutIQ Test Suite

echo "=== ScoutIQ Backend Test Suite ==="
echo ""

# Check if server is running
echo "1. Testing Health Check..."
curl -s http://localhost:4000/api/v1/scout/health | head -c 200
echo -e "\n"

echo "2. Getting Teams List..."
curl -s http://localhost:4000/api/v1/scout/teams?limit=3 | head -c 300
echo -e "\n"

echo "3. Getting Upcoming Series..."
curl -s "http://localhost:4000/api/v1/scout/series?type=upcoming&limit=2" | head -c 300
echo -e "\n"

echo "4. Getting Recent Series..."
curl -s "http://localhost:4000/api/v1/scout/series?type=recent&limit=2" | head -c 300
echo -e "\n"

echo "5. Getting Live Series..."
curl -s "http://localhost:4000/api/v1/scout/series?type=live&limit=2" | head -c 300
echo -e "\n"

echo "6. Testing Matchup Analysis (Cloud9 vs G2)..."
curl -s -X POST http://localhost:4000/api/v1/scout/matchup \
  -H "Content-Type: application/json" \
  -d '{"teamA":"Cloud9","teamB":"G2"}' | head -c 500
echo -e "\n"

echo "=== Test Suite Complete ==="

