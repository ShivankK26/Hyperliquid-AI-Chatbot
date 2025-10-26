# Hyperliquid AI Chatbot

A sophisticated AI-powered trading analysis system that integrates with Hyperliquid APIs to provide personalized trading insights and conversational AI assistance.

## 🚀 Features

### **Two Core Endpoints**

#### 1. **`POST /chat`** - Conversational AI
- **LLM-powered responses** using GPT-4
- **Memory system** that learns from conversations
- **Personalized trading advice** based on your data
- **Context-aware responses** about trading strategies, markets, and preferences

#### 2. **`POST /from-wallet`** - Trading Analysis
- **Real-time Hyperliquid API integration**
- **Comprehensive trading analysis** (60-day lookback)
- **Session-based trading pattern detection**
- **Strategy identification** (Quick in/out, Focused market, etc.)
- **Portfolio and fee analysis**

### **Integrated Hyperliquid APIs**
- ✅ **Portfolio Data** (`clearinghouseState`) - Current account value, positions
- ✅ **Trading History** (`userFills`) - 749 fills analyzed into 21 sessions
- ✅ **Open Orders** (`openOrders`, `frontendOpenOrders`) - Active trading positions
- ✅ **Fee Structure** (`userFees`) - Cross rates, add rates, discounts
- ✅ **Order Status** (`orderStatus`) - Individual order tracking
- ✅ **Market Data** (`allMids`) - Real-time price information

## 📊 Current Analysis Results

Based on your trading data:
- **Top Markets**: SOL (6 sessions), HYPE (3 sessions), ETH (2 sessions)
- **Win Rate**: 52.4%
- **Average Hold Time**: 4.4 minutes
- **Trading Style**: Quick in/out with time-focused strategy
- **Portfolio Value**: $0.00502
- **Fee Rates**: 0.045% cross, 0.015% add

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **APIs**: Hyperliquid REST APIs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn package manager
- Supabase account
- OpenAI API key

### Installation

1. **Clone and install dependencies**
```bash
yarn install
```

2. **Set up environment variables**
```bash
cp env.example .env.local
```

3. **Configure `.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

4. **Start development server**
```bash
yarn dev
```

5. **Test the system**
```bash
# Test with your wallet address
./scripts/quick-test.sh 0x23478.....54654

# Or test comprehensive APIs
node scripts/test-comprehensive-apis.js 0x23478.....54654
```

## 📡 API Usage

### Chat Endpoint
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "u1", "message": "What is my trading style?"}'
```

**Response:**
```json
{
  "reply": "Based on your trading data, you're a quick in/out trader...",
  "stored_memories": [
    {"key": "pref.market", "value": "SOL", "confidence": 0.9}
  ]
}
```

### Wallet Analysis Endpoint
```bash
curl -X POST http://localhost:3000/api/from-wallet \
  -H "Content-Type: application/json" \
  -d '{"user_id": "u1", "hl_address": "0x417b478cB06A1739366bBbfD66610BF065754644", "lookback_days": 60}'
```

**Response:**
```json
{
  "user_id": "u1",
  "address": "0x417b478cB06A1739366bBbfD66610BF065754644",
  "window": {
    "from": "2025-08-27T10:46:21.941Z",
    "to": "2025-10-26T10:46:21.941Z"
  },
  "profile": {
    "summary": "Quick in/out trader focusing on SOL, HYPE, ETH...",
    "top_markets": ["SOL", "HYPE", "ETH"],
    "median_position_size_usd": 25.88,
    "median_leverage": 0,
    "avg_hold_minutes": 4.4,
    "win_rate": 0.524,
    "time_windows": ["12–13h", "14–15h", "13–14h"]
  },
  "strategies": [
    {"name": "Quick in/out", "reason": "Average hold time of 4.44 minutes"},
    {"name": "Focused market", "reason": "68% sessions in top 3 markets"},
    {"name": "Time-focused", "reason": "Consistent trading during 12-15h"}
  ],
  "comprehensiveData": {
    "portfolio": {"marginSummary": {"accountValue": "0.00502"}},
    "fees": {"userCrossRate": "0.00045", "userAddRate": "0.00015"},
    "openOrders": [],
    "frontendOrders": []
  }
}
```

## 🧠 Memory System

The AI learns and remembers:
- **Trading preferences** ("prefers SOL", "likes leverage")
- **Behavioral patterns** ("trades during 13-16h")
- **Strategy preferences** ("wants longer holds")
- **Market focus** ("concentrates on top markets")

## 📈 Trading Analysis

### Session Grouping
- **45-minute rule**: Fills within 45 minutes = same session
- **Market-based**: Each session focuses on one market
- **Time-based**: Sessions grouped by trading hours

### Statistics Computed
- **Top Markets**: Most traded assets
- **Position Sizing**: Median position size in USD
- **Leverage Analysis**: Median leverage usage
- **Hold Times**: Average session duration
- **Win Rate**: Percentage of profitable sessions
- **Time Windows**: Most active trading hours

### Strategy Detection
- **"Quick in/out"**: Sessions < 20 minutes
- **"Hold longer"**: Sessions 20-240 minutes
- **"Focused market"**: >60% sessions in same market
- **"Similar sizing"**: Consistent position sizes
- **"Time-focused"**: Trading during specific hours

## 🗄️ Database Schema

### Tables
- **`fills`**: Trading data storage
- **`profiles`**: Analyzed trading patterns
- **`memories`**: AI conversation context
- **`sessions`**: User session tracking

### Data Flow
```
User Request → Check Database → Hyperliquid API → Analysis → Storage → Response
```

## 🔧 Development

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Chat endpoint
│   │   └── from-wallet/route.ts   # Analysis endpoint
│   ├── page.tsx                   # Frontend interface
│   └── layout.tsx
├── lib/
│   ├── hyperliquid.ts            # Hyperliquid API integration
│   ├── llm.ts                     # OpenAI integration
│   ├── memory.ts                  # Memory system
│   ├── stats.ts                   # Trading analysis
│   └── supabase.ts                # Database client
└── types/
    └── index.ts                   # TypeScript definitions
```