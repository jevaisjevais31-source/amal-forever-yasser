
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated"
  on public.profiles for select to authenticated using (true);
create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- FRIENDSHIPS
create type public.friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
alter table public.friendships enable row level security;

create policy "View own friendships"
  on public.friendships for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Send friend requests"
  on public.friendships for insert to authenticated
  with check (auth.uid() = requester_id);
create policy "Respond to friend requests"
  on public.friendships for update to authenticated
  using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy "Delete own friendships"
  on public.friendships for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index messages_pair_idx on public.messages (sender_id, receiver_id, created_at desc);
create index messages_receiver_idx on public.messages (receiver_id, created_at desc);

create policy "View own messages"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Send messages"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);
create policy "Mark received messages as read"
  on public.messages for update to authenticated
  using (auth.uid() = receiver_id);

-- REALTIME
alter table public.profiles replica identity full;
alter table public.friendships replica identity full;
alter table public.messages replica identity full;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.messages;

-- STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true);

create policy "Chat images public read"
  on storage.objects for select to public
  using (bucket_id = 'chat-images');
create policy "Authenticated can upload chat images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-images');
create policy "Users delete own chat images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chat-images' and auth.uid()::text = (storage.foldername(name))[1]);
