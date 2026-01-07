-- Create jobs table for job postings

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  title text not null,
  description text not null,
  location text,
  work_type text check (work_type in ('remote', 'hybrid', 'onsite')),
  employment_type text check (employment_type in ('full-time', 'part-time', 'contract', 'internship')),
  salary_min integer,
  salary_max integer,
  required_skills text[],
  preferred_skills text[],
  experience_level text,
  education_required text,
  benefits text[],
  status text default 'active' check (status in ('active', 'closed', 'draft')),
  views_count integer default 0,
  applications_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz
);

-- Enable RLS
alter table public.jobs enable row level security;

-- RLS Policies
-- Everyone can view active jobs
create policy "Anyone can view active jobs"
  on public.jobs for select
  using (status = 'active' or auth.uid() = posted_by);

-- HR can create jobs
create policy "HR can create jobs"
  on public.jobs for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and user_type = 'hr'
    )
  );

-- HR can update their own jobs
create policy "HR can update their own jobs"
  on public.jobs for update
  using (auth.uid() = posted_by);

-- HR can delete their own jobs
create policy "HR can delete their own jobs"
  on public.jobs for delete
  using (auth.uid() = posted_by);

-- Admin can manage all jobs
create policy "Admin can manage all jobs"
  on public.jobs for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and user_type = 'admin'
    )
  );

-- Create trigger for updated_at
create trigger handle_jobs_updated_at
  before update on public.jobs
  for each row
  execute function public.handle_updated_at();

-- Create indexes
create index if not exists jobs_posted_by_idx on public.jobs(posted_by);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);
