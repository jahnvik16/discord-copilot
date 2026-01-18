-- Create table: bot_status
create table if not exists bot_status (
    id bigint primary key,
    connected boolean default false,
    last_heartbeat timestamp with time zone default now()
);

-- Insert initial row for the bot (ID 1)
insert into bot_status (id, connected, last_heartbeat)
values (1, false, now())
on conflict (id) do nothing;
