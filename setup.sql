-- Smart Bookmark App - Supabase Database Setup

-- Create bookmarks table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  url text not null,
  title text not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- enable RLS
alter table bookmarks enable row level security;

-- Create policy: Users can only see their own bookmarks
create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

-- Create policy: Users can insert their own bookmarks
create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

-- Create policy: Users can delete their own bookmarks
create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Create policy: Users can update their own bookmarks
create policy "Users can update own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id);

-- enable realtime for the bookmarks table
alter publication supabase_realtime add table bookmarks;

-- create index for faster queries
create index bookmarks_user_id_idx on bookmarks(user_id);
create index bookmarks_created_at_idx on bookmarks(created_at desc);