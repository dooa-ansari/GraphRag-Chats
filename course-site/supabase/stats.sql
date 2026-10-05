-- Handy queries for the Supabase SQL Editor. They run as the project owner,
-- so they see every learner (the website itself never can).

-- Sign-ups and logins
select email, created_at as signed_up, last_sign_in_at as last_login
from auth.users
order by last_sign_in_at desc nulls last;

-- How many learners finished each chapter
select chapter_slug, count(*) as learners
from public.course_progress
group by chapter_slug
order by learners desc;

-- Each learner's progress
select u.email, count(p.chapter_slug) as chapters_done, max(p.completed_at) as last_activity
from auth.users u
left join public.course_progress p on p.user_id = u.id
group by u.email
order by chapters_done desc;
