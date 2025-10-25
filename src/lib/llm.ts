import OpenAI from 'openai';
import { Memory } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ChatResponse {
  reply: string;
  newMemories: Array<{
    key: string;
    value: string;
    confidence: number;
  }>;
}

export async function getChatReply(
  message: string, 
  memories: Memory[],
  userProfile?: any
): Promise<ChatResponse> {
  try {
    // Build context from memories
    const memoryContext = memories.length > 0 
      ? `\n\nUser's known preferences and history:\n${memories.map(m => `- ${m.key}: ${m.value} (confidence: ${m.confidence})`).join('\n')}`
      : '';

    // Add profile context if available
    const profileContext = userProfile 
      ? `\n\nUser's trading profile:\n${JSON.stringify(userProfile, null, 2)}`
      : '';

    const systemPrompt = `You are a helpful AI assistant for a Hyperliquid trading platform. You help users with trading advice, market analysis, and portfolio management.

${memoryContext}${profileContext}

When responding:
1. Be concise and helpful
2. Use the user's trading history and preferences to personalize your advice
3. If you learn something new about the user's preferences, trading style, or behavior, you can optionally return it as a "memory" with a confidence score (0-1)
4. Only return memories for significant, persistent preferences (not one-time mentions)
5. Keep memories short and factual

Return your response in this JSON format:
{
  "reply": "your response here",
  "memories": [
    {
      "key": "preference_category",
      "value": "specific preference or fact",
      "confidence": 0.85
    }
  ]
}

Only include memories if you're confident they represent lasting user preferences (confidence >= 0.7).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      reply: parsed.reply || 'I apologize, but I couldn\'t generate a proper response.',
      newMemories: parsed.memories || []
    };

  } catch (error) {
    console.error('Error in getChatReply:', error);
    return {
      reply: 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
      newMemories: []
    };
  }
}

export async function generateTradingProfile(
  stats: any,
  sessions: any[]
): Promise<{ summary: string; strategies: Array<{ name: string; reason: string }> }> {
  try {
    const systemPrompt = `You are an expert trading analyst. Based on the provided trading statistics and session data, generate a concise trading profile summary and identify trading strategies.

Trading Statistics:
${JSON.stringify(stats, null, 2)}

Session Data (first 5 sessions):
${JSON.stringify(sessions.slice(0, 5), null, 2)}

Generate:
1. A 1-2 sentence summary of the trader's style and behavior
2. Identify 2-3 trading strategies from these patterns:
   - "Quick in/out": most sessions last < 20 min
   - "Hold a bit longer": most sessions last 20–240 min  
   - "Focused market": >60% sessions in the same market
   - "Similar sizing": low variance in position sizes
   - "High leverage": consistently uses high leverage
   - "Diversified": trades many different markets
   - "Time-focused": trades at specific hours consistently

Return JSON format:
{
  "summary": "Brief description of trading style",
  "strategies": [
    {
      "name": "Strategy Name",
      "reason": "Brief explanation of why this applies"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      summary: parsed.summary || 'Trading profile analysis unavailable.',
      strategies: parsed.strategies || []
    };

  } catch (error) {
    console.error('Error generating trading profile:', error);
    return {
      summary: 'Unable to generate trading profile at this time.',
      strategies: []
    };
  }
}
