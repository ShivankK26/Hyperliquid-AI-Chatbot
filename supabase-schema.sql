-- Enable the vector extension for embeddings
create extension if not exists vector;

-- Memories table for storing user preferences and facts
create table memories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  key text not null,
  value text not null,
  confidence float8 not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Fills table for storing trading data
create table fills (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  hl_address text not null,
  market text not null,
  side text not null,
  price float8 not null,
  qty float8 not null,
  notional_usd float8 not null,
  leverage float8,
  pnl_usd float8,
  ts timestamptz not null
);

-- Profiles table for storing generated trading profiles
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  hl_address text not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  summary text not null,
  data jsonb,
  strategies jsonb,
  created_at timestamptz default now()
);

-- Indexes for better performance
create index idx_memories_user_id on memories(user_id);
create index idx_memories_confidence on memories(confidence);
create index idx_fills_user_id on fills(user_id);
create index idx_fills_hl_address on fills(hl_address);
create index idx_fills_ts on fills(ts);
create index idx_profiles_user_id on profiles(user_id);
create index idx_profiles_hl_address on profiles(hl_address);

-- Vector similarity search function for memories
create or replace function match_memories (
  query_embedding vector(1536),
  match_user_id text,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  user_id text,
  key text,
  value text,
  confidence float8,
  similarity float
)
language sql stable
as $$
  select
    memories.id,
    memories.user_id,
    memories.key,
    memories.value,
    memories.confidence,
    1 - (memories.embedding <=> query_embedding) as similarity
  from memories
  where memories.user_id = match_user_id
    and memories.embedding is not null
    and 1 - (memories.embedding <=> query_embedding) > match_threshold
  order by memories.embedding <=> query_embedding
  limit match_count;
$$;
