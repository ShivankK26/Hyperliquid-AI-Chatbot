// Core data structures for the Hyperliquid AI Chatbot

export interface Fill {
  id: string;
  user_id: string;
  hl_address: string;
  market: string;
  side: 'buy' | 'sell';
  price: number;
  qty: number;
  notional_usd: number;
  leverage?: number;
  pnl_usd?: number;
  ts: string; // ISO timestamp
}

export interface Session {
  market: string;
  start_ts: string;
  end_ts: string;
  duration_min: number;
  position_size_usd: number;
  pnl_usd: number;
  leverage?: number;
  fills: Fill[];
}

export interface Memory {
  id?: string;
  user_id: string;
  key: string;
  value: string;
  confidence: number;
  embedding?: number[];
  created_at?: string;
}

export interface TradingStats {
  top_markets: string[];
  median_position_size_usd: number;
  median_leverage: number;
  avg_hold_minutes: number;
  win_rate: number;
  time_windows: string[];
}

export interface TradingProfile {
  summary: string;
  top_markets: string[];
  median_position_size_usd: number;
  median_leverage: number;
  avg_hold_minutes: number;
  win_rate: number;
  time_windows: string[];
}

export interface Strategy {
  name: string;
  reason: string;
}

export interface ChatRequest {
  user_id: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  stored_memories: Array<{
    key: string;
    value: string;
    confidence: number;
  }>;
}

export interface WalletRequest {
  user_id: string;
  hl_address: string;
  lookback_days: number;
}

export interface WalletResponse {
  user_id: string;
  address: string;
  window: {
    from: string;
    to: string;
  };
  profile: TradingProfile;
  strategies: Strategy[];
}

export interface ProfileData {
  summary: string;
  data: TradingStats;
  strategies: Strategy[];
}

// Hyperliquid API Types
export interface HyperliquidFill {
  closedPnl: string;
  coin: string;
  crossed: boolean;
  dir: string;
  hash: string;
  oid: number;
  px: string;
  side: 'A' | 'B';
  startPosition: string;
  sz: string;
  time: number;
  fee: string;
  feeToken: string;
  builderFee?: string;
  tid: number;
}

export interface HyperliquidUserFillsRequest {
  type: 'userFills';
  user: string;
  aggregateByTime?: boolean;
}

export interface HyperliquidAllMidsRequest {
  type: 'allMids';
  dex?: string;
}

export interface HyperliquidOpenOrdersRequest {
  type: 'openOrders';
  user: string;
  dex?: string;
}

export interface HyperliquidPortfolioRequest {
  type: 'clearinghouseState';
  user: string;
}
