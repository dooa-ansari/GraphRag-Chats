-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- One row per chapter a learner has finished.

create table if not exists public.course_progress (
  user_id      uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  chapter_slug text        not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, chapter_slug)
);

-- Row level security: the public anon key in the website can only ever
-- read, add or remove the logged-in learner's own rows.
alter table public.course_progress enable row level security;

create policy "Learners read their own progress"
  on public.course_progress for select
  using (auth.uid() = user_id);

create policy "Learners add their own progress"
  on public.course_progress for insert
  with check (auth.uid() = user_id);

create policy "Learners update their own progress"
  on public.course_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Learners remove their own progress"
  on public.course_progress for delete
  using (auth.uid() = user_id);
