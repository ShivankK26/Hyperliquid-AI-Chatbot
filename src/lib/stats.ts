import { Fill, Session, TradingStats, Strategy } from '@/types';

export function groupSessions(fills: Fill[]): Session[] {
  console.log(`🔄 Grouping ${fills.length} fills into sessions`);
  
  if (fills.length === 0) return [];

  // Sort fills by timestamp
  const sortedFills = [...fills].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  
  console.log(`📊 Sample markets from fills:`, [...new Set(sortedFills.slice(0, 10).map(f => f.market))]);
  
  const sessions: Session[] = [];
  const sessionMap = new Map<string, Session>();

  for (const fill of sortedFills) {
    const market = fill.market;
    const fillTime = new Date(fill.ts).getTime();
    
    // Check if there's an existing session for this market within 45 minutes
    let existingSession: Session | null = null;
    for (const [key, session] of sessionMap.entries()) {
      if (session.market === market) {
        const lastFillTime = new Date(session.end_ts).getTime();
        const timeDiff = fillTime - lastFillTime;
        const timeDiffMinutes = timeDiff / (1000 * 60);
        
        if (timeDiffMinutes <= 45) {
          existingSession = session;
          break;
        }
      }
    }

    if (existingSession) {
      // Add fill to existing session
      existingSession.fills.push(fill);
      existingSession.end_ts = fill.ts;
      existingSession.duration_min = (new Date(fill.ts).getTime() - new Date(existingSession.start_ts).getTime()) / (1000 * 60);
      existingSession.position_size_usd += Math.abs(fill.notional_usd);
      existingSession.pnl_usd += fill.pnl_usd || 0;
      
      // Update leverage (use the most recent non-zero leverage)
      if (fill.leverage && fill.leverage > 0) {
        existingSession.leverage = fill.leverage;
      }
    } else {
      // Create new session
      const newSession: Session = {
        market: fill.market,
        start_ts: fill.ts,
        end_ts: fill.ts,
        duration_min: 0,
        position_size_usd: Math.abs(fill.notional_usd),
        pnl_usd: fill.pnl_usd || 0,
        leverage: fill.leverage,
        fills: [fill]
      };
      
      const sessionKey = `${market}_${fillTime}`;
      sessionMap.set(sessionKey, newSession);
    }
  }

  // Convert map to array and finalize sessions
  for (const session of sessionMap.values()) {
    sessions.push(session);
  }

  return sessions.sort((a, b) => new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime());
}

