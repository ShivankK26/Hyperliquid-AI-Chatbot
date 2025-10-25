import { supabase } from './supabase';
import { Memory } from '@/types';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function getMemories(userId: string, minConfidence: number = 0.7): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence', minConfidence)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching memories:', error);
    return [];
  }

  return data || [];
}

export async function saveMemories(userId: string, memories: Array<{key: string, value: string, confidence: number}>): Promise<Memory[]> {
  const savedMemories: Memory[] = [];
  
  for (const memory of memories) {
    if (memory.confidence >= 0.7) {
      try {
        // Generate embedding for the memory value
        const embedding = await generateEmbedding(memory.value);
        
        const { data, error } = await supabase
          .from('memories')
          .insert({
            user_id: userId,
            key: memory.key,
            value: memory.value,
            confidence: memory.confidence,
            embedding: embedding
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving memory:', error);
        } else if (data) {
          savedMemories.push(data);
        }
      } catch (error) {
        console.error('Error processing memory:', error);
      }
    }
  }

  return savedMemories;
}

export async function searchMemories(userId: string, query: string, limit: number = 5): Promise<Memory[]> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: queryEmbedding,
      match_user_id: userId,
      match_threshold: 0.7,
      match_count: limit
    });

    if (error) {
      console.error('Error searching memories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in memory search:', error);
    return [];
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

export async function deleteOldMemories(userId: string, keepCount: number = 50): Promise<void> {
  try {
    // Get all memories for user, ordered by created_at desc
    const { data: allMemories } = await supabase
      .from('memories')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (allMemories && allMemories.length > keepCount) {
      const memoriesToDelete = allMemories.slice(keepCount);
      const idsToDelete = memoriesToDelete.map(m => m.id);

      await supabase
        .from('memories')
        .delete()
        .in('id', idsToDelete);
    }
  } catch (error) {
    console.error('Error deleting old memories:', error);
  }
}
