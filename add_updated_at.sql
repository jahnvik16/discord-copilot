alter table bot_config 
add column if not exists updated_at timestamp with time zone default now();
