// Test script to demonstrate all integrated Hyperliquid APIs
const BASE_URL = 'http://localhost:3000';

async function testComprehensiveAPIs(address) {
  console.log(`🔍 Testing Comprehensive Hyperliquid APIs for ${address}`);
  console.log('='.repeat(80));
  
  try {
    console.log('📊 Fetching comprehensive wallet analysis with all APIs...');
    
    const response = await fetch(`${BASE_URL}/api/from-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'comprehensive_test',
        hl_address: address,
        lookback_days: 60
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Comprehensive Analysis Results:');
      console.log(`   📈 Summary: ${data.profile.summary}`);
      console.log(`   🏆 Top Markets: ${data.profile.top_markets.join(', ')}`);
      console.log(`   💰 Median Position Size: $${data.profile.median_position_size_usd.toFixed(2)}`);
      console.log(`   ⚡ Median Leverage: ${data.profile.median_leverage}x`);
      console.log(`   ⏱️  Avg Hold Time: ${data.profile.avg_hold_minutes.toFixed(1)} minutes`);
      console.log(`   🎯 Win Rate: ${(data.profile.win_rate * 100).toFixed(1)}%`);
      console.log(`   🕐 Active Hours: ${data.profile.time_windows.join(', ')}`);
      
      if (data.strategies.length > 0) {
        console.log(`   📋 Strategies: ${data.strategies.map(s => s.name).join(', ')}`);
        console.log('\n📋 Strategy Details:');
        data.strategies.forEach(strategy => {
          console.log(`   • ${strategy.name}: ${strategy.reason}`);
        });
      }

      // Show comprehensive data if available
      if (data.comprehensiveData) {
        console.log('\n🔗 Comprehensive API Data:');
        console.log(`   💼 Portfolio Value: $${data.comprehensiveData.portfolio?.marginSummary?.accountValue || 'N/A'}`);
        console.log(`   💸 Cross Rate: ${data.comprehensiveData.fees?.userCrossRate || 'N/A'}`);
        console.log(`   📋 Open Orders: ${data.comprehensiveData.openOrders?.length || 0}`);
        console.log(`   🎯 Frontend Orders: ${data.comprehensiveData.frontendOrders?.length || 0}`);
        console.log(`   ⏰ Data Timestamp: ${data.comprehensiveData.timestamp}`);
      }

      console.log(`\n📊 Time Window: ${data.window.from} to ${data.window.to}`);
      console.log(`📅 Lookback Period: 60 days`);
      
    } else {
      console.log(`❌ Analysis failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test with the address from your screenshot
const TEST_ADDRESS = process.argv[2] || '0x417b478cB06A1739366bBbfD66610BF065754644';

testComprehensiveAPIs(TEST_ADDRESS).catch(console.error);
