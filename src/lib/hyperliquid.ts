import { Fill, HyperliquidFill, HyperliquidUserFillsRequest } from '@/types';
import fillsData from '@/fixtures/fills.json';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

// Convert Hyperliquid API fill to our internal Fill format
function convertHyperliquidFill(hlFill: HyperliquidFill, userId: string, hlAddress: string): Fill {
  const price = parseFloat(hlFill.px);
  const qty = parseFloat(hlFill.sz);
  const notionalUsd = price * qty;
  const pnlUsd = parseFloat(hlFill.closedPnl);
  
  // Determine side from direction
  const side = hlFill.dir.includes('Long') || hlFill.side === 'B' ? 'buy' : 'sell';
  
  return {
    id: `hl_${hlFill.tid}`,
    user_id: userId,
    hl_address: hlAddress,
    market: hlFill.coin,
    side: side as 'buy' | 'sell',
    price,
    qty,
    notional_usd: notionalUsd,
    leverage: 0, // Hyperliquid API doesn't provide leverage in fills
    pnl_usd: pnlUsd,
    ts: new Date(hlFill.time).toISOString()
  };
}

// Fetch fills from Hyperliquid API
export async function getFillsFromHyperliquidAPI(address: string, lookbackDays: number = 60): Promise<Fill[]> {
  try {
    const requestBody: HyperliquidUserFillsRequest = {
      type: 'userFills',
      user: address,
      aggregateByTime: false
    };

    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`);
    }

    const hlFills: HyperliquidFill[] = await response.json();
    console.log(`Raw API response: ${hlFills.length} fills`);
    
    // Filter fills by date range
    const cutoffTime = Date.now() - (lookbackDays * 24 * 60 * 60 * 1000);
    const recentFills = hlFills.filter(fill => fill.time >= cutoffTime);
    console.log(`After date filtering: ${recentFills.length} fills (cutoff: ${new Date(cutoffTime).toISOString()})`);
    
    // If no recent fills, use all fills for analysis
    const fillsToUse = recentFills.length > 0 ? recentFills : hlFills;
    console.log(`Using ${fillsToUse.length} fills for analysis`);
    
    // Convert to our format
    return fillsToUse.map(fill => convertHyperliquidFill(fill, '', address));
    
  } catch (error) {
    console.error('Error fetching fills from Hyperliquid API:', error);
    throw error;
  }
}

// Fallback to fixture data
export function loadFillsFixture(address: string, lookbackDays: number = 30): Fill[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  
  const filteredFills = fillsData.filter(fill => {
    const fillDate = new Date(fill.ts);
    return fill.hl_address === address && fillDate >= cutoffDate;
  });

  return filteredFills as Fill[];
}

// Main function to get fills - tries API first, falls back to fixtures
export async function getFillsFromDatabase(userId: string, address: string, lookbackDays: number): Promise<Fill[]> {
  try {
    // Try to get real data from Hyperliquid API
    const apiFills = await getFillsFromHyperliquidAPI(address, lookbackDays);
    
    if (apiFills.length > 0) {
      console.log(`Fetched ${apiFills.length} fills from Hyperliquid API`);
      return processFillsForUser(apiFills, userId);
    } else {
      console.log('No fills from API, using fixture data');
      return processFillsForUser(loadFillsFixture(address, lookbackDays), userId);
    }
  } catch (error) {
    console.error('Failed to fetch from API, using fixture data:', error);
    return processFillsForUser(loadFillsFixture(address, lookbackDays), userId);
  }
}

export function processFillsForUser(fills: Fill[], userId: string): Fill[] {
  // Add user_id to all fills if not already present
  return fills.map(fill => ({
    ...fill,
    user_id: userId
  }));
}

// Save fills to Supabase database
export async function saveFillsToDatabase(fills: Fill[]): Promise<void> {
  try {
    const { supabase } = await import('./supabase');
    
    const fillsToInsert = fills.map(fill => ({
      user_id: fill.user_id,
      hl_address: fill.hl_address,
      market: fill.market,
      side: fill.side,
      price: fill.price,
      qty: fill.qty,
      notional_usd: fill.notional_usd,
      leverage: fill.leverage,
      pnl_usd: fill.pnl_usd,
      ts: fill.ts
    }));

    const { error } = await supabase
      .from('fills')
      .upsert(fillsToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error saving fills to database:', error);
    } else {
      console.log(`Saved ${fills.length} fills to database`);
    }
  } catch (error) {
    console.error('Error in saveFillsToDatabase:', error);
  }
}

// Get additional market data from Hyperliquid
export async function getMarketMids(): Promise<Record<string, string>> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'allMids' })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching market mids:', error);
    return {};
  }
}

// Get portfolio data from Hyperliquid API (clearinghouseState)
export async function getPortfolioFromHyperliquidAPI(address: string): Promise<any> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: address
      })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`);
    }

    const portfolioData = await response.json();
    console.log(`Portfolio API response: Account Value: $${portfolioData.marginSummary.accountValue}`);
    
    return portfolioData;
  } catch (error) {
    console.error('Error fetching portfolio from Hyperliquid API:', error);
    throw error;
  }
}