export function computeStats(sessions: Session[]): TradingStats {
  console.log(`📊 Computing stats for ${sessions.length} sessions`);
  
  if (sessions.length === 0) {
    return {
      top_markets: [],
      median_position_size_usd: 0,
      median_leverage: 0,
      avg_hold_minutes: 0,
      win_rate: 0,
      time_windows: []
    };
  }

  // Top markets (by session count)
  const marketCounts = new Map<string, number>();
  sessions.forEach(session => {
    marketCounts.set(session.market, (marketCounts.get(session.market) || 0) + 1);
  });
  
  console.log(`📈 Market counts:`, Object.fromEntries(marketCounts));
  
  const top_markets = Array.from(marketCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([market]) => market);
    
  console.log(`🏆 Top markets: ${top_markets.join(', ')}`);

  // Median position size
  const positionSizes = sessions.map(s => s.position_size_usd).sort((a, b) => a - b);
  const median_position_size_usd = positionSizes.length % 2 === 0
    ? (positionSizes[positionSizes.length / 2 - 1] + positionSizes[positionSizes.length / 2]) / 2
    : positionSizes[Math.floor(positionSizes.length / 2)];

  // Median leverage (only for sessions with leverage)
  const leverageValues = sessions
    .filter(s => s.leverage && s.leverage > 0)
    .map(s => s.leverage!)
    .sort((a, b) => a - b);
  
  const median_leverage = leverageValues.length === 0 ? 0 : (
    leverageValues.length % 2 === 0
      ? (leverageValues[leverageValues.length / 2 - 1] + leverageValues[leverageValues.length / 2]) / 2
      : leverageValues[Math.floor(leverageValues.length / 2)]
  );

  // Average hold time
  const avg_hold_minutes = sessions.reduce((sum, s) => sum + s.duration_min, 0) / sessions.length;

  // Win rate
  const winningSessions = sessions.filter(s => s.pnl_usd > 0).length;
  const win_rate = sessions.length > 0 ? winningSessions / sessions.length : 0;

  // Time windows (hours with most sessions)
  const hourCounts = new Map<number, number>();
  sessions.forEach(session => {
    const hour = new Date(session.start_ts).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  
  const topHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}–${hour + 1}h`);

  return {
    top_markets,
    median_position_size_usd,
    median_leverage,
    avg_hold_minutes,
    win_rate,
    time_windows: topHours
  };
}

export function detectStrategies(sessions: Session[], stats: TradingStats): Strategy[] {
  const strategies: Strategy[] = [];

  // Quick in/out strategy
  const quickSessions = sessions.filter(s => s.duration_min < 20).length;
  const quickPercentage = (quickSessions / sessions.length) * 100;
  if (quickPercentage > 60) {
    strategies.push({
      name: 'Quick in/out',
      reason: `${quickPercentage.toFixed(0)}% of sessions last < 20 min`
    });
  }

  // Hold a bit longer strategy
  const longerSessions = sessions.filter(s => s.duration_min >= 20 && s.duration_min <= 240).length;
  const longerPercentage = (longerSessions / sessions.length) * 100;
  if (longerPercentage > 60) {
    strategies.push({
      name: 'Hold a bit longer',
      reason: `${longerPercentage.toFixed(0)}% of sessions last 20–240 min`
    });
  }

  // Focused market strategy
  if (stats.top_markets.length > 0) {
    const topMarketSessions = sessions.filter(s => s.market === stats.top_markets[0]).length;
    const focusedPercentage = (topMarketSessions / sessions.length) * 100;
    if (focusedPercentage > 60) {
      strategies.push({
        name: 'Focused market',
        reason: `${focusedPercentage.toFixed(0)}% of sessions in ${stats.top_markets[0]}`
      });
    }
  }

  // Similar sizing strategy
  const positionSizes = sessions.map(s => s.position_size_usd);
  if (positionSizes.length > 1) {
    const mean = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
    const variance = positionSizes.reduce((sum, size) => sum + Math.pow(size - mean, 2), 0) / positionSizes.length;
    const stdev = Math.sqrt(variance);
    
    if (stdev < mean * 0.5) { // Low variance relative to mean
      strategies.push({
        name: 'Similar sizing',
        reason: 'Low variance in position sizes'
      });
    }
  }

  // High leverage strategy
  const leverageSessions = sessions.filter(s => s.leverage && s.leverage > 5).length;
  const leveragePercentage = (leverageSessions / sessions.length) * 100;
  if (leveragePercentage > 50) {
    strategies.push({
      name: 'High leverage',
      reason: `${leveragePercentage.toFixed(0)}% of sessions use >5x leverage`
    });
  }

  // Diversified strategy
  const uniqueMarkets = new Set(sessions.map(s => s.market)).size;
  if (uniqueMarkets >= 5 && sessions.length >= 10) {
    strategies.push({
      name: 'Diversified',
      reason: `Trades across ${uniqueMarkets} different markets`
    });
  }

  return strategies;
}

export function buildProfileText(stats: TradingStats): string {
  const { top_markets, median_position_size_usd, median_leverage, avg_hold_minutes, win_rate, time_windows } = stats;
  
  const marketText = top_markets.length > 0 
    ? `mostly trades ${top_markets.slice(0, 2).join(' and ')}`
    : 'trades various markets';
  
  const sizeText = median_position_size_usd > 0 
    ? `with typical size around $${Math.round(median_position_size_usd)}`
    : 'with varying position sizes';
  
  const leverageText = median_leverage > 0 
    ? `, leverage around ${median_leverage}x`
    : '';
  
  const durationText = avg_hold_minutes > 0 
    ? `, keeps trades short (avg ${Math.round(avg_hold_minutes)}m)`
    : '';
  
  const timeText = time_windows.length > 0 
    ? `, most active from ${time_windows[0]}`
    : '';
  
  const winText = win_rate > 0 
    ? `. Win rate ~${Math.round(win_rate * 100)}%`
    : '';

  return `You ${marketText} ${sizeText}${leverageText}${durationText}${timeText}${winText}.`;
}
