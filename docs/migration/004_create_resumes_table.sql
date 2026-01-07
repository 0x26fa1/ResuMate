-- Create resumes table for storing uploaded resumes

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  file_name text not null,
  file_url text not null,
  file_size integer,
  analysis_score integer check (analysis_score >= 0 and analysis_score <= 100),
  ats_compatible boolean default false,
  keywords text[],
  missing_keywords text[],
  strengths text[],
  improvements text[],
  analysis_data jsonb, -- Store full AI analysis results
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.resumes enable row level security;

-- RLS Policies
create policy "Users can view their own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resumes"
  on public.resumes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- HR can view resumes of applicants
create policy "HR can view applicant resumes"
  on public.resumes for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and user_type in ('hr', 'admin')
    )
  );

-- Create trigger for updated_at
create trigger handle_resumes_updated_at
  before update on public.resumes
  for each row
  execute function public.handle_updated_at();

-- Create index for faster queries
create index if not exists resumes_user_id_idx on public.resumes(user_id);
create index if not exists resumes_created_at_idx on public.resumes(created_at desc);
