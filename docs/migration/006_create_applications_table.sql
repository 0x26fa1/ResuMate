-- Create applications table for job applications

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  cover_letter text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'interviewed', 'offered', 'rejected', 'withdrawn')),
  match_score integer check (match_score >= 0 and match_score <= 100),
  hr_notes text,
  hr_rating integer check (hr_rating >= 1 and hr_rating <= 5),
  interview_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_id, applicant_id) -- Prevent duplicate applications
);

-- Enable RLS
alter table public.applications enable row level security;

-- RLS Policies
-- Applicants can view their own applications
create policy "Applicants can view their own applications"
  on public.applications for select
  using (auth.uid() = applicant_id);

-- Applicants can create applications
create policy "Applicants can create applications"
  on public.applications for insert
  with check (auth.uid() = applicant_id);

-- Applicants can update their own applications (withdraw)
create policy "Applicants can update their own applications"
  on public.applications for update
  using (auth.uid() = applicant_id);

-- HR can view applications for their jobs
create policy "HR can view applications for their jobs"
  on public.applications for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
      and jobs.posted_by = auth.uid()
    )
  );

-- HR can update applications for their jobs
create policy "HR can update applications for their jobs"
  on public.applications for update
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
      and jobs.posted_by = auth.uid()
    )
  );

-- Admin can view all applications
create policy "Admin can view all applications"
  on public.applications for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and user_type = 'admin'
    )
  );

-- Create trigger for updated_at
create trigger handle_applications_updated_at
  before update on public.applications
  for each row
  execute function public.handle_updated_at();

-- Create function to increment application count
create or replace function public.increment_application_count()
returns trigger
language plpgsql
as $$
begin
  update public.jobs
  set applications_count = applications_count + 1
  where id = new.job_id;
  return new;
end;
$$;

-- Create trigger to increment application count
create trigger increment_job_applications
  after insert on public.applications
  for each row
  execute function public.increment_application_count();

-- Create indexes
create index if not exists applications_job_id_idx on public.applications(job_id);
create index if not exists applications_applicant_id_idx on public.applications(applicant_id);
create index if not exists applications_status_idx on public.applications(status);
