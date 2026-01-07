-- Create support tickets table

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  description text not null,
  category text check (category in ('bug', 'feature_request', 'question', 'other')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);

-- Enable RLS
alter table public.support_tickets enable row level security;

-- RLS Policies
-- Users can view their own tickets
create policy "Users can view their own tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

-- Users can create tickets
create policy "Users can create tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

-- Users can update their own tickets
create policy "Users can update their own tickets"
  on public.support_tickets for update
  using (auth.uid() = user_id);

-- Admin can view all tickets
create policy "Admin can view all tickets"
  on public.support_tickets for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and user_type = 'admin'
    )
  );

-- Admin can update all tickets
create policy "Admin can update all tickets"
  on public.support_tickets for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and user_type = 'admin'
    )
  );

-- Create trigger for updated_at
create trigger handle_support_tickets_updated_at
  before update on public.support_tickets
  for each row
  execute function public.handle_updated_at();

-- Create indexes
create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists support_tickets_priority_idx on public.support_tickets(priority);
