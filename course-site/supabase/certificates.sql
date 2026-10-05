-- Run once in the Supabase dashboard, after schema.sql:
-- SQL Editor -> New query -> paste -> Run.
-- One certificate of completion per learner.

create table if not exists public.certificates (
  id         text        primary key default ('RA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  user_id    uuid        not null unique default auth.uid() references auth.users (id) on delete cascade,
  name       text        not null check (char_length(btrim(name)) between 2 and 80),
  issued_at  timestamptz not null default now()
);

alter table public.certificates enable row level security;

create policy "Learners read their own certificate"
  on public.certificates for select
  using (auth.uid() = user_id);

-- A certificate can only be created once all 12 chapters are marked complete.
create policy "Learners who finished the course create their certificate"
  on public.certificates for insert
  with check (
    auth.uid() = user_id
    and (select count(*) from public.course_progress p where p.user_id = auth.uid()) >= 12
  );

-- Learners may fix a typo in their name, and nothing else.
create policy "Learners fix the name on their certificate"
  on public.certificates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
revoke update on public.certificates from anon, authenticated;
grant update (name) on public.certificates to authenticated;

-- The public check page (rehbarai.com/certificate/RA-...) looks up one
-- certificate by its ID. Nobody can list all certificates.
create or replace function public.certificate_by_id(cert_id text)
returns table (id text, name text, issued_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.issued_at from public.certificates c where c.id = upper(btrim(cert_id));
$$;

grant execute on function public.certificate_by_id(text) to anon, authenticated;
