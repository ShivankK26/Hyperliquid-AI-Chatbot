# Hyperliquid AI Chatbot

A minimal service for parsing Hyperliquid orders and generating trader profiles using LLMs and vector databases.

## Features

- **Two API endpoints**: `/chat` and `/from-wallet`
- **Memory system**: Stores and retrieves user preferences using embeddings
- **Trading profile generation**: Analyzes trading patterns and generates insights
- **Strategy detection**: Identifies trading strategies from user behavior

## Tech Stack

- **Next.js 16** with App Router
- **Supabase** (PostgreSQL + pgvector)
- **OpenAI API** for LLM and embeddings
- **TypeScript** throughout

## Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Environment Variables

Copy `env.example` to `.env.local` and fill in your credentials:

```bash
cp env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: Your OpenAI API key

### 3. Database Setup

Run the SQL schema in your Supabase project:

```sql
-- Copy and paste the contents of supabase-schema.sql into your Supabase SQL editor
```

### 4. Development

```bash
yarn dev
```

## API Endpoints

### POST /api/chat

Chat with the AI assistant that remembers user preferences.

**Input:**
```json
{
  "user_id": "u1",
  "message": "What do you think about BTC?"
}
```

**Output:**
```json
{
  "reply": "Based on your trading history, I see you prefer BTC...",
  "stored_memories": [
    {
      "key": "pref.chain",
      "value": "Arbitrum",
      "confidence": 0.82
    }
  ]
}
```

### POST /api/from-wallet

Analyze trading data from a Hyperliquid wallet address.

**Input:**
```json
{
  "user_id": "u1",
  "hl_address": "0xabc...",
  "lookback_days": 30
}
```

**Output:**
```json
{
  "user_id": "u1",
  "address": "0xabc...",
  "window": {
    "from": "2025-01-15T00:00:00Z",
    "to": "2025-01-25T00:00:00Z"
  },
  "profile": {
    "summary": "Mostly trades BTC with medium, consistent sizes. Sessions are short (~15m).",
    "top_markets": ["BTC", "ETH"],
    "median_position_size_usd": 420,
    "median_leverage": 5,
    "avg_hold_minutes": 15,
    "win_rate": 0.56,
    "time_windows": ["13–16h"]
  },
  "strategies": [
    {
      "name": "Quick in/out",
      "reason": "Most sessions < 20 min"
    },
    {
      "name": "Focused market",
      "reason": "68% sessions in BTC"
    }
  ]
}
```

## Project Structure

```
src/
├── app/
│   └── api/
│       ├── chat/route.ts          # POST /chat
│       └── from-wallet/route.ts   # POST /from-wallet
├── lib/
│   ├── supabase.ts                # Supabase client
│   ├── llm.ts                     # OpenAI client + prompts
│   ├── hyperliquid.ts             # Fixture loader + trade processing
│   ├── stats.ts                   # Trading statistics
│   └── memory.ts                  # Memory CRUD + embeddings
├── types/
│   └── index.ts                   # TypeScript interfaces
└── fixtures/
    └── fills.json                 # Sample trading data
```

## Key Features

### Memory System
- Stores user preferences with confidence scores
- Uses vector embeddings for semantic search
- Automatically filters low-confidence memories

### Trading Analysis
- Groups fills into trading sessions (45min gap rule)
- Computes statistics: position sizes, leverage, win rates
- Detects trading strategies from patterns

### Strategy Detection
- **Quick in/out**: Sessions < 20 minutes
- **Hold a bit longer**: Sessions 20-240 minutes
- **Focused market**: >60% sessions in same market
- **Similar sizing**: Low variance in position sizes
- **High leverage**: Consistent use of high leverage
- **Diversified**: Trades across many markets

## Development Notes

- **Real Hyperliquid API Integration**: Fetches live trading data from [Hyperliquid API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)
- **Fallback to Fixtures**: Uses sample data if API is unavailable or returns no data
- All trading data is stored in Supabase for caching and analysis
- Memory system uses OpenAI embeddings for semantic search
- Profile generation combines statistical analysis with LLM insights

## Future Enhancements

- More sophisticated strategy detection
- Portfolio performance tracking
- Risk analysis and alerts
- Real-time market data integration
- Advanced trading pattern recognition