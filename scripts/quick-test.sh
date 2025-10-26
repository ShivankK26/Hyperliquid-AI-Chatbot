#!/bin/bash

# Quick test script for Hyperliquid AI Chatbot
# Usage: ./scripts/quick-test.sh [ADDRESS]

ADDRESS=${1:-"0x417b478cB06A1739366bBbfD66610BF065754644"}

echo "🚀 Testing Hyperliquid AI Chatbot"
echo "📍 Address: $ADDRESS"
echo "=" | head -c 50; echo

echo "🤖 Testing Chat..."
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "message": "Hello!"}' | jq '.reply'

echo -e "\n📊 Testing Wallet Analysis..."
curl -s -X POST http://localhost:3000/api/from-wallet \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"test\", \"hl_address\": \"$ADDRESS\", \"lookback_days\": 60}" | jq '{
    summary: .profile.summary,
    top_markets: .profile.top_markets,
    win_rate: .profile.win_rate,
    strategies: .strategies
  }'

echo -e "\n✅ Test complete!"