// Get fees data from Hyperliquid API
export async function getFeesFromHyperliquidAPI(address: string): Promise<any> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'userFees',
        user: address
      })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`);
    }

    const feesData = await response.json();
    console.log(`Fees API response: Cross Rate: ${feesData.userCrossRate}, Add Rate: ${feesData.userAddRate}`);
    
    return feesData;
  } catch (error) {
    console.error('Error fetching fees from Hyperliquid API:', error);
    throw error;
  }
}

// Get open orders from Hyperliquid API
export async function getOpenOrdersFromHyperliquidAPI(address: string): Promise<any> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'openOrders',
        user: address
      })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`);
    }

    const ordersData = await response.json();
    console.log(`Open Orders API response: ${ordersData.length} orders`);
    
    return ordersData;
  } catch (error) {
    console.error('Error fetching open orders from Hyperliquid API:', error);
    throw error;
  }
}

// Get frontend open orders from Hyperliquid API
export async function getFrontendOpenOrdersFromHyperliquidAPI(address: string): Promise<any> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'frontendOpenOrders',
        user: address
      })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`);
    }

    const ordersData = await response.json();
    console.log(`Frontend Open Orders API response: ${ordersData.length} orders`);
    
    return ordersData;
  } catch (error) {
    console.error('Error fetching frontend open orders from Hyperliquid API:', error);
    throw error;
  }
}

// Get fills by time from Hyperliquid API
export async function getFillsByTimeFromHyperliquidAPI(address: string, startTime: number, endTime: number): Promise<any> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'userFills',
        user: address,
        startTime: startTime,
        endTime: endTime
      })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`);
    }

    const fillsData = await response.json();
    console.log(`Fills by time API response: ${fillsData.length} fills`);
    
    return fillsData;
  } catch (error) {
    console.error('Error fetching fills by time from Hyperliquid API:', error);
    throw error;
  }
}

// Get order status by oid or cloid from Hyperliquid API
export async function getOrderStatusFromHyperliquidAPI(oid?: number, cloid?: string): Promise<any> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'orderStatus',
        oid: oid,
        cloid: cloid
      })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`);
    }

    const orderData = await response.json();
    console.log(`Order Status API response: ${JSON.stringify(orderData)}`);
    
    return orderData;
  } catch (error) {
    console.error('Error fetching order status from Hyperliquid API:', error);
    throw error;
  }
}

// Get comprehensive user data from all APIs
export async function getComprehensiveUserDataFromHyperliquidAPI(address: string): Promise<any> {
  try {
    console.log(`🔍 Fetching comprehensive data for ${address}`);
    
    // Fetch all data in parallel
    const [portfolioData, feesData, openOrders, frontendOrders] = await Promise.all([
      getPortfolioFromHyperliquidAPI(address),
      getFeesFromHyperliquidAPI(address),
      getOpenOrdersFromHyperliquidAPI(address),
      getFrontendOpenOrdersFromHyperliquidAPI(address)
    ]);

    return {
      portfolio: portfolioData,
      fees: feesData,
      openOrders: openOrders,
      frontendOrders: frontendOrders,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching comprehensive user data:', error);
    throw error;
  }
}
