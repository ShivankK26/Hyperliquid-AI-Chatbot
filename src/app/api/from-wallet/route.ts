import { NextRequest, NextResponse } from 'next/server';
import { getFillsFromDatabase, processFillsForUser, saveFillsToDatabase, getComprehensiveUserDataFromHyperliquidAPI } from '@/lib/hyperliquid';
import { groupSessions, computeStats, detectStrategies, buildProfileText } from '@/lib/stats';
import { generateTradingProfile } from '@/lib/llm';
import { supabase } from '@/lib/supabase';
import { WalletRequest, WalletResponse, TradingProfile, Strategy } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: WalletRequest = await request.json();
    const { user_id, hl_address, lookback_days } = body;

    if (!user_id || !hl_address || !lookback_days) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, hl_address, lookback_days' },
        { status: 400 }
      );
    }

    // Get fills for the address (tries Hyperliquid API first, falls back to fixtures)
    const fills = await getFillsFromDatabase(user_id, hl_address, lookback_days);
    
    if (fills.length === 0) {
      return NextResponse.json(
        { error: 'No trading data found for this address' },
        { status: 404 }
      );
    }

    // Get comprehensive user data from all Hyperliquid APIs
    let comprehensiveData = null;
    try {
      comprehensiveData = await getComprehensiveUserDataFromHyperliquidAPI(hl_address);
      console.log('📊 Comprehensive data fetched:', {
        portfolio: comprehensiveData.portfolio?.marginSummary?.accountValue,
        fees: comprehensiveData.fees?.userCrossRate,
        openOrders: comprehensiveData.openOrders?.length,
        frontendOrders: comprehensiveData.frontendOrders?.length
      });
    } catch (error) {
      console.error('Error fetching comprehensive data:', error);
      // Continue without comprehensive data
    }

    // Save fills to database for future reference
    await saveFillsToDatabase(fills);

    // Process fills and group into sessions
    const processedFills = processFillsForUser(fills, user_id);
    const sessions = groupSessions(processedFills);

    // Compute trading statistics
    const stats = computeStats(sessions);

    // Generate profile summary and detect strategies
    const { summary, strategies } = await generateTradingProfile(stats, sessions);

    // Build the trading profile
    const profile: TradingProfile = {
      summary,
      top_markets: stats.top_markets,
      median_position_size_usd: stats.median_position_size_usd,
      median_leverage: stats.median_leverage,
      avg_hold_minutes: stats.avg_hold_minutes,
      win_rate: stats.win_rate,
      time_windows: stats.time_windows
    };

    // Calculate time window
    const now = new Date();
    const fromDate = new Date(now.getTime() - lookback_days * 24 * 60 * 60 * 1000);
    const window = {
      from: fromDate.toISOString(),
      to: now.toISOString()
    };

    // Save profile to database
    try {
      await supabase.from('profiles').insert({
        user_id,
        hl_address,
        window_start: window.from,
        window_end: window.to,
        summary: profile.summary,
        data: stats,
        strategies: strategies
      });
    } catch (dbError) {
      console.error('Error saving profile to database:', dbError);
      // Continue without failing the request
    }

    const response: WalletResponse = {
      user_id,
      address: hl_address,
      window,
      profile,
      strategies,
      comprehensiveData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in from-wallet endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
