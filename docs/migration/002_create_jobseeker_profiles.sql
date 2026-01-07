-- Create job seeker specific profile data

create table if not exists public.jobseeker_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  technical_skills text[], -- Array of skills
  soft_skills text[],
  preferred_role text,
  work_type text[], -- remote, hybrid, onsite
  salary_min integer,
  salary_max integer,
  availability text,
  years_experience integer,
  education text,
  certifications text[],
  portfolio_url text,
  linkedin_url text,
  github_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.jobseeker_profiles enable row level security;

-- RLS Policies
create policy "Job seekers can view their own profile"
  on public.jobseeker_profiles for select
  using (auth.uid() = id);

create policy "Job seekers can update their own profile"
  on public.jobseeker_profiles for update
  using (auth.uid() = id);

create policy "Job seekers can insert their own profile"
  on public.jobseeker_profiles for insert
  with check (auth.uid() = id);

-- HR can view job seeker profiles
create policy "HR can view job seeker profiles"
  on public.jobseeker_profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and user_type = 'hr'
    )
  );

-- Create trigger for updated_at
create trigger handle_jobseeker_profiles_updated_at
  before update on public.jobseeker_profiles
  for each row
  execute function public.handle_updated_at();
