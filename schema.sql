-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create table: bot_config
create table if not exists bot_config (
  id bigint primary key generated always as identity,
  system_instructions text,
  discord_channel_id text
);

-- Create table: chat_memory
create table if not exists chat_memory (
  id bigint primary key generated always as identity,
  user_id text,
  message text,
  summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table: knowledge_base
create table if not exists knowledge_base (
  id bigint primary key generated always as identity,
  content text,
  embedding vector(768) -- Standard dimension for Gemini text-embedding-004
);
