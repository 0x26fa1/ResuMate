-- Create HR specific profile data

create table if not exists public.hr_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null,
  company_description text,
  industry text,
  company_size text,
  company_website text,
  department text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.hr_profiles enable row level security;

-- RLS Policies
create policy "HR can view their own profile"
  on public.hr_profiles for select
  using (auth.uid() = id);

create policy "HR can update their own profile"
  on public.hr_profiles for update
  using (auth.uid() = id);

create policy "HR can insert their own profile"
  on public.hr_profiles for insert
  with check (auth.uid() = id);

-- Admin can view all HR profiles
create policy "Admin can view all HR profiles"
  on public.hr_profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and user_type = 'admin'
    )
  );

-- Create trigger for updated_at
create trigger handle_hr_profiles_updated_at
  before update on public.hr_profiles
  for each row
  execute function public.handle_updated_at();
