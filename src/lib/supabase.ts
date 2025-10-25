import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database schema types
export interface Database {
  public: {
    Tables: {
      memories: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          value: string;
          confidence: number;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key: string;
          value: string;
          confidence: number;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          key?: string;
          value?: string;
          confidence?: number;
          embedding?: number[] | null;
          created_at?: string;
        };
      };
      fills: {
        Row: {
          id: string;
          user_id: string;
          hl_address: string;
          market: string;
          side: string;
          price: number;
          qty: number;
          notional_usd: number;
          leverage: number | null;
          pnl_usd: number | null;
          ts: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hl_address: string;
          market: string;
          side: string;
          price: number;
          qty: number;
          notional_usd: number;
          leverage?: number | null;
          pnl_usd?: number | null;
          ts: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hl_address?: string;
          market?: string;
          side?: string;
          price?: number;
          qty?: number;
          notional_usd?: number;
          leverage?: number | null;
          pnl_usd?: number | null;
          ts?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          hl_address: string;
          window_start: string;
          window_end: string;
          summary: string;
          data: any;
          strategies: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hl_address: string;
          window_start: string;
          window_end: string;
          summary: string;
          data: any;
          strategies: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hl_address?: string;
          window_start?: string;
          window_end?: string;
          summary?: string;
          data?: any;
          strategies?: any;
          created_at?: string;
        };
      };
    };
  };
}
