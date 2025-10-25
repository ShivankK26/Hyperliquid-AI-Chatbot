import { NextRequest, NextResponse } from 'next/server';
import { getMemories, saveMemories } from '@/lib/memory';
import { getChatReply } from '@/lib/llm';
import { ChatRequest, ChatResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { user_id, message } = body;

    if (!user_id || !message) {
      return NextResponse.json(
        { error: 'Missing user_id or message' },
        { status: 400 }
      );
    }

    // Get user's recent memories
    const memories = await getMemories(user_id, 0.7);

    // Get chat reply from LLM
    const chatResponse = await getChatReply(message, memories);

    // Save any new memories with high confidence
    const savedMemories = await saveMemories(user_id, chatResponse.newMemories);

    const response: ChatResponse = {
      reply: chatResponse.reply,
      stored_memories: savedMemories.map(memory => ({
        key: memory.key,
        value: memory.value,
        confidence: memory.confidence
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
