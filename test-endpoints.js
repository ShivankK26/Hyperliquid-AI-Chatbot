// Simple test script to verify the API endpoints
// Run with: node test-endpoints.js

const BASE_URL = 'http://localhost:3000';

async function testChatEndpoint() {
  console.log('Testing /api/chat endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'test_user',
        message: 'What do you think about Bitcoin trading?'
      })
    });

    const data = await response.json();
    console.log('Chat response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Chat test failed:', error.message);
  }
}

async function testWalletEndpoint() {
  console.log('\nTesting /api/from-wallet endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/from-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'test_user',
        hl_address: '0x5ac99df645f3414876c816caa18b2d234024b487', // Example Hyperliquid address
        lookback_days: 30
      })
    });

    const data = await response.json();
    console.log('Wallet analysis response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Wallet test failed:', error.message);
  }
}

async function runTests() {
  console.log('Starting API endpoint tests...\n');
  
  await testChatEndpoint();
  await testWalletEndpoint();
  
  console.log('\nTests completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testChatEndpoint, testWalletEndpoint };
